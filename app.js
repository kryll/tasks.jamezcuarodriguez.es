require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const path = require('path');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURACIÓN DE ENVÍO ---
const REPORT_TIME = '15 16 * * 1-5';
const REPORT_EMAIL_DEST = 'jamezcua@arsys.es';

console.log('--- APLICACIÓN INICIADA ---');
console.log('Hora del servidor (Local):', new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' }));

// --- CONFIGURACIÓN BBDD ---
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+00:00'
});

// --- CONFIGURACIÓN EMAIL ---
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT == 465,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '.')));

// --- HELPERS ---
const parseJsonFields = (rows, fields) => {
    return rows.map(row => {
        fields.forEach(f => {
            if (row[f] && typeof row[f] === 'string') {
                try { row[f] = JSON.parse(row[f]); } catch (e) { row[f] = []; }
            }
        });
        return row;
    });
};

// --- EMAIL LOGIC ---
const generateEmailHtml = (completedTasks, groupedPending, allSubtasks, completedSubtasksToday = []) => {
    const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const getStatusStyle = (status) => {
        switch (status) {
            case 'in_progress': return 'background-color: #dbeafe; color: #1e40af;';
            case 'waiting_for': return 'background-color: #fef3c7; color: #92400e;';
            case 'someday': return 'background-color: #f3e8ff; color: #6b21a8;';
            default: return 'background-color: #f3f4f6; color: #374151;';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'in_progress': return 'En curso';
            case 'waiting_for': return 'En espera';
            case 'someday': return 'Algún día';
            case 'todo': return 'Pendiente';
            default: return status;
        }
    };

    const renderSubtasks = (taskId, showCompleted = false) => {
        const relevantSubtasks = allSubtasks.filter(s => s.task_id === taskId);
        if (relevantSubtasks.length === 0) return '';

        const isCompleted = (s) => s.status === 'done' || s.is_completed;

        const displaySubtasks = showCompleted
            ? relevantSubtasks
            : relevantSubtasks.filter(s => !isCompleted(s));

        if (displaySubtasks.length === 0) return '';

        return `
            <ul style="list-style: none; padding: 4px 0 4px 20px; margin: 0;">
                ${displaySubtasks.map(s => `
                    <li style="font-size: 12px; color: #6b7280; display: flex; align-items: center; margin-bottom: 2px;">
                        <span style="margin-right: 6px;">${isCompleted(s) ? '☑️' : '⬜'}</span>
                        <span style="${isCompleted(s) ? 'text-decoration: line-through; opacity: 0.7;' : ''}">${s.title}</span>
                    </li>
                `).join('')}
            </ul>
        `;
    };

    let pendingHtml = '';

    for (const [groupName, tasks] of Object.entries(groupedPending)) {
        if (tasks.length === 0) continue;
        pendingHtml += `
            <div style="margin-bottom: 20px;">
                <h3 style="color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 10px; font-size: 16px;">${groupName}</h3>
                <ul style="list-style: none; padding: 0; margin: 0;">
                    ${tasks.map(t => `
                        <li style="padding: 8px 0; border-bottom: 1px dashed #f3f4f6;">
                            <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 8px;">
                                <span style="display: inline-block; width: 8px; height: 8px; background-color: ${t.priority === 'high' ? '#ef4444' : t.priority === 'medium' ? '#f97316' : '#3b82f6'}; border-radius: 50%;"></span>
                                <span style="color: #374151; font-size: 14px; flex: 1; min-width: 200px;">${t.title}</span>
                                <span style="font-size: 10px; padding: 2px 8px; border-radius: 12px; font-weight: 500; ${getStatusStyle(t.status)}">${getStatusLabel(t.status)}</span>
                                ${t.scheduled_date ? `<span style="font-size: 11px; color: #6b7280; background: #f3f4f6; padding: 2px 6px; border-radius: 4px; display: flex; align-items: center;">📅 ${new Date(t.scheduled_date).toLocaleDateString('es-ES')}</span>` : ''}
                            </div>
                            ${renderSubtasks(t.id, false)} 
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;">
            <div style="background-color: #1e40af; padding: 30px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Resumen Diario 🎯</h1>
                <p style="color: #bfdbfe; margin: 5px 0 0 0; font-size: 14px;">${today}</p>
            </div>
            <div style="padding: 30px;">
                <div style="background-color: #ecfdf5; border: 1px solid #d1fae5; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                    <h2 style="color: #047857; margin-top: 0; font-size: 18px; display: flex; align-items: center;">✅ Logros del Día</h2>
                    <p style="text-xs; color: #065f46; margin-bottom: 10px;">Tareas y subtareas completadas hoy:</p>
                    ${completedTasks.length > 0 ? `
                        <ul style="padding-left: 20px; margin-bottom: 20px; color: #065f46;">
                            ${completedTasks.map(t => `<li style="margin-bottom: 10px;"><strong>[Tarea] ${t.title}</strong>${renderSubtasks(t.id, true)}</li>`).join('')}
                        </ul>
                    ` : ''}
                    ${completedSubtasksToday.length > 0 ? `
                        <div style="border-top: 1px solid #d1fae5; padding-top: 10px;">
                            <ul style="padding-left: 20px; color: #065f46; list-style: none;">
                                ${completedSubtasksToday.map(s => `<li style="margin-bottom: 5px; font-size: 14px;">🔹 <strong>[Subtarea]</strong> ${s.title}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    ${completedTasks.length === 0 && completedSubtasksToday.length === 0 ? '<p style="color: #065f46; font-style: italic;">Hoy no se han cerrado tareas ni subtareas.</p>' : ''}
                </div>
                <h2 style="color: #111827; font-size: 18px; border-bottom: 2px solid #1e40af; padding-bottom: 10px; margin-bottom: 20px;">📋 Panorama Pendiente</h2>
                ${pendingHtml || '<p style="text-align: center; color: #6b7280;">¡Todo limpio! No hay tareas pendientes.</p>'}
            </div>
            <div style="background-color: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">Generado automáticamente por FocusDeck</div>
        </div>
    </body>
    </html>
    `;
};

// --- SETTINGS & NOTIFICATION LOGIC ---

const initSettings = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS settings (
                setting_key VARCHAR(50) PRIMARY KEY,
                setting_value TEXT
            )
        `);
        // Insert default email if not exists
        const [rows] = await pool.query('SELECT * FROM settings WHERE setting_key = ?', ['notification_email']);
        if (rows.length === 0) {
            await pool.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)', ['notification_email', process.env.EMAIL_TO || 'jamezcua@arsys.es']);
        }
        console.log('✅ [SYSTEM] Tabla de configuración verificada');
    } catch (e) {
        console.error('❌ [SYSTEM] Error inicializando settings:', e);
    }
};
initSettings();

