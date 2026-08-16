import { useEffect, useRef } from 'react';
import { animate, motion, useInView, useMotionValue, useTransform } from 'framer-motion';

const parseValue = (raw) => {
    const match = String(raw).match(/^([^\d]*)([\d,.]+)(.*)$/);
    if (!match) return { prefix: '', number: 0, suffix: String(raw), decimals: 0 };
    const [, prefix, numberPart, suffix] = match;
    const decimals = numberPart.includes('.') ? numberPart.split('.')[1].length : 0;
    const number = parseFloat(numberPart.replace(/,/g, ''));
    return { prefix, number, suffix, decimals };
};

const CountUp = ({ value, duration = 1.6, className }) => {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const { prefix, number, suffix, decimals } = parseValue(value);
    const motionValue = useMotionValue(0);
    const display = useTransform(motionValue, (latest) =>
        `${prefix}${latest.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`
    );

    useEffect(() => {
        if (!inView) return undefined;
        const controls = animate(motionValue, number, { duration, ease: [0.16, 1, 0.3, 1] });
        return controls.stop;
    }, [inView, motionValue, number, duration]);

    return (
        <motion.span ref={ref} className={className}>
            {display}
        </motion.span>
    );
};

export default CountUp;
