import React from 'react';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    disabled = false,
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center font-medium uppercase tracking-wide transition-colors duration-300 active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-navy text-white hover:bg-navy-deep",
        secondary: "bg-white text-ink border border-hairline hover:border-navy",
        accent: "bg-ink text-white hover:bg-navy-deep",
        ghost: "bg-transparent text-ink-soft hover:text-ink",
        danger: "bg-red-500 text-white hover:bg-red-600"
    };

    const sizes = {
        sm: "px-5 py-2.5 text-[11px] rounded-pill",
        md: "px-7 py-3.5 text-xs rounded-pill",
        lg: "px-9 py-4 text-sm rounded-pill",
        xl: "px-12 py-5 text-base rounded-pill"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
