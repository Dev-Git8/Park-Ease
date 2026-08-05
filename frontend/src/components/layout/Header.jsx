import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Car, LogOut, Menu, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSiteUI } from '../../context/SiteUIContext';
import { NAV_LINKS } from '../../data/homeContent';

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
                transparent ? 'bg-transparent text-white' : 'bg-navy-deep text-white shadow-md'
            }`}
        >
            <nav className="hidden flex-1 items-center gap-8 lg:flex">
                {NAV_LINKS.map((link) => (
                    <a key={link.name} href={link.href} className="uppercase tracking-widest text-white/90 transition-colors hover:text-white">
                        {link.name}
                    </a>
                ))}
                <Link to="/about" className="uppercase tracking-widest text-white/90 transition-colors hover:text-white">
                    About
                </Link>
            </nav>

            <Link to="/" className="flex flex-1 items-center justify-center gap-2 text-base font-medium uppercase tracking-[0.2em]">
                <Car className="h-5 w-5" aria-hidden="true" />
                Parkease
            </Link>

            <div className="flex flex-1 items-center justify-end gap-4">
                <button
                    type="button"
                    onClick={openContact}
                    className="hidden text-[11px] font-medium uppercase tracking-widest underline-offset-4 hover:underline sm:inline"
                >
                    List Your Lot
                </button>

                {user ? (
                    <Link
                        to={user.role === 'admin' ? '/admin' : user.role === 'business' ? '/dashboard' : '/profile'}
                        className="hidden items-center gap-2 sm:flex"
                    >
                        <User className="h-4 w-4" aria-hidden="true" />
                        <span className="text-[11px] font-medium uppercase tracking-widest">{user.name}</span>
                    </Link>
                ) : (
                    <Link to="/login" className="hidden text-[11px] font-medium uppercase tracking-widest underline-offset-4 hover:underline sm:inline">
                        Sign In
                    </Link>
                )}

                {user && (
                    <button type="button" onClick={logout} aria-label="Log out" className="hidden sm:inline-flex">
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                    </button>
                )}

                <button
                    type="button"
                    onClick={openMenu}
                    aria-label="Open menu"
                    className="grid h-10 w-10 place-items-center rounded-pill bg-white/15 backdrop-blur transition-colors hover:bg-white/25"
                >
                    <Menu className="h-4 w-4" aria-hidden="true" />
                </button>
            </div>
        </header>
    );
};

export default Header;
