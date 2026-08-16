import React from 'react';
import { motion } from 'framer-motion';

const baseStyles = "group relative inline-flex items-center justify-center overflow-hidden font-medium uppercase tracking-wide transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed";

const variants = {
    primary: "bg-ignition text-white hover:bg-ignition-dark hover:shadow-[0_8px_30px_-6px_rgba(255,106,43,0.65)]",
    secondary: "bg-white text-ink border border-hairline hover:border-ignition",
    accent: "bg-ink text-white hover:bg-ignition-dark",
    ghost: "bg-transparent text-ink-soft hover:text-ink",
    danger: "bg-red-500 text-white hover:bg-red-600"
};

const sizes = {
    sm: "px-5 py-2.5 text-[11px] rounded-pill",
    md: "px-7 py-3.5 text-xs rounded-pill",
    lg: "px-9 py-4 text-sm rounded-pill",
    xl: "px-12 py-5 text-base rounded-pill"
};

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    disabled = false,
    ...props
}) => {
    return (
        <motion.button
            whileHover={disabled ? undefined : { scale: 1.03, y: -1 }}
            whileTap={disabled ? undefined : { scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled}
            {...props}
        >
            {(variant === 'primary' || variant === 'accent') && !disabled && (
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
                />
            )}
            {children}
        </motion.button>
    );
};

export default Button;
