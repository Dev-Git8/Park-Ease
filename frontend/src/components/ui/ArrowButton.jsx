import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const VARIANTS = {
    outline: 'border border-hairline text-ink hover:border-ink',
    solid: 'bg-ink border border-ink text-white hover:bg-ignition-dark',
};

const ArrowButton = ({ direction = 'next', variant = 'outline', onClick, className = '', ...rest }) => (
    <button
        type="button"
        onClick={onClick}
        aria-label={direction === 'prev' ? 'Previous' : 'Next'}
        className={`grid h-12 w-12 place-items-center rounded-pill transition-colors duration-300 sm:h-14 sm:w-14 ${VARIANTS[variant]} ${className}`}
        {...rest}
    >
        <motion.span
            initial="rest"
            whileHover="hover"
            animate="rest"
            variants={{ rest: { scale: 1 }, hover: { scale: 1.15 } }}
            transition={{ type: 'spring', stiffness: 320, damping: 18 }}
            className={`inline-flex ${direction === 'prev' ? '-scale-x-100' : ''}`}
        >
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </motion.span>
    </button>
);

export default ArrowButton;
