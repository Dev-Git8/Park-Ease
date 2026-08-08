import React from 'react';

const StatCard = ({ label, value, icon: Icon, tone = 'light', className = '' }) => {
    const tones = {
        light: 'bg-white border border-hairline text-ink',
        dark: 'bg-asphalt text-white',
    };

    return (
        <div className={`rounded-card p-6 ${tones[tone]} ${className}`}>
            {Icon && (
                <div className={`mb-4 grid h-10 w-10 place-items-center rounded-pill ${tone === 'dark' ? 'bg-white/10' : 'bg-surface'}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
            )}
            <span className="mb-2 block h-0.5 w-6 rounded-full bg-ignition" aria-hidden="true" />
            <p className={`text-xs font-medium uppercase tracking-[0.18em] ${tone === 'dark' ? 'text-white/60' : 'text-ink-soft'}`}>{label}</p>
            <p className="mt-1 font-outfit text-3xl font-medium tracking-tight tabular-nums">{value}</p>
        </div>
    );
};

export default StatCard;
