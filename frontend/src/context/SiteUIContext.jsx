import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import useLenis from '../hooks/useLenis';

const SiteUIContext = createContext(null);

export const SiteUIProvider = ({ children }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isContactOpen, setIsContactOpen] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const lenis = useLenis();

    const locked = isMenuOpen || isContactOpen;

    useEffect(() => {
        const html = document.documentElement;
        if (locked) {
            html.style.position = 'relative';
            html.style.overflow = 'hidden';
            html.style.height = '100%';
            lenis.stop();
        } else {
            html.style.removeProperty('position');
            html.style.removeProperty('overflow');
            html.style.removeProperty('height');
            lenis.start();
        }
    }, [locked, lenis]);

    const openMenu = useCallback(() => setIsMenuOpen(true), []);
    const closeMenu = useCallback(() => setIsMenuOpen(false), []);
    const openContact = useCallback(() => {
        setIsMenuOpen(false);
        setIsContactOpen(true);
    }, []);
    const closeContact = useCallback(() => setIsContactOpen(false), []);
    const markReady = useCallback(() => setIsReady(true), []);

    return (
        <SiteUIContext.Provider
            value={{ isMenuOpen, openMenu, closeMenu, isContactOpen, openContact, closeContact, isReady, markReady, lenis }}
        >
            {children}
        </SiteUIContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components -- consumer hook co-located with its provider, standard React context pattern
export const useSiteUI = () => useContext(SiteUIContext);
