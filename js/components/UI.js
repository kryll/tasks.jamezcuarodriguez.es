const { React } = window;
const { useState, useEffect, useRef } = React;

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, size = 'md', type = 'button' }) => {
    const base = "flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
    const sizes = { xs: "px-2 py-0.5 text-xs", sm: "px-2 py-1 text-xs", md: "px-4 py-2 text-sm", lg: "px-6 py-3 text-base" };
    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed",
        secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700",
        ghost: "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 dark:hover:text-white",
        danger: "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400",
        success: "bg-green-600 text-white hover:bg-green-700"
    };
    return <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>{children}</button>;
};

const Modal = ({ title, onClose, children, maxWidth = "max-w-lg" }) => (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in">
        <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full ${maxWidth} overflow-hidden border border-gray-100 dark:border-gray-700 max-h-[90vh] flex flex-col`}>
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 shrink-0">
                <h3 className="font-semibold text-lg dark:text-white">{title}</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><window.Icons.X size={20} /></button>
            </div>
            <div className="p-4 overflow-y-auto custom-scrollbar">{children}</div>
        </div>
    </div>
);

const NotificationToast = ({ notifications, onClose }) => (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {notifications.map(n => (
            <div key={n.id} className="bg-white dark:bg-slate-800 border-l-4 border-blue-500 shadow-xl p-4 rounded flex items-start gap-3 w-80 slide-in-right pointer-events-auto">
                <div className="text-blue-500 shrink-0"><window.Icons.Bell size={20} /></div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">{n.title}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300 break-words">{n.message}</p>
                </div>
                <button onClick={() => onClose(n.id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><window.Icons.X size={16} /></button>
            </div>
        ))}
    </div>
);

const PriorityBadge = ({ priority, onClick }) => {
    const colors = {
        high: 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30',
        medium: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/30',
        low: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30'
    };
    return (
        <button
            onClick={onClick}
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${colors[priority]} ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
        >
            {priority === 'high' ? 'P1' : priority === 'medium' ? 'P2' : 'P3'}
        </button>
    );
};

const Linkify = ({ text }) => {
    if (!text) return null;
    const urlRegex = /((?:https?:\/\/|www\.)[^\s]+)/g;
    const parts = text.split(urlRegex);
    return (
        <>
            {parts.map((part, i) => {
                if (part.match(urlRegex)) {
                    let href = part;
                    if (!href.startsWith('http')) href = 'https://' + href;
                    return <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline relative z-10" onClick={e => e.stopPropagation()}>{part}</a>;
                }
                return part;
            })}
        </>
    );
};

// Exportar al objeto window para acceso global (simulado sin build system)
window.UI = {
    Button,
    Modal,
    NotificationToast,
    PriorityBadge,
    Linkify
};
