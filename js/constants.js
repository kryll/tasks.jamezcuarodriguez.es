// --- CONFIGURACIÓN Y CONSTANTES ---
window.CONFIG = {
    USE_REAL_API: true,
    API_URL: '/api',
    NOTIFICATION_EMAIL: 'jamezcua@arsys.es'
};

window.SERVICE_TYPES = [
    { id: 'cloudbuilder', label: 'CloudBuilder', prefix: 'cdc' },
    { id: 'next', label: 'CB Next', prefix: 'CB-' },
    { id: 'backup', label: 'Backup (BaaS)', prefix: 'BaaS-' },
    { id: 'dcd', label: 'DCD', prefix: 'DCD-' },
    { id: 'custom', label: 'URL Personalizada', prefix: 'https://' }
];

window.PROJECT_STATUSES = {
    'open': { label: 'Abierto', short: 'ABIERTO', color: 'bg-blue-100 text-blue-800 border-blue-200', dot: 'bg-blue-500' },
    'in_progress': { label: 'En Progreso', short: 'EN PROGRESO', color: 'bg-orange-100 text-orange-800 border-orange-200', dot: 'bg-orange-500' },
    'waiting': { label: 'En Espera', short: 'EN ESPERA', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', dot: 'bg-yellow-500' },
    'closure': { label: 'Cierre de Proyecto', short: 'CIERRE', color: 'bg-purple-100 text-purple-800 border-purple-200', dot: 'bg-purple-500' },
    'closed': { label: 'Cierre Definitivo', short: 'CERRADO', color: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-500' },
    'cancelled': { label: 'Cancelado', short: 'CANCELADO', color: 'bg-red-100 text-red-800 border-red-200', dot: 'bg-red-500' }
};

window.TASK_STATUSES = {
    'todo': { label: 'Pendiente', color: 'text-gray-400', icon: 'Square' },
    'in_progress': { label: 'En Curso', color: 'text-blue-500', icon: 'Loader' },
    'waiting_for': { label: 'En Espera', color: 'text-orange-500', icon: 'Clock' },
    'someday': { label: 'Algún día', color: 'text-purple-500', icon: 'Archive' },
    'done': { label: 'Completado', color: 'text-green-500', icon: 'CheckSquare' }
};

window.MOCK_DB = {
    clients: [], contexts: [], projects: [],
    tasks: [
        { id: 1, title: 'Prueba Prioridad Interactiva (Click P1)', priority: 'high', status: 'todo', project_id: null, is_today: true },
        { id: 2, title: 'Prueba Enlaces: https://example.com', priority: 'medium', status: 'todo', description: 'Descripción con enlace https://google.com para verificar el linkify.' },
        { id: 3, title: 'Tarea Bloqueada Visualmente', priority: 'low', status: 'todo', project_id: null }
    ],
    dependencies: [
        { task_id: 3, blocked_by_task_id: 1 }
    ],
    projectLogs: [],
    subtasks: [
        { id: 101, task_id: 2, title: 'Subtarea con https://link.com', status: 'todo' }
    ]
};
