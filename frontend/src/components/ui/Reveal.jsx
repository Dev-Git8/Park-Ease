import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// eslint-disable-next-line react-refresh/only-export-components -- spring presets are shared by every component that uses Reveal, and belong next to it for discoverability
export const SPRINGS = {
    reveal: { type: 'spring', stiffness: 120, damping: 20 },
    snappy: { type: 'spring', stiffness: 260, damping: 22 },
    panel: { type: 'spring', stiffness: 90, damping: 18 },
};

const useInView = (options) => {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const node = ref.current;
        if (!node || typeof IntersectionObserver === 'undefined') {
            setInView(true);
            return undefined;
        }
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setInView(true);
                observer.disconnect();
            }
        }, options);
        observer.observe(node);
        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return [ref, inView];
};

const Reveal = ({
    children,
    as: Tag = 'div',
    from = { opacity: 0, y: 28 },
    to = { opacity: 1, y: 0 },
    delayIn = 0,
    preset = 'reveal',
    className = '',
}) => {
    const [ref, inView] = useInView({ threshold: 0.2 });
    const reducedMotion = useReducedMotion();
    const MotionTag = motion[Tag] ?? motion.div;
    const visible = inView || reducedMotion;

    return (
        <MotionTag
            ref={ref}
            className={className}
            initial={from}
            animate={visible ? to : from}
            transition={{ ...SPRINGS[preset], delay: reducedMotion ? 0 : delayIn / 1000 }}
        >
            {children}
        </MotionTag>
    );
};

export default Reveal;
