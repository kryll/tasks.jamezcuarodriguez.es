const { CONFIG, MOCK_DB } = window;

const generateId = () => Math.floor(Math.random() * 100000);

const handleApiError = async (res) => {
    if (!res.ok) {
        let errorMsg = res.status + ' ' + res.statusText;
        try {
            const json = await res.json();
            if (json.error) errorMsg = json.error;
        } catch (e) { }
        throw new Error(errorMsg);
    }
    return res.json();
};

window.api = {
    async getDashboard() {
        if (!CONFIG.USE_REAL_API) return new Promise(r => setTimeout(() => r(MOCK_DB), 300));
        try {
            const res = await fetch(`${CONFIG.API_URL}/dashboard`);
            return handleApiError(res);
        } catch (e) {
            console.warn("API Error", e);
            if (CONFIG.USE_REAL_API) alert("⚠️ Error conectando con la Base de Datos:\n" + e.message);
        }
    },
    async createTask(task) {
        if (!CONFIG.USE_REAL_API) return { ...task, id: generateId() };
        try { const res = await fetch(`${CONFIG.API_URL}/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(task) }); return handleApiError(res); } catch (e) { console.error(e); alert("Error guardando tarea: " + e.message); throw e; }
    },
    async updateTask(id, updates) {
        if (!CONFIG.USE_REAL_API) return;
        try { const res = await fetch(`${CONFIG.API_URL}/tasks/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) }); return handleApiError(res); } catch (e) { console.error(e); alert("Error actualizando tarea: " + e.message); }
    },
    async deleteTask(id) {
        if (!CONFIG.USE_REAL_API) return;
        try { const res = await fetch(`${CONFIG.API_URL}/tasks/${id}`, { method: 'DELETE' }); return handleApiError(res); } catch (e) { console.error(e); alert("Error borrando tarea: " + e.message); }
    },
    async createProject(project) {
        if (!CONFIG.USE_REAL_API) return { ...project, id: generateId() };
        try { const res = await fetch(`${CONFIG.API_URL}/projects`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(project) }); return handleApiError(res); } catch (e) { console.error(e); alert("Error creando proyecto: " + e.message); throw e; }
    },
    async updateProject(id, updates) {
        if (!CONFIG.USE_REAL_API) return;
        try { const res = await fetch(`${CONFIG.API_URL}/projects/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) }); return handleApiError(res); } catch (e) { console.error(e); alert("Error actualizando proyecto: " + e.message); }
    },
    async deleteProject(id) {
        if (!CONFIG.USE_REAL_API) return;
        try { const res = await fetch(`${CONFIG.API_URL}/projects/${id}`, { method: 'DELETE' }); return handleApiError(res); } catch (e) { console.error(e); alert("Error borrando proyecto: " + e.message); }
    },
    async createClient(client) {
        if (!CONFIG.USE_REAL_API) return { ...client, id: generateId(), contacts: [], services: [], docs: [], monitoring: [] };
        try { const res = await fetch(`${CONFIG.API_URL}/clients`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(client) }); return handleApiError(res); } catch (e) { console.error(e); alert("Error creando cliente: " + e.message); throw e; }
    },
    async updateClient(id, updates) {
        if (!CONFIG.USE_REAL_API) return;
        try { const res = await fetch(`${CONFIG.API_URL}/clients/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) }); return handleApiError(res); } catch (e) { console.error(e); alert("Error actualizando cliente: " + e.message); }
    },
    async createContext(context) {
        if (!CONFIG.USE_REAL_API) return { ...context, id: generateId() };
        try { const res = await fetch(`${CONFIG.API_URL}/contexts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(context) }); return handleApiError(res); } catch (e) { console.error(e); alert("Error creando contexto: " + e.message); throw e; }
    },
    async deleteContext(id) {
        if (!CONFIG.USE_REAL_API) return;
        try { const res = await fetch(`${CONFIG.API_URL}/contexts/${id}`, { method: 'DELETE' }); return handleApiError(res); } catch (e) { console.error(e); alert("Error borrando contexto: " + e.message); }
    },
    async addDependency(dep) {
        if (!CONFIG.USE_REAL_API) return;
        try { const res = await fetch(`${CONFIG.API_URL}/dependencies`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dep) }); return handleApiError(res); } catch (e) { console.error(e); alert("Error añadiendo dependencia: " + e.message); }
    },
    async deleteDependency(taskId, blockerId) {
        if (!CONFIG.USE_REAL_API) return;
        try { const res = await fetch(`${CONFIG.API_URL}/dependencies?task_id=${taskId}&blocked_by=${blockerId}`, { method: 'DELETE' }); return handleApiError(res); } catch (e) { console.error(e); alert("Error borrando dependencia: " + e.message); }
    },
    async addProjectLog(log) {
        if (!CONFIG.USE_REAL_API) return { ...log, id: generateId(), created_at: new Date() };
        try { const res = await fetch(`${CONFIG.API_URL}/project_logs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(log) }); return handleApiError(res); } catch (e) { console.error(e); alert("Error guardando log: " + e.message); throw e; }
    },
    async createSubtask(subtask) {
        if (!CONFIG.USE_REAL_API) return { ...subtask, id: generateId(), status: 'todo' };
        try { const res = await fetch(`${CONFIG.API_URL}/subtasks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(subtask) }); return handleApiError(res); } catch (e) { console.error(e); alert("Error creando subtarea: " + e.message); throw e; }
    },
    async updateSubtask(id, updates) {
        if (!CONFIG.USE_REAL_API) return;
        try {
            const res = await fetch(`${CONFIG.API_URL}/subtasks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            return handleApiError(res);
        } catch (e) {
            console.error(e);
            alert("Error actualizando subtarea: " + e.message);
        }
    },
    async deleteSubtask(id) {
        if (!CONFIG.USE_REAL_API) return;
        try { const res = await fetch(`${CONFIG.API_URL}/subtasks/${id}`, { method: 'DELETE' }); return handleApiError(res); } catch (e) { console.error(e); alert("Error borrando subtarea: " + e.message); }
    },
    async reorderSubtasks(orderedIds) {
        if (!CONFIG.USE_REAL_API) return;
        try { const res = await fetch(`${CONFIG.API_URL}/subtasks/reorder`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderedIds }) }); return handleApiError(res); } catch (e) { console.error(e); alert("Error reordenando subtareas: " + e.message); }
    }
};