const getNotificationEmail = async () => {
    try {
        const [rows] = await pool.query('SELECT setting_value FROM settings WHERE setting_key = ?', ['notification_email']);
        if (rows.length > 0) return rows[0].setting_value;
    } catch (e) { }
    return REPORT_EMAIL_DEST; // Fallback
};

const sendScheduledTaskNotification = async () => {
    console.log(`[${new Date().toISOString()}] Comprobando tareas programadas para hoy...`);
    try {
        await transporter.verify();
        const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' });

        // Usamos DATE() para asegurar la comparación correcta y quitamos el filtro de status "done" 
        // para que también avise si se acaba de terminar hoy o simplemente para ser más laxos en la prueba.
        // Volvemos a status != "done" pero con DATE() robusto.
        const [tasks] = await pool.query('SELECT * FROM tasks WHERE DATE(scheduled_date) = ? AND status != "done"', [todayStr]);

        if (tasks.length === 0) {
            console.log("No hay tareas programadas para enviar hoy.");
            return { success: true, count: 0 };
        }

        const emailDest = await getNotificationEmail();

        const html = `
            <h2>📅 Tareas para Hoy</h2>
            <p>Las siguientes tareas estaban programadas para hoy y han aparecido en tu lista:</p>
            <ul>
                ${tasks.map(t => `<li><strong>${t.title}</strong>${t.description ? `<br><small>${t.description}</small>` : ''}</li>`).join('')}
            </ul>
        `;

        await transporter.sendMail({
            from: `"FocusDeck Bot" <${process.env.EMAIL_USER}>`,
            to: emailDest,
            subject: `🔔 ${tasks.length} Tarea(s) Programada(s) para Hoy`,
            html: html
        });
        console.log(`✅ [NOTIFICACIÓN] Correo enviado a ${emailDest} con ${tasks.length} tareas.`);
        return { success: true, count: tasks.length };

    } catch (error) {
        console.error('Error enviando notificación de tareas programadas:', error);
        return { success: false, error: error.message };
    }
};

