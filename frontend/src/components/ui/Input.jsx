import React from 'react';

const Input = ({ label, icon: Icon, error, className = '', ...props }) => {
    return (
        <div className={`space-y-2 ${className}`}>
            {label && (
                <label className="block px-1 text-xs font-medium uppercase tracking-[0.18em] text-ink-soft">
                    {label}
                </label>
            )}
            <div className="relative group">
                {Icon && (
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-ink-soft transition-colors group-focus-within:text-ignition">
                        <Icon size={18} />
                    </div>
                )}
                <input
                    className={`
                        w-full bg-background border border-hairline
                        py-4 ${Icon ? 'pl-14' : 'px-6'} pr-6 rounded-2xl text-sm font-medium text-ink
                        placeholder:text-ink-soft/60
                        focus:outline-none focus:border-ignition
                        transition-colors duration-300
                        ${error ? 'border-red-500' : ''}
                    `}
                    {...props}
                />
            </div>
            {error && (
                <p className="mt-2 px-1 text-xs font-medium text-red-500">{error}</p>
            )}
        </div>
    );
};

export default Input;
