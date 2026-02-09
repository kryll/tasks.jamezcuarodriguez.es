const { React } = window;

// --- 1. ADAPTADOR DE ICONOS ---
const Icon = ({ name, size = 24, className, ...props }) => {
    const iconData = window.lucide.icons[name];
    if (!iconData) return null;
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            {...props}
        >
            {iconData.map(([tag, attrs], i) => {
                const Tag = tag;
                return <Tag key={i} {...attrs} />;
            })}
        </svg>
    );
};

window.Icons = Object.keys(window.lucide.icons).reduce((acc, key) => {
    acc[key] = (props) => <Icon name={key} {...props} />;
    return acc;
}, {});
