const { React, Icons, UI, PROJECT_STATUSES, AppContext } = window;
const { useState, useMemo, useContext, useEffect, useRef } = React;

const StatusSelect = ({ status, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => { if (ref.current && !ref.current.contains(event.target)) setIsOpen(false); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const currentStatus = PROJECT_STATUSES[status] || PROJECT_STATUSES['open'];
    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setIsOpen(!isOpen)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold uppercase transition-all hover:opacity-80 ${currentStatus.color}`}>
                <span>{currentStatus.label}</span>
                <Icons.ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border dark:border-gray-700 z-50 overflow-hidden animate-in">
                    {Object.entries(PROJECT_STATUSES).map(([key, val]) => (
                        <button key={key} onClick={() => { onChange(key); setIsOpen(false); }} className={`w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 ${key === status ? 'bg-gray-50 dark:bg-gray-700' : ''}`}>
                            <span className={`w-2 h-2 rounded-full ${val.dot}`}></span>
                            <span className="text-gray-700 dark:text-gray-200">{val.label}</span>
                            {key === status && <Icons.Check size={14} className="ml-auto text-blue-500" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const StatusLogModal = ({ isOpen, onClose, onConfirm }) => {
    const [comment, setComment] = useState('');
    if (!isOpen) return null;

    return (
        <UI.Modal title="Actualización de Estado" onClose={() => onConfirm(undefined)}>
            <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">¿Deseas añadir un comentario al diario del proyecto sobre este cambio?</p>
                <textarea
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    rows="3"
                    placeholder="Comentario opcional..."
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                    <UI.Button variant="ghost" onClick={() => onConfirm(undefined)}>Cancelar</UI.Button>
                    <UI.Button variant="secondary" onClick={() => onConfirm(null)}>Omitir</UI.Button>
                    <UI.Button onClick={() => { onConfirm(comment); setComment(''); }}>Guardar</UI.Button>
                </div>
            </div>
        </UI.Modal>
    );
};

const ProjectJournal = ({ projectId }) => {
    const { projectLogs, addProjectLog } = useContext(AppContext);
    const [newLog, setNewLog] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const logs = useMemo(() => projectLogs.filter(l => l.project_id === projectId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)), [projectLogs, projectId]);

    const handleAddLog = async () => {
        if (!newLog.trim()) return;
        await addProjectLog({ project_id: projectId, content: newLog });
        setNewLog('');
    };

    return (
        <div className="mt-4 border-t dark:border-gray-700 pt-4">
            <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors mb-2">
                <Icons.BookOpen size={16} /> Diario de Proyecto ({logs.length})
                <Icons.ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            {isExpanded && (
                <div className="animate-in space-y-3">
                    <div className="flex gap-2">
                        <textarea
                            className="w-full p-2 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
                            rows="2"
                            placeholder="Escribe una nota rápida de seguimiento..."
                            value={newLog}
                            onChange={(e) => setNewLog(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddLog(); } }}
                        />
                        <UI.Button onClick={handleAddLog} disabled={!newLog.trim()}><Icons.Send size={16} /></UI.Button>
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {logs.length === 0 && <p className="text-xs text-gray-400 italic">No hay entradas en el diario.</p>}
                        {logs.map(log => (
                            <div key={log.id} className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded text-sm border dark:border-gray-700">
                                <div className="text-[10px] text-gray-400 mb-1">{new Date(log.created_at).toLocaleString()}</div>
                                <div className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{log.content}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const CreateProjectModal = ({ clients, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [clientIdInput, setClientIdInput] = useState('');
    const [foundClient, setFoundClient] = useState(null);
    const [clientError, setClientError] = useState('');
    const [jira, setJira] = useState('');
    const [doc, setDoc] = useState('');
    const [color, setColor] = useState('#3b82f6');

    const searchClient = () => {
        const match = clients.find(c => c.custom_id === clientIdInput || c.id.toString() === clientIdInput);
        if (match) {
            setFoundClient(match);
            setClientError('');
        } else {
            setFoundClient(null);
            setClientError('Cliente no encontrado');
        }
    };

    return (
        <UI.Modal title="Nuevo Proyecto" onClose={onClose}>
            <div className="space-y-4">
                <div><label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nombre del Proyecto <span className="text-red-500">*</span></label><input className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" value={name} onChange={e => setName(e.target.value)} autoFocus /></div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">ID Cliente <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                        <input className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: STD-001" value={clientIdInput} onChange={e => { setClientIdInput(e.target.value); setFoundClient(null); setClientError(''); }} onBlur={searchClient} />
                        <UI.Button onClick={searchClient} variant="secondary">Buscar</UI.Button>
                    </div>
                    {foundClient && <div className="mt-1 text-sm text-green-600 flex items-center gap-1"><Icons.CheckCircle size={12} /> {foundClient.name} ({foundClient.company})</div>}
                    {clientError && <div className="mt-1 text-sm text-red-500 flex items-center gap-1"><Icons.AlertCircle size={12} /> {clientError}</div>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Enlace JIRA</label><input placeholder="https://..." className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" value={jira} onChange={e => setJira(e.target.value)} /></div>
                    <div><label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Documentación</label><input placeholder="https://..." className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" value={doc} onChange={e => setDoc(e.target.value)} /></div>
                </div>
                <div className="flex items-center gap-2"><label className="text-sm font-semibold text-gray-500 uppercase">Color:</label><input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-8 w-16 p-0 border-0 rounded-lg cursor-pointer" /></div>
                <div className="flex justify-end gap-2 pt-2"><UI.Button variant="ghost" onClick={onClose}>Cancelar</UI.Button><UI.Button variant="primary" onClick={() => onSave({ name, client_id: foundClient.id, color, jira_link: jira, doc_link: doc, status: 'open' })} disabled={!name || !foundClient}>Crear Proyecto</UI.Button></div>
            </div>
        </UI.Modal>
    );
};

window.ProjectComponents = {
    StatusSelect,
    StatusLogModal,
    ProjectJournal,
    CreateProjectModal
};