window.generateId = generateId;
window.parseSmartTask = (text) => {
    const now = new Date();
    let title = text;
    let scheduled_date = null;
    let is_today = false;
    let reminder_freq = null;
    let detected = false;

    const regexRecurrence = /\bcada\s+([a-zA-Zñáéíóú]+)(\s+a\s+las\s+(\d{1,2}:\d{2}))?/i;
    const matchRecurrence = title.match(regexRecurrence);
    if (matchRecurrence) {
        const freq = matchRecurrence[1];
        const time = matchRecurrence[3];
        reminder_freq = `Cada ${freq}${time ? ` a las ${time}` : ''}`;
        title = title.replace(matchRecurrence[0], '').trim();
        detected = true;
    }

    if (!reminder_freq) {
        const regexTime = /\ba\s+las\s+(\d{1,2}:\d{2})\b/i;
        const matchTime = title.match(regexTime);
        if (matchTime) {
            const specific_time = matchTime[1];
            reminder_freq = `A las ${specific_time}`;
            title = title.replace(matchTime[0], '').trim();
            detected = true;
            if (!scheduled_date && !title.match(/\b(mañana)\b/i)) { is_today = true; }
        }
    }

    const regexTomorrow = /\b(mañana)\b/i;
    if (regexTomorrow.test(title)) {
        const d = new Date(now); d.setDate(d.getDate() + 1);
        scheduled_date = d.toISOString().split('T')[0];
        title = title.replace(regexTomorrow, '').trim();
        detected = true;
        is_today = false;
    }

    const regexToday = /\b(hoy)\b/i;
    if (regexToday.test(title)) {
        is_today = true;
        title = title.replace(regexToday, '').trim();
        detected = true;
        scheduled_date = null;
    }

    return { title, scheduled_date, is_today, reminder_freq, detected };
};
