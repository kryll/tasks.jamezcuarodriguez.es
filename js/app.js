const {
    React, ReactDOM, Icons, UI, CONFIG, api, parseSmartTask,
    TASK_STATUSES, PROJECT_STATUSES, SERVICE_TYPES, AppContext,
    TaskComponents, ClientComponents, ProjectComponents, OtherComponents
} = window;

const { useState, useEffect, useMemo, useRef } = React;

const FocusDeckApp = () => {
    // --- ESTADO ---
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [clients, setClients] = useState([]);
    const [contexts, setContexts] = useState([]);
    const [dependencies, setDependencies] = useState([]);
    const [projectLogs, setProjectLogs] = useState([]);
    const [subtasks, setSubtasks] = useState([]);
    const [notifications, setNotifications] = useState([]);

    const [view, setView] = useState('my_day');
    const [filterId, setFilterId] = useState(null);
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
    const [searchQuery, setSearchQuery] = useState('');
    const [dailyBriefingDismissed, setDailyBriefingDismissed] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [focusTask, setFocusTask] = useState(null);
    const [editingTask, setEditingTask] = useState(null);
    const [waitingModalTask, setWaitingModalTask] = useState(null);
    const [selectedClientId, setSelectedClientId] = useState(null);
    const [newTaskInput, setNewTaskInput] = useState('');
    const [newTaskScheduledDate, setNewTaskScheduledDate] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);

    // --- EFECTOS ---
    useEffect(() => {
        api.getDashboard().then(data => {
            if (!data) return;
            setTasks(data.tasks || []);
            setProjects(data.projects || []);
            setClients(data.clients || []);
            setContexts(data.contexts || []);
            setDependencies(data.dependencies || []);
            setProjectLogs(data.projectLogs || []);
            setSubtasks(data.subtasks || []);
        });
    }, []);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    // --- ACCIONES ---
    const addNotification = (title, message) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, title, message }]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
    };

    const handleAddTask = async (e) => {
        if (e && e.key !== 'Enter') return;
        if (!newTaskInput.trim()) return;

        const smart = parseSmartTask(newTaskInput);
        const task = {
            title: smart.title,
            priority: 'medium',
            status: 'todo',
            project_id: view === 'project' ? filterId : null,
            client_id: view === 'client' ? filterId : null,
            context_id: view === 'context' ? filterId : null,
            is_today: view === 'my_day' || smart.is_today,
            scheduled_date: newTaskScheduledDate || smart.scheduled_date,
            reminder_freq: smart.reminder_freq
        };

        const result = await api.createTask(task);
        if (result) {
            setTasks(prev => [...prev, result]);
            setNewTaskInput('');
            setNewTaskScheduledDate('');
            setShowDatePicker(false);
            addNotification("Tarea Creada", `"${result.title}" añadida correctamente.`);
        }
    };

    const updateTask = async (id, updates) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
        await api.updateTask(id, updates);
    };

    const deleteTask = async (id) => {
        if (!confirm("¿Borrar tarea?")) return;
        setTasks(prev => prev.filter(t => t.id !== id));
        await api.deleteTask(id);
    };

    const toggleTask = (id) => {
        const task = tasks.find(t => t.id === id);
        updateTask(id, { status: task.status === 'done' ? 'todo' : 'done' });
    };

    const addSubtask = async (sub) => {
        const result = await api.createSubtask(sub);
        if (result) setSubtasks(prev => [...prev, result]);
    };

    const updateSubtask = async (id, updates) => {
        setSubtasks(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
        await api.updateSubtask(id, updates);
    };

    const deleteSubtask = async (id) => {
        setSubtasks(prev => prev.filter(s => s.id !== id));
        await api.deleteSubtask(id);
    };

    const addProjectLog = async (log) => {
        const result = await api.addProjectLog(log);
        if (result) setProjectLogs(prev => [...prev, result]);
    };

    const addDependency = async (taskId, blockerId) => {
        setDependencies(prev => [...prev, { task_id: taskId, blocked_by_task_id: blockerId }]);
        await api.addDependency({ task_id: taskId, blocked_by_task_id: blockerId });
    };

    const removeDependency = async (taskId, blockerId) => {
        setDependencies(prev => prev.filter(d => !(d.task_id === taskId && d.blocked_by_task_id === blockerId)));
        await api.deleteDependency(taskId, blockerId);
    };

    // --- MEMOS ---
    const filteredTasks = useMemo(() => {
        let list = tasks;
        const todayStr = new Date().toISOString().split('T')[0];

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return list.filter(t =>
                t.title.toLowerCase().includes(q) ||
                (t.description && t.description.toLowerCase().includes(q))
            );
        }

        if (view === 'my_day') list = list.filter(t => t.is_today && t.status !== 'done');
        else if (view === 'scheduled') list = list.filter(t => t.scheduled_date && t.scheduled_date > todayStr);
        else if (view === 'waiting') list = list.filter(t => t.status === 'waiting_for');
        else if (view === 'someday') list = list.filter(t => t.status === 'someday');
        else if (view === 'inbox') list = list.filter(t => !t.project_id && !t.client_id && !t.is_today && t.status !== 'done');
        else if (view === 'project') list = list.filter(t => t.project_id === filterId);
        else if (view === 'client') list = list.filter(t => t.client_id === filterId);
        else if (view === 'context') list = list.filter(t => t.context_id === filterId);
        else if (view === 'client_tasks') {
            list = list.filter(t => {
                const project = t.project_id ? projects.find(p => p.id === t.project_id) : null;
                const client = t.client_id ? clients.find(c => c.id === t.client_id) : (project ? clients.find(c => c.id === project.client_id) : null);
                const context = t.context_id ? contexts.find(ctx => ctx.id === t.context_id) : null;

                const isTAM = client && client.type === 'TAM_premium';
                const isInbox = !t.client_id && !t.project_id;
                const isPersonal = context && context.name.toLowerCase().includes('personal');

                return isTAM || isInbox || isPersonal;
            });
        }

        return list.sort((a, b) => {
            if (a.status === 'done' && b.status !== 'done') return 1;
            if (a.status !== 'done' && b.status === 'done') return -1;
            const pMap = { high: 3, medium: 2, low: 1 };
            return (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
        });
    }, [tasks, view, filterId, searchQuery, projects, clients, contexts]);

    // --- RENDER ---
    return (
        <AppContext.Provider value={{
            tasks, projects, clients, contexts, dependencies, projectLogs, subtasks,
            updateTask, deleteTask, toggleTask, addSubtask, updateSubtask, deleteSubtask,
            addProjectLog, addDependency, removeDependency, setSubtasks,
            reorderSubtasks: api.reorderSubtasks
        }}>
            <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
                {/* Mobile Menu Button */}
                <button
                    className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-md border dark:border-gray-700"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                    <Icons.Menu size={20} />
                </button>

                {/* Sidebar */}
                <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-800 border-r dark:border-gray-700 transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="flex flex-col h-full p-4">
                        <div className="flex items-center gap-3 mb-8 px-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">🎯</div>
                            <h1 className="text-xl font-bold tracking-tight dark:text-white">FocusDeck</h1>
                        </div>

                        <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
                            <NavItem icon="Sun" label="Mi Día" active={view === 'my_day'} onClick={() => { setView('my_day'); setIsSidebarOpen(false); }} count={tasks.filter(t => t.is_today && t.status !== 'done').length} />
                            <NavItem icon="Inbox" label="Bandeja" active={view === 'inbox'} onClick={() => { setView('inbox'); setIsSidebarOpen(false); }} count={tasks.filter(t => !t.client_id && !t.project_id && !t.is_today && t.status !== 'done').length} />
                            <NavItem icon="Calendar" label="Programadas" active={view === 'scheduled'} onClick={() => { setView('scheduled'); setIsSidebarOpen(false); }} />
                            <NavItem icon="Clock" label="En Espera" active={view === 'waiting'} onClick={() => { setView('waiting'); setIsSidebarOpen(false); }} />
                            <NavItem icon="Star" label="Cartera TAM" active={view === 'client_tasks'} onClick={() => { setView('client_tasks'); setIsSidebarOpen(false); }} />

                            <div className="pt-4 pb-2 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Proyectos</div>
                            {projects.filter(p => p.status !== 'closed').map(p => (
                                <NavItem key={p.id} label={p.name} active={view === 'project' && filterId === p.id} onClick={() => { setView('project'); setFilterId(p.id); setIsSidebarOpen(false); }} dot={p.color} />
                            ))}
                        </nav>

                        <div className="mt-auto pt-4 border-t dark:border-gray-700">
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                {darkMode ? <Icons.Sun size={18} /> : <Icons.Moon size={18} />}
                                <span>{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                    <header className="h-16 flex items-center justify-between px-6 border-b dark:border-gray-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md sticky top-0 z-30">
                        <h2 className="text-lg font-bold dark:text-white truncate">
                            {view === 'my_day' ? 'Mi Día' : view === 'inbox' ? 'Bandeja de Entrada' : view === 'client_tasks' ? 'Cartera TAM' : 'Listado'}
                        </h2>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Icons.Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    className="pl-10 pr-4 py-1.5 bg-gray-100 dark:bg-gray-700 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500 w-40 md:w-64 transition-all"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        <div className="max-w-4xl mx-auto">
                            {/* Input de Tarea */}
                            <div className="mb-8 relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500"><Icons.Plus size={20} /></div>
                                <input
                                    type="text"
                                    className="w-full pl-12 pr-24 py-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-lg transition-all"
                                    placeholder="Escribe algo para hacer hoy..."
                                    value={newTaskInput}
                                    onChange={e => setNewTaskInput(e.target.value)}
                                    onKeyDown={handleAddTask}
                                />
                                {newTaskInput && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                        <UI.Button size="sm" onClick={() => handleAddTask()}>Añadir</UI.Button>
                                    </div>
                                )}
                            </div>

                            {/* Lista de Tareas */}
                            <div className="space-y-1">
                                {filteredTasks.map(task => (
                                    <TaskComponents.TaskItem
                                        key={task.id}
                                        task={task}
                                        onToggle={toggleTask}
                                        onEdit={setEditingTask}
                                        onSetFocus={setFocusTask}
                                        onDelete={deleteTask}
                                        projectName={projects.find(p => p.id === task.project_id)?.name}
                                        clientName={clients.find(c => c.id === task.client_id)?.name}
                                        onAddToDay={(id) => updateTask(id, { is_today: true })}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </main>

                {/* Modales */}
                {editingTask && (
                    <TaskComponents.TaskEditModal
                        task={editingTask}
                        onClose={() => setEditingTask(null)}
                        onOpenWaitModal={setWaitingModalTask}
                    />
                )}

                {focusTask && (
                    <OtherComponents.FocusModeOverlay
                        task={focusTask}
                        onClose={() => setFocusTask(null)}
                        onComplete={(id) => { toggleTask(id); setFocusTask(null); }}
                    />
                )}

                <UI.NotificationToast notifications={notifications} onClose={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} />
            </div>
        </AppContext.Provider>
    );
};

const NavItem = ({ icon, label, active, onClick, count, dot }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}
    >
        <div className="flex items-center gap-3">
            {icon ? <Icons[icon] size={18} /> : <div className="w-2.5 h-2.5 rounded-full ml-1" style={{ backgroundColor: dot }} />}
            <span className="truncate">{label}</span>
        </div>
        {count > 0 && <span className="text-[10px] bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full font-bold">{count}</span>}
    </button>
);

ReactDOM.render(<FocusDeckApp />, document.getElementById('root'));