const sendWeeklyProjectLogs = async () => {
    console.log(`[${new Date().toISOString()}] Generando resumen semanal de diarios de proyectos...`);
    try {
        const [activeProjects] = await pool.query('SELECT * FROM projects WHERE status != "closed"');
        if (activeProjects.length === 0) return;

        const [logs] = await pool.query('SELECT * FROM project_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) ORDER BY created_at DESC');
        const [clients] = await pool.query('SELECT * FROM clients');

        const emailDest = await getNotificationEmail();

        let logsHtml = '';
        for (const project of activeProjects) {
            const projectLogs = logs.filter(l => l.project_id === project.id);
            if (projectLogs.length === 0) continue;

            const client = clients.find(c => c.id === project.client_id);
            logsHtml += `
                <div style="margin-bottom: 25px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #f8fafc; padding: 10px 15px; border-bottom: 1px solid #e5e7eb;">
                        <h3 style="margin: 0; color: #1e40af; font-size: 16px;">${project.name}</h3>
                        <span style="font-size: 12px; color: #64748b;">${client ? client.name : 'Sin Cliente'}</span>
                    </div>
                    <div style="padding: 15px;">
                        <ul style="margin: 0; padding-left: 20px; color: #334155; font-size: 14px;">
                            ${projectLogs.map(l => `<li style="margin-bottom: 10px;">
                                <div style="font-size: 11px; color: #94a3b8; font-weight: bold;">${new Date(l.created_at).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                                <div style="white-space: pre-wrap;">${l.content}</div>
                            </li>`).join('')}
                        </ul>
                    </div>
                </div>
            `;
        }

        if (!logsHtml) {
            console.log('No hay logs recientes para enviar en el resumen semanal.');
            return;
        }

        const finalHtml = `
            <!DOCTYPE html>
            <html>
            <body style="font-family: sans-serif; padding: 20px; background-color: #f1f5f9;">
                <div style="max-width: 700px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                    <h1 style="color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; margin-bottom: 25px;">📉 Resumen Semanal de Proyectos</h1>
                    <p style="color: #475569; margin-bottom: 20px;">Aquí tienes los últimos apuntes en los diarios de tus proyectos activos:</p>
                    ${logsHtml}
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
                        FocusDeck Weekly Report - ${new Date().toLocaleDateString('es-ES')}
                    </div>
                </div>
            </body>
            </html>
        `;

        await transporter.sendMail({
            from: `"FocusDeck" <${process.env.EMAIL_USER}>`,
            to: emailDest,
            subject: `📉 Resumen Semanal de Diarios de Proyecto (${new Date().toLocaleDateString('es-ES')})`,
            html: finalHtml
        });

        console.log('✅ Resumen semanal enviado.');

    } catch (error) {
        console.error('Error enviando resumen semanal:', error);
    }
};

const sendDailyReport = async () => {
    console.log(`[${new Date().toISOString()}] Intentando enviar reporte diario...`);
    try {
        await transporter.verify();

        const [tasks] = await pool.query('SELECT * FROM tasks');
        const [projects] = await pool.query('SELECT * FROM projects');
        const [clients] = await pool.query('SELECT * FROM clients');

        let subtasks = [];
        try { const [s] = await pool.query('SELECT * FROM subtasks'); subtasks = s; } catch (e) { }

        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' });

        const completedToday = tasks.filter(t => {
            if (t.status !== 'done') return false;
            const dateStr = t.completed_at || t.updated_at || new Date().toISOString();
            return new Date(dateStr).toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' }) === today;
        });

        const completedSubtasksToday = subtasks.filter(s => {
            if (s.status !== 'done') return false;

            // Usar completed_at si existe, si no fallback a updated_at
            const dateStr = s.completed_at || s.updated_at || new Date().toISOString();
            const isTodaySub = new Date(dateStr).toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' }) === today;
            if (!isTodaySub) return false;

            // Si la tarea padre está completada hoy, ya aparece en logros principales
            const parentTask = tasks.find(t => t.id === s.task_id);
            if (parentTask && parentTask.status === 'done') {
                const parentDateStr = parentTask.completed_at || parentTask.updated_at || new Date().toISOString();
                if (new Date(parentDateStr).toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' }) === today) return false;
            }

            return true;
        });

        const pending = tasks.filter(t => t.status !== 'done');

        const grouped = { '🔥 Inbox / Sin Asignar': [], '--- Por Proyecto ---': [] };

        projects.forEach(p => {
            if (p.status !== 'closed') {
                const client = clients.find(c => c.id === p.client_id);
                const clientSuffix = client ? ` | ${client.name}` : '';
                grouped[`📂 ${p.name}${clientSuffix}`] = [];
            }
        });

        clients.forEach(c => { grouped[`🏢 ${c.name}`] = []; });

        pending.forEach(t => {
            if (t.project_id) {
                const proj = projects.find(p => p.id === t.project_id);
                if (proj) {
                    const client = clients.find(c => c.id === proj.client_id);
                    const companyName = client ? client.name : (proj.company || 'Sin Empresa');
                    const clientSuffix = client ? ` | ${client.name}` : (proj.company ? ` | ${proj.company}` : '');
                    const key = `📂 ${proj.name}${clientSuffix}`;
                    if (grouped[key]) grouped[key].push(t);
                }
            } else if (t.client_id) {
                const cli = clients.find(c => c.id === t.client_id);
                if (cli && grouped[`🏢 ${cli.name}`]) grouped[`🏢 ${cli.name}`].push(t);
            } else {
                grouped['🔥 Inbox / Sin Asignar'].push(t);
            }
        });

        for (const key in grouped) { if (grouped[key].length === 0) delete grouped[key]; }

        const html = generateEmailHtml(completedToday, grouped, subtasks, completedSubtasksToday);

        const emailDest = await getNotificationEmail();

        const info = await transporter.sendMail({
            from: `"FocusDeck Bot" <${process.env.EMAIL_USER}>`,
            to: emailDest,
            subject: `📊 Resumen Diario - ${new Date().toLocaleDateString('es-ES')}`,
            html: html
        });

        console.log('Reporte enviado correctamente: ' + info.messageId);
        return { success: true, message: 'Reporte enviado', id: info.messageId };

    } catch (error) {
        console.error('Error FATAL enviando reporte:', error);
        return { success: false, error: error.message };
    }
};

// Programar Cron
// Programar Cron
cron.schedule(REPORT_TIME, () => {
    console.log(`⏰ [CRON] Ejecutando reporte diario a las ${new Date().toLocaleTimeString()}`);
    sendDailyReport();
}, {
    scheduled: true,
    timezone: "Europe/Madrid"
});

cron.schedule('0 9 * * 1', () => {
    console.log(`⏰ [CRON] Ejecutando resumen semanal de lunes a las ${new Date().toLocaleTimeString()}`);
    sendWeeklyProjectLogs();
}, {
    scheduled: true,
    timezone: "Europe/Madrid"
});

console.log(`✅ [SYSTEM] Crons programados correctamente.`);

// --- API ROUTES ---

// --- API ROUTES ---

// 0. Settings
app.get('/api/settings', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM settings');
        const settings = {};
        rows.forEach(row => settings[row.setting_key] = row.setting_value);
        res.json(settings);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/settings', async (req, res) => {
    const settings = req.body;
    try {
        const queries = Object.entries(settings).map(([key, value]) => {
            return pool.query(
                'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
                [key, value, value]
            );
        });
        await Promise.all(queries);
        res.json({ success: true });
    } catch (e) {
        console.error("Error updating settings:", e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/settings', async (req, res) => {
    const { key, value } = req.body;
    try {
        await pool.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?', [key, value, value]);
        res.json({ success: true, key, value });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/test-email', async (req, res) => {
    req.setTimeout(15000);
    const result = await sendDailyReport();
    if (result.success) res.json(result);
    else res.status(500).json(result);
});

app.get('/api/test-weekly-report', async (req, res) => {
    console.log("Triggering manual Weekly Report");
    await sendWeeklyProjectLogs();
    res.json({ success: true, message: "Weekly report triggered" });
});

app.get('/api/test-scheduled-report', async (req, res) => {
    console.log("Triggering manual Scheduled Tasks Notification");
    const result = await sendScheduledTaskNotification();
    if (result.success) {
        res.json(result);
    } else {
        res.status(500).json(result);
    }
});

// 1. Dashboard
app.get('/api/dashboard', async (req, res) => {
    try {
        const [clientsRaw] = await pool.query('SELECT * FROM clients');
        const [projects] = await pool.query('SELECT * FROM projects');

        let contexts = [];
        try { const [res] = await pool.query('SELECT * FROM contexts'); contexts = res; } catch (e) { console.warn("Contexts missing"); }

        // CORREGIDO: Usamos 'dependencies' en lugar de 'task_dependencies' para coincidir con tu versión funcional
        let dependencies = [];
        try { const [res] = await pool.query('SELECT * FROM dependencies'); dependencies = res; } catch (e) { console.warn("Dependencies missing"); }

        let projectLogs = [];
        try { const [logs] = await pool.query('SELECT * FROM project_logs ORDER BY created_at DESC'); projectLogs = logs; } catch (e) { console.warn("ProjectLogs missing"); }

        let subtasks = [];
        try { const [subs] = await pool.query('SELECT * FROM subtasks ORDER BY position ASC, id ASC'); subtasks = subs; } catch (e) { console.warn("Subtasks missing"); }

        const [tasks] = await pool.query('SELECT * FROM tasks ORDER BY id DESC');

        const [settingsRaw] = await pool.query('SELECT * FROM settings');
        const settings = {};
        settingsRaw.forEach(s => settings[s.setting_key] = s.setting_value);

        const clients = parseJsonFields(clientsRaw, ['contacts', 'services', 'docs', 'monitoring']);
        res.json({ clients, projects, contexts, tasks, dependencies, projectLogs, subtasks, settings });
    } catch (e) {
        console.error("DB Error Crítico en Dashboard:", e);
        res.status(500).json({ error: "Error de Base de Datos: " + e.message });
    }
});

// 2. Clientes
app.post('/api/clients', async (req, res) => {
    const { name, custom_id, type, logo, contacts, services, docs, monitoring, company } = req.body;
    try {
        const [result] = await pool.query(
            `INSERT INTO clients (name, custom_id, type, logo, contacts, services, docs, monitoring, company) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, custom_id, type, logo, JSON.stringify(contacts || []), JSON.stringify(services || []), JSON.stringify(docs || []), JSON.stringify(monitoring || []), company || 'Arsys']
        );
        res.json({ id: result.insertId, ...req.body });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/clients/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const jsonFields = ['contacts', 'services', 'docs', 'monitoring'];
    const values = [];
    const sets = [];
    for (const [key, value] of Object.entries(updates)) {
        sets.push(`${key} = ?`);
        values.push(jsonFields.includes(key) ? JSON.stringify(value) : value);
    }
    values.push(id);
    try {
        await pool.query(`UPDATE clients SET ${sets.join(', ')} WHERE id = ?`, values);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 3. Proyectos
// --- MIGRACIONES ---
const runMigrations = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                setting_key VARCHAR(100) UNIQUE NOT NULL,
                setting_value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Migraciones Projects
        const [projectsCols] = await pool.query('SHOW COLUMNS FROM projects LIKE "company"');
        if (projectsCols.length === 0) {
            console.log('📦 [MIGRATION] Añadiendo columna "company" a projects...');
            await pool.query('ALTER TABLE projects ADD COLUMN company VARCHAR(100) DEFAULT NULL AFTER client_id');
        }

        const [projectsJira] = await pool.query('SHOW COLUMNS FROM projects LIKE "jira_link"');
        if (projectsJira.length === 0) {
            console.log('📦 [MIGRATION] Añadiendo jira_link y doc_link a projects...');
            await pool.query('ALTER TABLE projects ADD COLUMN jira_link TEXT DEFAULT NULL, ADD COLUMN doc_link TEXT DEFAULT NULL');
        }

        // Migraciones Subtasks
        const [subtasksCols] = await pool.query('SHOW COLUMNS FROM subtasks LIKE "updated_at"');
        if (subtasksCols.length === 0) {
            console.log('📦 [MIGRATION] Añadiendo columna "updated_at" a subtasks...');
            await pool.query('ALTER TABLE subtasks ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
        }

        const [subtasksCompleted] = await pool.query('SHOW COLUMNS FROM subtasks LIKE "completed_at"');
        if (subtasksCompleted.length === 0) {
            console.log('📦 [MIGRATION] Añadiendo columna "completed_at" a subtasks...');
            await pool.query('ALTER TABLE subtasks ADD COLUMN completed_at TIMESTAMP NULL DEFAULT NULL');
            // Inicializar las ya terminadas con una fecha pasada para evitar que salgan en el reporte de hoy tras la migración
            await pool.query('UPDATE subtasks SET completed_at = "1970-01-01 00:00:00" WHERE status = "done" AND completed_at IS NULL');
        }

    } catch (e) { console.error('Error en migración:', e); }
};
runMigrations();

app.post('/api/projects', async (req, res) => {
    const { name, client_id, color, status, jira_link, doc_link, company } = req.body;
    try {
        const [result] = await pool.query('INSERT INTO projects (name, client_id, company, color, status, jira_link, doc_link) VALUES (?, ?, ?, ?, ?, ?, ?)', [name, client_id, company || null, color, status, jira_link, doc_link]);
        res.json({ id: result.insertId, ...req.body });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/projects/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    if (Object.keys(updates).length === 0) return res.json({ success: true });

    const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(updates), id];
    try { await pool.query(`UPDATE projects SET ${fields} WHERE id = ?`, values); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/projects/:id', async (req, res) => {
    try { await pool.query('DELETE FROM projects WHERE id = ?', [req.params.id]); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});

// 4. Contextos
app.post('/api/contexts', async (req, res) => {
    const { name, icon } = req.body;
    try {
        const [result] = await pool.query('INSERT INTO contexts (name, icon) VALUES (?, ?)', [name, icon]);
        res.json({ id: result.insertId, name, icon });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/contexts/:id', async (req, res) => {
    try { await pool.query('DELETE FROM contexts WHERE id = ?', [req.params.id]); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});

// 5. Tareas
app.post('/api/tasks', async (req, res) => {
    let { title, description, priority, project_id, client_id, context_id, is_today, status, scheduled_date, reminder_freq } = req.body;
    if (!scheduled_date) scheduled_date = null;
    try {
        const [result] = await pool.query(
            'INSERT INTO tasks (title, description, priority, project_id, client_id, context_id, is_today, status, scheduled_date, reminder_freq) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [title, description || '', priority || 'medium', project_id || null, client_id || null, context_id || null, is_today || false, status || 'todo', scheduled_date, reminder_freq || null]
        );
        res.json({ id: result.insertId, ...req.body });
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

app.put('/api/tasks/:id', async (req, res) => {
    const { id } = req.params;
    let updates = req.body;
    if (updates.scheduled_date === '') updates.scheduled_date = null;

    if (Object.keys(updates).length === 0) return res.json({ success: true });

    const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(updates), id];
    try { await pool.query(`UPDATE tasks SET ${fields} WHERE id = ?`, values); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/tasks/:id', async (req, res) => {
    try { await pool.query('DELETE FROM tasks WHERE id = ?', [req.params.id]); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});

// 6. Dependencias
// CORREGIDO: Usamos 'dependencies' en lugar de 'task_dependencies'
app.post('/api/dependencies', async (req, res) => {
    const { task_id, blocked_by_task_id } = req.body;
    try { await pool.query('INSERT INTO dependencies (task_id, blocked_by_task_id) VALUES (?, ?)', [task_id, blocked_by_task_id]); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/dependencies', async (req, res) => {
    const { task_id, blocked_by } = req.query;
    try { await pool.query('DELETE FROM dependencies WHERE task_id = ? AND blocked_by_task_id = ?', [task_id, blocked_by]); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});

// 7. Logs de Proyecto
app.post('/api/project_logs', async (req, res) => {
    const { project_id, content } = req.body;
    try {
        const [result] = await pool.query('INSERT INTO project_logs (project_id, content, created_at) VALUES (?, ?, NOW())', [project_id, content]);
        res.json({ id: result.insertId, project_id, content, created_at: new Date() });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 8. Subtareas
app.post('/api/subtasks', async (req, res) => {
    const { task_id, title, description, status, priority, status_comment } = req.body;
    try {
        // Calcular posición
        const [rows] = await pool.query('SELECT MAX(position) as maxPos FROM subtasks WHERE task_id = ?', [task_id]);
        const nextPos = (rows[0].maxPos || 0) + 1;

        const [result] = await pool.query(
            'INSERT INTO subtasks (task_id, title, description, status, priority, position, status_comment) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [task_id, title, description || '', status || 'todo', priority || 'medium', nextPos, status_comment || '']
        );
        res.json({ id: result.insertId, task_id, title, description: description || '', status: status || 'todo', priority: priority || 'medium', position: nextPos, status_comment: status_comment || '' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/subtasks/:id', async (req, res) => {
    const { id } = req.params;
    let updates = req.body;

    // Si el estado cambia a done, marcamos completed_at
    if (updates.status === 'done') {
        updates.completed_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
    } else if (updates.status && updates.status !== 'done') {
        updates.completed_at = null;
    }

    const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(updates), id];

    try {
        await pool.query(`UPDATE subtasks SET ${fields} WHERE id = ?`, values);
        res.json({ success: true });
    } catch (e) {
        console.error("Error updating subtask:", e);
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/subtasks/:id', async (req, res) => {
    try { await pool.query('DELETE FROM subtasks WHERE id = ?', [req.params.id]); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/subtasks/reorder', async (req, res) => {
    const { orderedIds } = req.body;
    if (!orderedIds || !Array.isArray(orderedIds)) return res.status(400).json({ error: 'Invalid data' });
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        for (let i = 0; i < orderedIds.length; i++) {
            await connection.query('UPDATE subtasks SET position = ? WHERE id = ?', [i, orderedIds[i]]);
        }
        await connection.commit();
        res.json({ success: true });
    } catch (e) { await connection.rollback(); res.status(500).json({ error: e.message }); } finally { connection.release(); }
});


// --- FRONTEND ROUTING ---
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));