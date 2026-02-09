const { React, Icons, UI, SERVICE_TYPES, AppContext, TaskComponents } = window;
const { useState, useMemo, useContext } = React;

const ServicesManager = ({ services, onUpdate }) => {
    const [addMode, setAddMode] = useState(false);
    const [newService, setNewService] = useState({ type: 'cloudbuilder', label: '', value: '' });

    const handleAdd = () => {
        if (!newService.value) return;
        const entry = {
            type: newService.type,
            value: newService.value,
            label: newService.type === 'custom' ? newService.label : null
        };
        onUpdate([...(services || []), entry]);
        setAddMode(false);
        setNewService({ type: 'cloudbuilder', label: '', value: '' });
    };

    const handleRemove = (index) => {
        const list = [...(services || [])];
        list.splice(index, 1);
        onUpdate(list);
    };

    return (
        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
            <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2">
                    <Icons.Cloud size={14} /> Servicios
                </h4>
                <button onClick={() => setAddMode(!addMode)} className="text-gray-400 hover:text-blue-500 transition-colors">
                    {addMode ? <Icons.X size={16} /> : <Icons.PlusCircle size={16} />}
                </button>
            </div>

            {addMode && (
                <div className="mb-4 p-3 bg-white dark:bg-slate-800 rounded-lg border shadow-sm animate-in">
                    <select
                        className="w-full p-2 mb-2 text-xs border rounded dark:bg-gray-700 dark:border-gray-600"
                        value={newService.type}
                        onChange={e => setNewService({ ...newService, type: e.target.value })}
                    >
                        {SERVICE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                    {newService.type === 'custom' && (
                        <input
                            placeholder="Etiqueta (ej: CRM)"
                            className="w-full p-2 mb-2 text-xs border rounded dark:bg-gray-700"
                            value={newService.label}
                            onChange={e => setNewService({ ...newService, label: e.target.value })}
                        />
                    )}
                    <input
                        placeholder="ID o URL"
                        className="w-full p-2 mb-2 text-xs border rounded dark:bg-gray-700"
                        value={newService.value}
                        onChange={e => setNewService({ ...newService, value: e.target.value })}
                    />
                    <UI.Button size="sm" className="w-full" onClick={handleAdd}>Añadir Servicio</UI.Button>
                </div>
            )}

            <div className="space-y-2">
                {(services || []).map((s, idx) => {
                    const typeInfo = SERVICE_TYPES.find(t => t.id === s.type);
                    return (
                        <div key={idx} className="flex justify-between items-center p-2 bg-white dark:bg-slate-800 rounded-lg border dark:border-gray-700 group">
                            <div className="flex items-center gap-3">
                                <div className="text-blue-500 font-bold text-[10px] uppercase">{typeInfo?.label || s.type}</div>
                                <div className="text-sm dark:text-gray-200">{s.label ? `${s.label}: ` : ''}{s.value}</div>
                            </div>
                            <button onClick={() => handleRemove(idx)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Icons.Trash2 size={14} />
                            </button>
                        </div>
                    );
                })}
                {(!services || services.length === 0) && <p className="text-xs text-gray-400 italic">No hay servicios vinculados.</p>}
            </div>
        </div>
    );
};

const ClientCard = ({ client, onClick }) => (
    <div
        onClick={() => onClick(client.id)}
        className="group relative bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer overflow-hidden"
    >
        <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <Icons.ExternalLink size={14} className="text-blue-500" />
        </div>
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-slate-700 flex items-center justify-center overflow-hidden border shadow-sm group-hover:scale-105 transition-transform">
                {client.logo ? <img src={client.logo} className="w-full h-full object-cover" /> : <Icons.Building size={24} className="text-gray-300" />}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition-colors uppercase tracking-tight">{client.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono text-gray-400">ID: {client.custom_id || client.id}</span>
                    {client.type === 'TAM_premium' && <span className="text-[10px] bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500 px-1.5 rounded flex items-center gap-1 font-bold"><Icons.Star size={8} fill="currentColor" /> TAM</span>}
                </div>
            </div>
        </div>
    </div>
);

const CreateClientModal = ({ onClose, onSave }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState('standard');
    return (
        <UI.Modal title="Nuevo Cliente" onClose={onClose}>
            <div className="space-y-4">
                <div><label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nombre</label><input className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={name} onChange={e => setName(e.target.value)} autoFocus /></div>
                <div><label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tipo de Servicio</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setType('standard')} className={`p-3 rounded-lg border text-left transition-all ${type === 'standard' ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-100 dark:border-gray-700'}`}><h4 className="font-bold text-sm dark:text-white">Estándar</h4><p className="text-[10px] text-gray-500">Mantenimiento básico y soporte.</p></button>
                        <button onClick={() => setType('TAM_premium')} className={`p-3 rounded-lg border text-left transition-all ${type === 'TAM_premium' ? 'bg-yellow-50 border-yellow-500 dark:bg-yellow-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-100 dark:border-gray-700'}`}><h4 className="font-bold text-sm text-yellow-700 dark:text-yellow-500 flex items-center gap-1"><Icons.Star size={12} fill="currentColor" /> Premium TAM</h4><p className="text-[10px] text-gray-500">Gestión dedicada y SLA crítico.</p></button>
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-2"><UI.Button variant="ghost" onClick={onClose}>Cancelar</UI.Button><UI.Button variant="primary" onClick={() => onSave({ name, type })} disabled={!name.trim()}>Crear Cliente</UI.Button></div>
            </div>
        </UI.Modal>
    );
};

const ClientDetailModal = ({ client, onClose, onUpdateClient, onNavigateProject, onEditTask }) => {
    const { projects, tasks } = useContext(AppContext);
    const isTam = client.type === 'TAM_premium';
    const [activeTab, setActiveTab] = useState('info');
    const [isEditingHeader, setIsEditingHeader] = useState(false);
    const [editHeader, setEditHeader] = useState({ name: '', custom_id: '', logo: '' });
    const [addMode, setAddMode] = useState(null);
    const [newDoc, setNewDoc] = useState({ title: '', url: '' });
    const [newMonitor, setNewMonitor] = useState({ title: '', url: '' });
    const [newContact, setNewContact] = useState({ name: '', email: '', phone: '' });

    const activeProjects = projects.filter(p => p.client_id === client.id && p.status !== 'closed' && p.status !== 'cancelled');
    const completedProjects = projects.filter(p => p.client_id === client.id && (p.status === 'closed' || p.status === 'cancelled'));
    const clientTasks = tasks.filter(t => t.client_id === client.id || (t.project_id && projects.some(p => p.id === t.project_id && p.client_id === client.id)));

    const handleSaveHeader = () => { onUpdateClient(client.id, editHeader); setIsEditingHeader(false); };
    const handleLogoChange = (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setEditHeader({ ...editHeader, logo: reader.result }); reader.readAsDataURL(file); } };
    const handleAddDoc = () => { if (!newDoc.title || !newDoc.url) return; onUpdateClient(client.id, { docs: [...(client.docs || []), newDoc] }); setNewDoc({ title: '', url: '' }); setAddMode(null); };
    const handleAddMonitor = () => { if (!newMonitor.title || !newMonitor.url) return; onUpdateClient(client.id, { monitoring: [...(client.monitoring || []), newMonitor] }); setNewMonitor({ title: '', url: '' }); setAddMode(null); };
    const handleAddContact = () => { if (!newContact.name) return; onUpdateClient(client.id, { contacts: [...(client.contacts || []), newContact] }); setNewContact({ name: '', email: '', phone: '' }); };
    const handleRemoveItem = (field, idx) => { const list = [...(client[field] || [])]; list.splice(idx, 1); onUpdateClient(client.id, { [field]: list }); };

    const renderHeader = () => (
        <div className="relative text-center bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border dark:border-gray-700">
            {!isEditingHeader && <button onClick={() => { setEditHeader({ name: client.name, custom_id: client.custom_id || '', logo: client.logo }); setIsEditingHeader(true); }} className="absolute top-2 right-2 text-gray-400 hover:text-blue-500"><Icons.Edit2 size={16} /></button>}
            {isEditingHeader ? (
                <div className="space-y-3 animate-in">
                    <div className="w-20 h-20 mx-auto bg-white dark:bg-gray-600 rounded-xl flex items-center justify-center overflow-hidden border border-dashed border-blue-400 relative group">
                        {editHeader.logo ? <img src={editHeader.logo} className="w-full h-full object-cover opacity-50" /> : <Icons.Upload size={24} className="text-blue-500" />}
                        <input type="file" accept="image/*" onChange={handleLogoChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className="text-[10px] font-bold text-blue-700">CAMBIAR</span></div>
                    </div>
                    <input className="w-full p-1 text-center font-bold border rounded dark:bg-gray-700 dark:border-gray-600" value={editHeader.name} onChange={e => setEditHeader({ ...editHeader, name: e.target.value })} placeholder="Nombre Cliente" />
                    <input className="w-full p-1 text-center text-xs font-mono border rounded dark:bg-gray-700 dark:border-gray-600" value={editHeader.custom_id} onChange={e => setEditHeader({ ...editHeader, custom_id: e.target.value })} placeholder="ID (ej: STD-001)" />
                    <div className="flex gap-2 justify-center"><UI.Button size="xs" variant="ghost" onClick={() => setIsEditingHeader(false)}>Cancelar</UI.Button><UI.Button size="xs" onClick={handleSaveHeader}>Guardar</UI.Button></div>
                </div>
            ) : (
                <><div className="w-20 h-20 mx-auto bg-white dark:bg-slate-700 rounded-xl mb-3 flex items-center justify-center overflow-hidden border shadow-sm">{client.logo ? <img src={client.logo} className="w-full h-full object-cover" /> : <Icons.Building size={40} className="text-gray-300" />}</div><h2 className="text-lg font-bold dark:text-white leading-tight">{client.name}</h2><span className="text-xs text-gray-500 font-mono">ID: {client.custom_id || client.id}</span></>
            )}
        </div>
    );

    const renderDocs = () => (
        <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border dark:border-gray-700">
            <div className="flex justify-between items-center mb-3"><h4 className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2"><Icons.FileText size={14} /> Documentación</h4><button onClick={() => setAddMode(addMode === 'doc' ? null : 'doc')} className="text-gray-400 hover:text-blue-500"><Icons.PlusCircle size={16} /></button></div>
            {addMode === 'doc' && (<div className="mb-2 p-2 bg-white dark:bg-slate-800 rounded border animate-in"><input placeholder="Título" className="w-full p-1 mb-1 text-xs border rounded dark:bg-gray-700" value={newDoc.title} onChange={e => setNewDoc({ ...newDoc, title: e.target.value })} /><input placeholder="https://..." className="w-full p-1 mb-1 text-xs border rounded dark:bg-gray-700" value={newDoc.url} onChange={e => setNewDoc({ ...newDoc, url: e.target.value })} /><UI.Button size="xs" onClick={handleAddDoc}>Añadir</UI.Button></div>)}
            <div className="space-y-1">{client.docs && client.docs.map((doc, idx) => (<div key={idx} className="flex justify-between items-center group"><a href={doc.url} target="_blank" className="text-sm text-blue-600 hover:underline flex items-center gap-2 truncate"><Icons.Link size={12} /> {doc.title}</a><button onClick={() => handleRemoveItem('docs', idx)} className="text-red-400 opacity-0 group-hover:opacity-100"><Icons.X size={12} /></button></div>))}{(!client.docs || client.docs.length === 0) && <p className="text-xs text-gray-400 italic">Sin documentación.</p>}</div>
        </div>
    );

    const renderContactsAndTasks = () => (
        <div className="flex-1 flex flex-col">
            <div className="flex border-b dark:border-gray-700 mb-4"><button onClick={() => setActiveTab('info')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'info' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Contactos</button><button onClick={() => setActiveTab('tasks')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'tasks' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Tareas ({clientTasks.filter(t => !t.project_id).length})</button></div>
            <div className="flex-1 overflow-y-auto pr-2 max-h-[350px]">
                {activeTab === 'info' && (
                    <div>
                        <div className="space-y-3 mb-6">{client.contacts && client.contacts.map((contact, idx) => (<div key={idx} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 border dark:border-gray-700 rounded-lg shadow-sm group"><div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold">{contact.name.charAt(0)}</div><div className="flex-1"><div className="font-medium dark:text-white">{contact.name}</div><div className="text-xs text-gray-500 flex flex-col">{contact.email && <span className="flex items-center gap-1"><Icons.Mail size={10} /> {contact.email}</span>}{contact.phone && <span className="flex items-center gap-1"><Icons.Phone size={10} /> {contact.phone}</span>}</div></div><button onClick={() => handleRemoveItem('contacts', idx)} className="text-red-400 opacity-0 group-hover:opacity-100"><Icons.Trash2 size={14} /></button></div>))}{(!client.contacts || client.contacts.length === 0) && <p className="text-sm text-gray-400 italic">No hay contactos registrados.</p>}</div>
                        <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg"><h5 className="text-xs font-bold uppercase text-gray-500 mb-2">Añadir Contacto</h5><div className="grid grid-cols-2 gap-2 mb-2"><input placeholder="Nombre" className="p-2 text-sm border rounded col-span-2 dark:bg-gray-700 dark:border-gray-600" value={newContact.name} onChange={e => setNewContact({ ...newContact, name: e.target.value })} /><input placeholder="Email" className="p-2 text-sm border rounded dark:bg-gray-700 dark:border-gray-600" value={newContact.email} onChange={e => setNewContact({ ...newContact, email: e.target.value })} /><input placeholder="Teléfono" className="p-2 text-sm border rounded dark:bg-gray-700 dark:border-gray-600" value={newContact.phone} onChange={e => setNewContact({ ...newContact, phone: e.target.value })} /></div><UI.Button size="sm" onClick={handleAddContact} disabled={!newContact.name}><Icons.Plus size={14} className="mr-1" /> Añadir</UI.Button></div>
                    </div>
                )}
                {activeTab === 'tasks' && (
                    <div className="space-y-4">
                        <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wide font-bold">Tareas del Cliente</p>
                        <div className="space-y-2">
                            {clientTasks.filter(t => t.status !== 'done').map(task => {
                                const project = projects.find(p => p.id === task.project_id);
                                return (
                                    <div key={task.id} onClick={() => onEditTask(task)} className="p-2 border rounded hover:border-blue-300 dark:hover:border-blue-600 flex justify-between items-center bg-white dark:bg-slate-800 dark:border-gray-700 cursor-pointer transition-colors group">
                                        <div className="flex flex-col"><span className="text-sm text-gray-800 dark:text-slate-200 group-hover:text-blue-600">{task.title}</span>{project && <span className="text-[9px] text-blue-500 font-medium tracking-tight">#{project.name}</span>}</div>
                                        <UI.PriorityBadge priority={task.priority} />
                                    </div>
                                );
                            })}
                            {clientTasks.filter(t => t.status !== 'done').length === 0 && <p className="text-[10px] text-gray-400 italic text-center py-2">Sin tareas activas.</p>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <UI.Modal title={isTam ? "Ficha Técnica Cliente TAM" : "Detalle Cliente Estándar"} onClose={onClose} maxWidth="max-w-5xl">
            {isTam ? (
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-1/3 space-y-6">{renderHeader()}<ServicesManager services={client.services || []} onUpdate={(updatedServices) => onUpdateClient(client.id, { services: updatedServices })} /></div>
                    <div className="md:w-2/3 flex flex-col gap-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{renderDocs()}<div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border dark:border-gray-700"><div className="flex justify-between items-center mb-3"><h4 className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2"><Icons.Activity size={14} /> Monitorización</h4><button onClick={() => setAddMode(addMode === 'monitor' ? null : 'monitor')} className="text-gray-400 hover:text-blue-500"><Icons.PlusCircle size={16} /></button></div>{addMode === 'monitor' && (<div className="mb-2 p-2 bg-white dark:bg-slate-800 rounded border animate-in"><input placeholder="Título" className="w-full p-1 mb-1 text-xs border rounded dark:bg-gray-700" value={newMonitor.title} onChange={e => setNewMonitor({ ...newMonitor, title: e.target.value })} /><input placeholder="https://..." className="w-full p-1 mb-1 text-xs border rounded dark:bg-gray-700" value={newMonitor.url} onChange={e => setNewMonitor({ ...newMonitor, url: e.target.value })} /><UI.Button size="xs" onClick={handleAddMonitor}>Añadir</UI.Button></div>)}<div className="space-y-1">{client.monitoring && client.monitoring.map((mon, idx) => (<div key={idx} className="flex justify-between items-center group"><a href={mon.url} target="_blank" className="text-sm text-green-600 hover:underline flex items-center gap-2 truncate"><Icons.ExternalLink size={12} /> {mon.title}</a><button onClick={() => handleRemoveItem('monitoring', idx)} className="text-red-400 opacity-0 group-hover:opacity-100"><Icons.X size={12} /></button></div>))}</div></div></div>{renderContactsAndTasks()}</div>
                </div>
            ) : (
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-1/3 space-y-6">{renderHeader()}{renderDocs()}<div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border dark:border-gray-700"><h4 className="text-xs font-bold uppercase text-gray-500 mb-3 flex items-center gap-2"><Icons.Layout size={14} /> Proyectos Activos</h4><div className="space-y-2">{activeProjects.length > 0 ? activeProjects.map(prj => (<div key={prj.id} onClick={() => onNavigateProject(prj.id)} className="bg-white dark:bg-slate-800 p-2 rounded border dark:border-gray-600 shadow-sm flex items-center gap-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors group"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: prj.color }}></div><span className="text-sm font-medium dark:text-white group-hover:text-blue-600">{prj.name}</span><Icons.ChevronRight size={12} className="ml-auto text-gray-400 opacity-0 group-hover:opacity-100" /></div>)) : <p className="text-xs text-gray-400 italic">No hay proyectos activos.</p>}</div></div>{completedProjects.length > 0 && (<div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border dark:border-gray-700"><h4 className="text-xs font-bold uppercase text-gray-500 mb-3 flex items-center gap-2"><Icons.Archive size={14} /> Histórico Proyectos</h4><div className="space-y-2">{completedProjects.map(prj => (<div key={prj.id} className="text-xs text-gray-500 flex items-center gap-2 opacity-75"><Icons.Check size={10} className="text-green-500" /><span className="line-through">{prj.name}</span></div>))}</div></div>)}</div>
                    <div className="md:w-2/3 flex flex-col gap-6">{renderContactsAndTasks()}</div>
                </div>
            )}
        </UI.Modal>
    );
};

window.ClientComponents = {
    ServicesManager,
    ClientCard,
    CreateClientModal,
    ClientDetailModal
};
