const { React, ReactDOM, Icons, UI, TASK_STATUSES, AppContext } = window;
const { useState, useEffect, useContext, useRef } = React;

const SubtaskListQuickAdd = ({ taskId }) => {
    const { addSubtask } = useContext(AppContext);
    const [title, setTitle] = useState('');

    const handleKeyDown = async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (!title.trim()) return;
            await addSubtask({ task_id: taskId, title });
            setTitle('');
        }
    };

    const handleClick = async () => {
        if (!title.trim()) return;
        await addSubtask({ task_id: taskId, title });
        setTitle('');
    }

    return (
        <div className="flex items-center gap-2 mt-2">
            <Icons.Plus size={14} className="text-gray-400" />
            <input
                type="text"
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-600 dark:text-gray-300 placeholder-gray-400"
                placeholder="Añadir paso..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
            />
            {title && (
                <button onClick={handleClick} className="text-blue-500 hover:text-blue-700"><Icons.ArrowRight size={14} /></button>
            )}
        </div>
    );
};

const SubtaskStatusSelect = ({ status, comment, onChange }) => {
    const current = TASK_STATUSES[status] || TASK_STATUSES['todo'];
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [localComment, setLocalComment] = useState(comment || '');

    useEffect(() => { setLocalComment(comment || ''); }, [comment]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target) && !event.target.closest('.subtask-dropdown-menu')) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const toggle = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isOpen && ref.current) {
            const rect = ref.current.getBoundingClientRect();
            const top = rect.bottom + 5;
            setPosition({ top: top, left: rect.left });
        }
        setIsOpen(!isOpen);
    };

    const handleSelect = (key) => {
        onChange(key, localComment);
        setIsOpen(false);
    };

    const renderIcon = (iconName, size = 16) => {
        switch (iconName) {
            case 'CheckSquare': return <Icons.CheckSquare size={size} />;
            case 'CheckCircle': return <Icons.CheckCircle size={size} />;
            case 'Loader': return <Icons.Loader size={size} className="animate-spin-slow" />;
            case 'Clock': return <Icons.Clock size={size} />;
            case 'Archive': return <Icons.Archive size={size} />;
            case 'Square': return <Icons.Square size={size} />;
            default: return <Icons.Circle size={size} />;
        }
    };

    const tooltip = `${current.label}${comment ? `\n\nNota: ${comment}` : ''}`;

    return (
        <>
            <button
                ref={ref}
                onClick={toggle}
                className={`p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${current.color}`}
                title={tooltip}
            >
                {renderIcon(current.icon, 16)}
            </button>

            {isOpen && ReactDOM.createPortal(
                <div
                    className="subtask-dropdown-menu fixed bg-white dark:bg-slate-800 rounded-lg shadow-xl border dark:border-gray-700 z-[9999] py-1 w-40 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                    style={{ top: position.top, left: position.left }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {['todo', 'in_progress', 'waiting_for', 'done'].map((key) => {
                        const val = TASK_STATUSES[key];
                        return (
                            <button
                                key={key}
                                onClick={() => handleSelect(key)}
                                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 ${key === status ? 'bg-blue-50 dark:bg-blue-900/20 font-bold' : ''} ${val.color}`}
                            >
                                {renderIcon(val.icon, 14)}
                                {val.label}
                            </button>
                        );
                    })}
                    <div className="p-2 border-t dark:border-gray-700">
                        <textarea
                            className="w-full text-xs p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 resize-none outline-none focus:border-blue-500 transition-colors"
                            placeholder="Comentario opcional..."
                            rows="2"
                            value={localComment}
                            onChange={e => setLocalComment(e.target.value)}
                            onClick={e => e.stopPropagation()}
                        />
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

const TaskItem = ({ task, onToggle, onSetFocus, onEdit, isBlocked, blockedBy, contextName, projectName, clientName, onDelete, onAddToDay }) => {
    const { subtasks, updateSubtask, updateTask, tasks, dependencies } = useContext(AppContext);
    const [isHovered, setIsHovered] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [tempTitle, setTempTitle] = useState(task.title);

    const taskSubtasks = subtasks
        .filter(s => s.task_id === task.id)
        .sort((a, b) => (a.position || 0) - (b.position || 0));

    const completedSubtasks = taskSubtasks.filter(s => s.status === 'done').length;
    const totalSubtasks = taskSubtasks.length;
    const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

    const getStatusIcon = () => {
        if (task.status === 'done') return <div className="bg-green-500 text-white rounded-full p-0.5"><Icons.Check size={12} /></div>;
        if (task.status === 'waiting_for') return <Icons.Clock size={16} className="text-orange-500" />;
        if (task.status === 'someday') return <Icons.Archive size={16} className="text-purple-400" />;
        if (isBlocked) return <Icons.Lock size={16} className="text-gray-400" />;
        return <div className={`w-4 h-4 rounded-full border-2 ${task.priority === 'high' ? 'border-red-500' : task.priority === 'medium' ? 'border-orange-500' : 'border-gray-300'}`} />;
    };

    const handleSubtaskStatusChange = (sub, newStatus, newComment) => {
        updateSubtask(sub.id, { status: newStatus, status_comment: newComment });
    };

    const cyclePriority = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const map = { high: 'medium', medium: 'low', low: 'high' };
        const newPriority = map[task.priority] || 'medium';
        updateTask(task.id, { priority: newPriority });
    };

    const activeBlockers = dependencies
        .filter(d => d.task_id === task.id)
        .map(d => tasks.find(t => t.id === d.blocked_by_task_id))
        .filter(t => t && t.status !== 'done');

    const isReallyBlocked = activeBlockers.length > 0;

    return (
        <div className={`group flex flex-col p-3 mb-2 rounded-lg bg-white dark:bg-slate-800 border border-gray-100 dark:border-gray-700 shadow-sm transition-all ${isReallyBlocked ? 'opacity-60 bg-gray-50 dark:bg-gray-900 border-red-100 dark:border-red-900/30' : 'hover:shadow-md'}`} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
            <div className="flex items-start gap-3">
                <button onClick={() => !isReallyBlocked && onToggle(task.id)} disabled={isReallyBlocked} className={`flex-shrink-0 w-6 h-6 mt-1 flex items-center justify-center rounded-full transition-colors ${isReallyBlocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}>{getStatusIcon()}</button>
                <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        {isEditingTitle ? (
                            <input
                                autoFocus
                                className="flex-1 bg-transparent border-b border-blue-500 outline-none text-gray-800 dark:text-gray-100 font-medium"
                                value={tempTitle}
                                onChange={e => setTempTitle(e.target.value)}
                                onBlur={() => {
                                    if (tempTitle.trim() && tempTitle !== task.title) {
                                        updateTask(task.id, { title: tempTitle });
                                    }
                                    setIsEditingTitle(false);
                                }}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        if (tempTitle.trim() && tempTitle !== task.title) {
                                            updateTask(task.id, { title: tempTitle });
                                        }
                                        setIsEditingTitle(false);
                                    } else if (e.key === 'Escape') {
                                        setTempTitle(task.title);
                                        setIsEditingTitle(false);
                                    }
                                }}
                            />
                        ) : (
                            <span
                                onClick={() => setIsEditingTitle(true)}
                                className={`font-medium truncate cursor-text ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800 dark:text-slate-200 dark:text-gray-100'}`}
                                title={task.title}
                            >
                                <UI.Linkify text={task.title} />
                            </span>
                        )}
                        {contextName && <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300">@{contextName}</span>}
                        {task.status === 'waiting_for' && task.reminder_freq && <span className="flex items-center text-[10px] text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded"><Icons.Bell size={10} className="mr-1" /> {task.reminder_freq}</span>}
                        {task.scheduled_date && (<span className="flex items-center text-[10px] text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded" title="Programada"><Icons.Calendar size={10} className="mr-1" /> {new Date(task.scheduled_date).toLocaleDateString()}</span>)}
                    </div>

                    {task.description && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2"><UI.Linkify text={task.description} /></div>}

                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        {isReallyBlocked && (
                            <div className="text-red-500 flex flex-col gap-0.5">
                                {activeBlockers.map(b => (
                                    <span key={b.id} className="flex items-center gap-1 font-semibold"><Icons.Lock size={10} /> Bloqueado por: {b.title}</span>
                                ))}
                            </div>
                        )}
                        {!isReallyBlocked && (
                            <>
                                <UI.PriorityBadge priority={task.priority} onClick={cyclePriority} />
                                {projectName && <span className="flex items-center gap-1 font-medium text-blue-500"><Icons.Hash size={10} /> {projectName}</span>}
                                {clientName && <span className="flex items-center gap-1 font-medium text-purple-500"><Icons.User size={10} /> {clientName}</span>}
                                {totalSubtasks > 0 && (
                                    <button onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} className={`flex items-center gap-1 hover:text-blue-500 transition-colors ${isExpanded ? 'text-blue-600 font-bold' : ''}`}>
                                        <Icons.CheckSquare size={10} /> {completedSubtasks}/{totalSubtasks}
                                        <div className="w-16 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden ml-1">
                                            <div className="h-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
                                        </div>
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {isExpanded && !isReallyBlocked && (
                    <div className="ml-9 mt-1 mb-2 space-y-1 bg-gray-50/50 dark:bg-gray-900/30 p-2 rounded-lg border border-dashed dark:border-gray-700 animate-in slide-in-from-top-1">
                        {taskSubtasks.map(sub => (
                            <div key={sub.id} className="flex items-center gap-2 group/sub py-0.5">
                                <SubtaskStatusSelect
                                    status={sub.status}
                                    comment={sub.status_comment}
                                    onChange={(newStatus, newComment) => handleSubtaskStatusChange(sub, newStatus, newComment)}
                                />
                                <span className={`text-xs flex-1 ${sub.status === 'done' ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                    <UI.Linkify text={sub.title} />
                                </span>
                            </div>
                        ))}
                        <SubtaskListQuickAdd taskId={task.id} />
                    </div>
                )}
            </div>

            <div className={`flex items-center gap-2 transition-opacity duration-200 mt-2 ${isHovered ? 'opacity-100' : 'opacity-0 md:opacity-0'}`}>
                <button onClick={() => onEdit(task)} className="p-1 text-gray-400 hover:text-blue-500 transition-colors" title="Editar"><Icons.Settings size={14} /></button>
                <button onClick={() => onSetFocus(task)} className="p-1 text-gray-400 hover:text-indigo-500 transition-colors" title="Enfocar"><Icons.Zap size={14} /></button>
                {task.status !== 'done' && !task.is_today && <button onClick={() => onAddToDay(task.id)} className="p-1 text-gray-400 hover:text-green-500 transition-colors" title="Añadir a Mi Día"><Icons.CalendarCheck size={14} /></button>}
                <button onClick={() => onDelete(task.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors" title="Eliminar"><Icons.Trash2 size={14} /></button>
            </div>
        </div>
    );
};

const SubtaskList = ({ taskId }) => {
    const { subtasks, addSubtask, updateSubtask, deleteSubtask, reorderSubtasks, setSubtasks } = useContext(AppContext);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [newSubtaskDesc, setNewSubtaskDesc] = useState('');
    const [editSubtaskId, setEditSubtaskId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');

    const taskSubtasks = subtasks
        .filter(s => s.task_id === taskId)
        .sort((a, b) => (a.position || 0) - (b.position || 0));

    const handleAdd = async () => {
        if (!newSubtaskTitle.trim()) return;
        await addSubtask({ task_id: taskId, title: newSubtaskTitle, description: newSubtaskDesc });
        setNewSubtaskTitle('');
        setNewSubtaskDesc('');
    };

    const startEdit = (sub) => {
        setEditSubtaskId(sub.id);
        setEditTitle(sub.title);
        setEditDesc(sub.description || '');
    };

    const saveEdit = async (id) => {
        await updateSubtask(id, { title: editTitle, description: editDesc });
        setEditSubtaskId(null);
    };

    const moveSubtask = (index, direction) => {
        const newOrder = [...taskSubtasks];
        if (direction === 'up' && index > 0) {
            [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
        } else if (direction === 'down' && index < newOrder.length - 1) {
            [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
        } else { return; }

        const updatedGlobalSubtasks = subtasks.map(s => {
            const foundInNewOrder = newOrder.findIndex(item => item.id === s.id);
            if (foundInNewOrder !== -1) return { ...s, position: foundInNewOrder };
            return s;
        });

        setSubtasks(updatedGlobalSubtasks);
        reorderSubtasks(newOrder.map(s => s.id));
    };

    const handleStatusChange = (sub, newStatus, newComment) => {
        updateSubtask(sub.id, { status: newStatus, status_comment: newComment });
    };

    return (
        <div className="mt-4 pt-4 border-t dark:border-gray-700">
            <h5 className="text-xs font-bold uppercase text-gray-500 mb-2">Checklist / Subtareas</h5>
            <div className="space-y-2 mb-3">
                {taskSubtasks.map((sub, index) => (
                    <div key={sub.id} className="flex flex-col gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg group transition-all">
                        {editSubtaskId === sub.id ? (
                            <div className="space-y-2">
                                <input className="w-full p-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={editTitle} onChange={e => setEditTitle(e.target.value)} autoFocus />
                                <textarea className="w-full p-1 text-xs border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none" rows="2" placeholder="Descripción de subtarea..." value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                                <div className="flex justify-end gap-2">
                                    <UI.Button size="xs" variant="ghost" onClick={() => setEditSubtaskId(null)}><Icons.X size={14} /></UI.Button>
                                    <UI.Button size="xs" onClick={() => saveEdit(sub.id)}><Icons.Check size={14} /></UI.Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start gap-2">
                                <div className="flex flex-col gap-0.5 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => moveSubtask(index, 'up')} disabled={index === 0} className="text-gray-400 hover:text-blue-500 disabled:opacity-30 disabled:cursor-not-allowed"><Icons.ChevronUp size={12} /></button>
                                    <button onClick={() => moveSubtask(index, 'down')} disabled={index === taskSubtasks.length - 1} className="text-gray-400 hover:text-blue-500 disabled:opacity-30 disabled:cursor-not-allowed"><Icons.ChevronDown size={12} /></button>
                                </div>
                                <SubtaskStatusSelect status={sub.status} comment={sub.status_comment} onChange={(val, comm) => handleStatusChange(sub, val, comm)} />
                                <div className="flex-1 min-w-0 pt-0.5">
                                    <div className={`text-sm ${sub.status === 'done' ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}><UI.Linkify text={sub.title} /></div>
                                    {sub.description && <div className="text-xs text-gray-500 dark:text-gray-400 truncate"><UI.Linkify text={sub.description} /></div>}
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => startEdit(sub)} className="text-gray-400 hover:text-blue-500"><Icons.Edit2 size={14} /></button>
                                    <button onClick={() => deleteSubtask(sub.id)} className="text-gray-400 hover:text-red-500"><Icons.Trash2 size={14} /></button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <div className="flex flex-col gap-2">
                <input className="w-full p-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Añadir paso..." value={newSubtaskTitle} onChange={(e) => setNewSubtaskTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }} />
                {newSubtaskTitle && (<textarea className="w-full p-1.5 text-xs border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none" rows="2" placeholder="Descripción (opcional)..." value={newSubtaskDesc} onChange={(e) => setNewSubtaskDesc(e.target.value)} />)}
                <UI.Button type="button" size="sm" onClick={handleAdd} disabled={!newSubtaskTitle}><Icons.Plus size={16} /> Añadir Subtarea</UI.Button>
            </div>
        </div>
    );
};

const TaskEditModal = ({ task, onClose, onOpenWaitModal }) => {
    const { updateTask, projects, clients, contexts, dependencies, addDependency, removeDependency, tasks } = useContext(AppContext);
    const [formData, setFormData] = useState({ ...task });
    const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
    const handleSave = () => { const isNewWaitingFor = formData.status === 'waiting_for' && task.status !== 'waiting_for'; updateTask(task.id, formData); onClose(); if (isNewWaitingFor) setTimeout(() => onOpenWaitModal(task), 100); };

    const taskBlockers = dependencies.filter(d => d.task_id === task.id);
    const availableTasks = tasks.filter(t => t.id !== task.id && t.status !== 'done' && !taskBlockers.find(d => d.blocked_by_task_id === t.id));

    const relatedTasks = availableTasks.filter(t => {
        if (task.project_id && t.project_id === task.project_id) return true;
        if (task.client_id && t.client_id === task.client_id) return true;
        return false;
    });
    const otherTasks = availableTasks.filter(t => !relatedTasks.includes(t));

    return (
        <UI.Modal title="Editar Tarea" onClose={onClose}>
            <div className="space-y-4">
                <div><label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Título</label><input type="text" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} className="w-full p-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                <div><label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Descripción</label><textarea rows="3" value={formData.description || ''} onChange={(e) => handleChange('description', e.target.value)} className="w-full p-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Detalles de la tarea..."></textarea></div>
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Prioridad</label><div className="flex gap-2">{['high', 'medium', 'low'].map(p => (<button key={p} onClick={() => handleChange('priority', p)} className={`flex-1 py-1 text-xs rounded border ${formData.priority === p ? 'bg-gray-100 dark:bg-gray-600 border-gray-400 font-bold' : 'border-gray-200 dark:border-gray-700'}`}>{p === 'high' ? '🔴' : p === 'medium' ? '🟠' : '🔵'}</button>))}</div></div><div><label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Estado</label><select value={formData.status} onChange={(e) => handleChange('status', e.target.value)} className="w-full p-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"><option value="todo">Próxima Acción</option><option value="in_progress">En Progreso</option><option value="waiting_for">En Espera</option><option value="someday">Algún día/Quizás</option><option value="done">Completado</option></select></div></div>
                <div><label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Proyecto / Cliente</label><select value={formData.project_id || (formData.client_id ? `client-${formData.client_id}` : '')} onChange={(e) => { const val = e.target.value; if (val.startsWith('client-')) { handleChange('client_id', parseInt(val.replace('client-', ''))); handleChange('project_id', null); } else if (val) { handleChange('project_id', parseInt(val)); handleChange('client_id', null); } else { handleChange('project_id', null); handleChange('client_id', null); } }} className="w-full p-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"><option value="">-- Sin Proyecto (Inbox) --</option><optgroup label="Proyectos">{projects.map(p => <option key={p.id} value={p.id}># {p.name}</option>)}</optgroup><optgroup label="Clientes">{clients.map(c => <option key={c.id} value={`client-${c.id}`}>{c.type === 'TAM_premium' ? '👑 ' : '🏢 '} {c.name}</option>)}</optgroup></select></div>
                <div><label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Contexto</label><div className="flex flex-wrap gap-2">{contexts.map(ctx => (<button key={ctx.id} onClick={() => handleChange('context_id', formData.context_id === ctx.id ? null : ctx.id)} className={`px-3 py-1 rounded-full text-sm border flex items-center gap-2 ${formData.context_id === ctx.id ? 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'}`}><Icons.Tag size={12} /> {ctx.name}</button>))}</div></div>
                <div className="pt-2 border-t dark:border-gray-700"><label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Bloqueos y Dependencias</label><div className="space-y-2 mb-2">{taskBlockers.map(d => { const blocker = tasks.find(t => t.id === d.blocked_by_task_id); return (<div key={d.blocked_by_task_id} className="flex justify-between items-center text-xs bg-red-50 dark:bg-red-900/20 p-2 rounded text-red-700 dark:text-red-300"><span className="flex items-center gap-1"><Icons.Lock size={12} /> Bloqueada por: {blocker?.title || 'Tarea desconocida'}</span><button onClick={() => removeDependency(task.id, d.blocked_by_task_id)} className="hover:text-red-900 dark:hover:text-red-100"><Icons.X size={14} /></button></div>) })}</div><select className="w-full p-2 text-xs border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" onChange={(e) => { if (e.target.value) { addDependency(task.id, parseInt(e.target.value)); e.target.value = ''; } }}><option value="">Añadir bloqueo (esta tarea depende de...)</option>{relatedTasks.length > 0 && (<optgroup label="Relacionadas (Mismo Proyecto/Cliente)">{relatedTasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}</optgroup>)}{otherTasks.length > 0 && (<optgroup label="Otras Tareas">{otherTasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}</optgroup>)}</select></div>
                <div className="pt-2 border-t dark:border-gray-700"><label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Programación (Tickler)</label><div className="flex items-center gap-2"><span className="text-gray-500"><Icons.Calendar size={16} /></span><input type="date" className="w-full p-2 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={formData.scheduled_date ? new Date(formData.scheduled_date).toISOString().split('T')[0] : ''} onChange={(e) => handleChange('scheduled_date', e.target.value)} /></div></div>
                <SubtaskList taskId={task.id} />
                <div className="pt-4 flex justify-end gap-2"><UI.Button variant="ghost" onClick={onClose}>Cancelar</UI.Button><UI.Button variant="primary" onClick={handleSave}>Guardar</UI.Button></div>
            </div>
        </UI.Modal>
    );
};

const WaitingForModal = ({ task, onSave, onCancel }) => {
    const [recurrence, setRecurrence] = useState('daily');
    const [customDays, setCustomDays] = useState(2);
    const [customTime, setCustomTime] = useState('09:30');
    const handleSave = () => { let result = ''; if (recurrence === 'daily') result = 'Diariamente (09:30)'; else if (recurrence === 'weekly') result = 'Semanalmente (Lunes)'; else if (recurrence === 'none') result = ''; else if (recurrence === 'custom') result = `Cada ${customDays} días a las ${customTime}`; onSave(result); };
    return (
        <UI.Modal title="Configurar Recordatorio" onClose={onCancel}>
            <div className="space-y-4"><p className="text-sm text-gray-600 dark:text-gray-300">Has marcado "{task.title}" como <strong>En Espera</strong>.</p><div className="space-y-2">{[{ id: 'daily', label: 'Diariamente (09:30 AM)' }, { id: 'weekly', label: 'Semanalmente (Lunes)' }, { id: 'none', label: 'Sin recordatorio' }].map((opt) => (<label key={opt.id} className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer ${recurrence === opt.id ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}`}><input type="radio" name="recurrence" value={opt.id} checked={recurrence === opt.id} onChange={(e) => setRecurrence(e.target.value)} className="text-blue-600" /><span className="text-gray-800 dark:text-slate-200 font-medium text-sm">{opt.label}</span></label>))}<div className={`rounded-lg border transition-colors ${recurrence === 'custom' ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}`}><label className="flex items-center space-x-3 p-3 cursor-pointer"><input type="radio" name="recurrence" value="custom" checked={recurrence === 'custom'} onChange={(e) => setRecurrence(e.target.value)} className="text-blue-600" /><span className="text-gray-800 dark:text-slate-200 font-medium text-sm">Personalizado</span></label>{recurrence === 'custom' && (<div className="px-3 pb-3 ml-7 space-y-3 animate-in"><div className="flex items-center gap-2"><span className="text-sm text-gray-600 dark:text-gray-400">Cada</span><input type="number" min="1" value={customDays} onChange={e => setCustomDays(e.target.value)} className="w-16 p-1 border rounded text-center dark:bg-gray-700 dark:border-gray-600 dark:text-white" /><span className="text-sm text-gray-600 dark:text-gray-400">días</span></div><div className="flex items-center gap-2"><span className="text-sm text-gray-600 dark:text-gray-400">A las</span><input type="time" value={customTime} onChange={e => setCustomTime(e.target.value)} className="p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div></div>)}</div></div><div className="flex justify-end gap-2 pt-2"><UI.Button variant="ghost" onClick={onCancel}>Cancelar</UI.Button><UI.Button variant="primary" onClick={handleSave}>Guardar</UI.Button></div></div>
        </UI.Modal>
    );
};

window.TaskComponents = {
    SubtaskListQuickAdd,
    SubtaskStatusSelect,
    TaskItem,
    SubtaskList,
    TaskEditModal,
    WaitingForModal
};
