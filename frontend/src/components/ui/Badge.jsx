import React from 'react';

const Badge = ({ children, variant = 'slate', className = '' }) => {
    const variants = {
        success: "bg-emerald-50 text-emerald-600",
        warning: "bg-amber-50 text-amber-600",
        danger: "bg-red-50 text-red-600",
        navy: "bg-navy text-white",
        accent: "bg-ink text-white",
        slate: "bg-surface text-ink-soft"
    };

    return (
        <span className={`px-4 py-1.5 rounded-pill text-[10px] font-medium uppercase tracking-wide ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};

export default Badge;
