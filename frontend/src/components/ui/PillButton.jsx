import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const VARIANTS = {
    light: 'bg-white text-ignition-dark hover:bg-ignition-light hover:text-white',
    solid: 'bg-ink text-white hover:bg-ignition-dark',
    outline: 'border border-current text-ink hover:bg-ink hover:text-white',
};

const PillButton = ({ children, variant = 'solid', className = '', ...rest }) => (
    <motion.button
        type="button"
        initial="rest"
        whileHover="hover"
        animate="rest"
        className={`inline-flex items-center gap-2 rounded-pill px-7 py-3.5 text-sm font-medium uppercase tracking-wide transition-colors duration-300 ${VARIANTS[variant]} ${className}`}
        {...rest}
    >
        {children}
        <motion.span
            variants={{ rest: { x: 0 }, hover: { x: 5 } }}
            transition={{ type: 'spring', stiffness: 320, damping: 20 }}
            className="inline-flex"
        >
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </motion.span>
    </motion.button>
);

export default PillButton;
