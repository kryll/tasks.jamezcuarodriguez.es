const { React, Icons, UI, AppContext } = window;
const { useState, useMemo, useContext } = React;

const DailyBriefing = ({ main, secondaries, onAddToDay, onDismiss }) => {
    if (!main) return null;
    const { projects, clients } = useContext(AppContext);
    const getContextInfo = (task) => {
        const project = projects.find(p => p.id === task.project_id);
        const client = clients.find(c => c.id === task.client_id || (project && project.client_id === c.id));
        if (!project && !client) return null;
        return (
            <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 mb-2">
                {project && <span className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded"><Icons.Hash size={10} /> {project.name}</span>}
                {client && <span className="flex items-center gap-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded"><Icons.User size={10} /> {client.name}</span>}
            </div>
        );
    };
    return (
        <div className="mb-8 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl overflow-hidden shadow-sm animate-in">
            <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400"><Icons.Coffee size={20} /></div>
                        <div><h3 className="font-bold text-gray-800 dark:text-slate-200 text-lg">Tu Enfoque Diario</h3><p className="text-xs text-gray-500 dark:text-gray-400">Sugerencias para un día productivo</p></div>
                    </div>
                    <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><Icons.X size={16} /></button>
                </div>
                <div className="mb-4 bg-white dark:bg-slate-800 p-4 rounded-lg border border-indigo-200 dark:border-indigo-700/50 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                    <span className="absolute top-2 right-2 text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">RECOMENDADO</span>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1 pr-16">{main.title}</h4>
                    {getContextInfo(main)}
                    <div className="flex justify-between items-center mt-3"><UI.PriorityBadge priority={main.priority} /><UI.Button size="xs" variant="primary" onClick={() => onAddToDay(main.id)}><Icons.CalendarCheck size={14} className="mr-1" /> Añadir a Mi Día</UI.Button></div>
                </div>
                {secondaries.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase ml-1">Para completar tu día</p>
                        {secondaries.map(task => (
                            <div key={task.id} className="flex justify-between items-center bg-white/60 dark:bg-gray-800/60 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                                <div className="flex flex-col min-w-0 pr-2">
                                    <div className="flex items-center gap-2 truncate">
                                        <div className={`w-2 h-2 rounded-full ${task.priority === 'high' ? 'bg-red-400' : task.priority === 'medium' ? 'bg-orange-400' : 'bg-blue-400'}`} />
                                        <span className="text-sm text-gray-700 dark:text-gray-200 truncate">{task.title}</span>
                                    </div>
                                    {getContextInfo(task)}
                                </div>
                                <UI.Button size="xs" variant="ghost" className="shrink-0" onClick={() => onAddToDay(task.id)}><Icons.Plus size={14} /></UI.Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const FocusModeOverlay = ({ task, onClose, onComplete }) => (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-gray-900 flex flex-col items-center justify-center p-8 animate-in">
        <div className="max-w-3xl w-full text-center space-y-6">
            <div className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold tracking-wider mb-4">MODO ENFOQUE</div>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">{task.title}</h1>
            {task.description && <div className="text-xl text-gray-500 dark:text-gray-400"><UI.Linkify text={task.description} /></div>}
            <div className="flex justify-center gap-4 pt-8">
                <UI.Button size="lg" variant="ghost" onClick={onClose}>Pausar / Volver</UI.Button>
                <UI.Button size="lg" className="px-8" onClick={() => onComplete(task.id)}><Icons.Check size={20} className="mr-2" /> Completar Tarea</UI.Button>
            </div>
        </div>
    </div>
);

const CreateContextModal = ({ onClose, onSave }) => {
    const [name, setName] = useState('');
    return (
        <UI.Modal title="Nuevo Contexto" onClose={onClose}>
            <div className="space-y-4">
                <input placeholder="Nombre (Ej: @Oficina)" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={name} onChange={e => setName(e.target.value)} autoFocus />
                <div className="flex justify-end gap-2 pt-2">
                    <UI.Button variant="ghost" onClick={onClose}>Cancelar</UI.Button>
                    <UI.Button variant="primary" onClick={() => onSave({ name, icon: 'tag' })} disabled={!name.trim()}>Crear Contexto</UI.Button>
                </div>
            </div>
        </UI.Modal>
    );
};

window.OtherComponents = {
    DailyBriefing,
    FocusModeOverlay,
    CreateContextModal
};
