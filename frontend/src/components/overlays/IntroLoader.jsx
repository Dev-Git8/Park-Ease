import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Car } from 'lucide-react';
import { useSiteUI } from '../../context/SiteUIContext';

const MIN_VISIBLE_MS = 1400;
const MAX_VISIBLE_MS = 2600;
const EXIT_MS = 850;
const SESSION_KEY = 'parkease-intro-seen';

const IntroLoader = ({ onReady }) => {
    const { lenis } = useSiteUI();
    const reducedMotion = useReducedMotion();
    const alreadySeen = sessionStorage.getItem(SESSION_KEY) === '1';

    const [visible, setVisible] = useState(!alreadySeen);
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        if (alreadySeen) {
            onReady();
            return undefined;
        }

        lenis.stop();
        const minVisible = reducedMotion ? 200 : MIN_VISIBLE_MS;
        const maxVisible = reducedMotion ? 200 : MAX_VISIBLE_MS;
        const exitMs = reducedMotion ? 0 : EXIT_MS;

        let finished = false;
        let exitTimer;
        const finish = () => {
            if (finished) return;
            finished = true;
            onReady();
            lenis.start();
            setExiting(true);
            sessionStorage.setItem(SESSION_KEY, '1');
            exitTimer = window.setTimeout(() => setVisible(false), exitMs);
        };

        let minTimer;
        const startCountdown = () => {
            minTimer = window.setTimeout(finish, minVisible);
        };

        if (document.readyState === 'complete') {
            startCountdown();
        } else {
            window.addEventListener('load', startCountdown, { once: true });
        }

        const maxTimer = window.setTimeout(finish, maxVisible);

        return () => {
            window.clearTimeout(minTimer);
            window.clearTimeout(maxTimer);
            window.clearTimeout(exitTimer);
            window.removeEventListener('load', startCountdown);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!visible) return null;

    return (
        <div
            className={`fixed inset-0 z-[200] flex flex-col items-center justify-center gap-8 bg-navy-deep text-white transition-transform ${
                exiting ? '-translate-y-[105%]' : 'translate-y-0'
            }`}
            style={{
                transitionDuration: `${reducedMotion ? 0 : EXIT_MS}ms`,
                transitionTimingFunction: 'cubic-bezier(0.65, 0, 0.35, 1)',
            }}
            role="status"
            aria-live="polite"
        >
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                className="flex items-center gap-2 text-2xl font-medium uppercase tracking-[0.2em]"
            >
                <Car className="h-7 w-7" aria-hidden="true" />
                Parkease
            </motion.div>
            <div className="h-px w-40 overflow-hidden rounded-pill bg-white/20">
                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{
                        delay: reducedMotion ? 0 : 0.12,
                        duration: reducedMotion ? 0.2 : 1.28,
                        ease: [0.65, 0, 0.35, 1],
                    }}
                    style={{ transformOrigin: 'left' }}
                    className="h-full w-full bg-white"
                />
            </div>
        </div>
    );
};

export default IntroLoader;
