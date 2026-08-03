import { useEffect, useMemo, useRef } from 'react';
import Lenis from 'lenis';

const useLenis = () => {
    const lenisRef = useRef(null);

    useEffect(() => {
        const lenis = new Lenis({ smoothWheel: true });
        lenisRef.current = lenis;

        let frameId;
        const raf = (time) => {
            lenis.raf(time);
            frameId = requestAnimationFrame(raf);
        };
        frameId = requestAnimationFrame(raf);

        return () => {
            cancelAnimationFrame(frameId);
            lenis.destroy();
            lenisRef.current = null;
        };
    }, []);

    return useMemo(
        () => ({
            stop: () => lenisRef.current?.stop(),
            start: () => lenisRef.current?.start(),
        }),
        []
    );
};

export default useLenis;
