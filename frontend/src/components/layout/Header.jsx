import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Car, LogOut, Menu, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSiteUI } from '../../context/SiteUIContext';
import { NAV_LINKS } from '../../data/homeContent';

const DASHBOARD_LABEL = { admin: 'Dashboard', business: 'Dashboard', customer: 'My Bookings' };
const DASHBOARD_PATH = { admin: '/admin', business: '/dashboard', customer: '/profile' };

const NavLink = ({ to, children }) => (
    <Link to={to} className="group relative uppercase tracking-widest text-white/90 transition-colors hover:text-white">
        {children}
        <span className="pointer-events-none absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-ignition transition-transform duration-300 ease-out group-hover:scale-x-100" aria-hidden="true" />
    </Link>
);

const Header = () => {
    const { user, logout } = useAuth();
    const { openMenu, openContact } = useSiteUI();
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);

    const isHome = location.pathname === '/';
    const transparent = isHome && !scrolled;

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header
            className={`sticky top-0 z-50 flex items-center justify-between px-6 py-6 text-xs transition-colors duration-300 sm:px-10 ${
                transparent ? 'bg-transparent text-white' : 'bg-asphalt text-white shadow-md'
            }`}
        >
            <nav className="hidden flex-1 items-center gap-8 md:flex">
                {NAV_LINKS.map((link) => (
                    <NavLink key={link.name} to={link.href}>{link.name}</NavLink>
                ))}
                <NavLink to="/about">About</NavLink>
            </nav>

            <Link to="/" className="flex flex-1 items-center justify-center gap-2 text-base font-medium uppercase tracking-[0.2em]">
                <motion.span whileHover={{ rotate: -12, scale: 1.1 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }} className="inline-flex">
                    <Car className="h-5 w-5" aria-hidden="true" />
                </motion.span>
                Parkease
            </Link>

            <div className="flex flex-1 items-center justify-end gap-4">
                <button
                    type="button"
                    onClick={openContact}
                    className="hidden text-[11px] font-medium uppercase tracking-widest underline-offset-4 hover:underline md:inline"
                >
                    List Your Lot
                </button>

                {user ? (
                    <Link to={DASHBOARD_PATH[user.role] ?? '/profile'} className="hidden items-center gap-2 md:flex">
                        <User className="h-4 w-4" aria-hidden="true" />
                        <span className="flex flex-col text-left leading-tight">
                            <span className="text-[11px] font-medium uppercase tracking-widest">{user.name}</span>
                            <span className="text-[9px] uppercase tracking-widest text-white/60">{DASHBOARD_LABEL[user.role] ?? 'My Bookings'}</span>
                        </span>
                    </Link>
                ) : (
                    <Link to="/login" className="hidden text-[11px] font-medium uppercase tracking-widest underline-offset-4 hover:underline md:inline">
                        Sign In
                    </Link>
                )}

                {user && (
                    <button
                        type="button"
                        onClick={logout}
                        className="hidden items-center gap-2 text-[11px] font-medium uppercase tracking-widest hover:text-white/80 md:inline-flex"
                    >
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                        Log out
                    </button>
                )}

                <motion.button
                    type="button"
                    onClick={openMenu}
                    aria-label="Open menu"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="grid h-10 w-10 place-items-center rounded-pill bg-white/15 backdrop-blur transition-colors hover:bg-white/25"
                >
                    <Menu className="h-4 w-4" aria-hidden="true" />
                </motion.button>
            </div>
        </header>
    );
};

export default Header;
