import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Car, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSiteUI } from '../../context/SiteUIContext';
import Reveal from '../ui/Reveal';
import PillButton from '../ui/PillButton';
import { MENU_LINKS, SOCIAL_LINKS } from '../../data/homeContent';

const MobileMenu = () => {
    const { user, logout } = useAuth();
    const { isMenuOpen, closeMenu, openContact } = useSiteUI();

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') closeMenu();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [closeMenu]);

    return createPortal(
        <div className={`fixed inset-0 z-[70] flex flex-col ${isMenuOpen ? '' : 'pointer-events-none'}`}>
            <motion.div
                className="absolute inset-0 bg-asphalt"
                initial={{ opacity: 0 }}
                animate={{ opacity: isMenuOpen ? 1 : 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                onClick={closeMenu}
            />
            <motion.div
                initial={{ opacity: 0, y: -24 }}
                animate={isMenuOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: -24 }}
                transition={{ type: 'spring', stiffness: 220, damping: 28 }}
                className="relative flex h-full flex-col p-2 text-white sm:p-3"
            >
                <div className="flex items-center justify-between p-4 sm:p-8">
                    <div className="flex items-center gap-2 text-base font-medium uppercase tracking-[0.2em]">
                        <Car className="h-5 w-5" aria-hidden="true" />
                        Parkease
                    </div>
                    <button
                        type="button"
                        onClick={closeMenu}
                        aria-label="Close menu"
                        className="grid h-10 w-10 place-items-center rounded-pill bg-white/15 transition-colors hover:bg-white/25"
                    >
                        <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                </div>

                <nav className="flex flex-1 flex-col justify-center gap-2 px-4 sm:px-8">
                    {MENU_LINKS.map((link, i) => (
                        <Reveal key={link.name} delayIn={120 + i * 70} preset="reveal">
                            <Link
                                to={link.to}
                                onClick={closeMenu}
                                className="block text-5xl font-medium leading-tight tracking-tight transition-colors hover:text-ignition-light sm:text-7xl"
                            >
                                {link.name}
                            </Link>
                        </Reveal>
                    ))}
                    {user ? (
                        <button
                            type="button"
                            onClick={() => {
                                logout();
                                closeMenu();
                            }}
                            className="mt-4 text-left text-2xl font-medium uppercase tracking-widest text-white/70 hover:text-white"
                        >
                            Log Out
                        </button>
                    ) : (
                        <div className="mt-4 flex gap-6 text-2xl font-medium uppercase tracking-widest text-white/70">
                            <Link to="/login" onClick={closeMenu} className="hover:text-white">Sign In</Link>
                            <Link to="/register" onClick={closeMenu} className="hover:text-white">Register</Link>
                        </div>
                    )}
                </nav>

                <div className="flex flex-col gap-6 border-t border-white/15 p-4 pt-8 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                    <PillButton variant="light" onClick={openContact}>List Your Lot</PillButton>
                    <div className="flex gap-5 text-sm font-medium uppercase tracking-widest text-white/70">
                        {SOCIAL_LINKS.map((social) => (
                            <a key={social.name} href={social.href} className="hover:text-white">{social.name}</a>
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

export default MobileMenu;
