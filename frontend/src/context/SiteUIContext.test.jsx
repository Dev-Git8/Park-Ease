import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SiteUIProvider, useSiteUI } from './SiteUIContext';

const Probe = () => {
    const ui = useSiteUI();
    return (
        <div>
            <p>menu:{String(ui.isMenuOpen)}</p>
            <p>contact:{String(ui.isContactOpen)}</p>
            <p>ready:{String(ui.isReady)}</p>
            <button onClick={ui.openMenu}>open-menu</button>
            <button onClick={ui.closeMenu}>close-menu</button>
            <button onClick={ui.openContact}>open-contact</button>
            <button onClick={ui.closeContact}>close-contact</button>
            <button onClick={ui.markReady}>mark-ready</button>
        </div>
    );
};

describe('SiteUIContext', () => {
    beforeEach(() => {
        document.documentElement.style.removeProperty('overflow');
    });

    it('starts closed and not ready', () => {
        render(<SiteUIProvider><Probe /></SiteUIProvider>);
        expect(screen.getByText('menu:false')).toBeInTheDocument();
        expect(screen.getByText('contact:false')).toBeInTheDocument();
        expect(screen.getByText('ready:false')).toBeInTheDocument();
    });

    it('opens the menu and locks scroll, then closes it and unlocks', () => {
        render(<SiteUIProvider><Probe /></SiteUIProvider>);
        fireEvent.click(screen.getByText('open-menu'));
        expect(screen.getByText('menu:true')).toBeInTheDocument();
        expect(document.documentElement.style.overflow).toBe('hidden');

        fireEvent.click(screen.getByText('close-menu'));
        expect(screen.getByText('menu:false')).toBeInTheDocument();
        expect(document.documentElement.style.overflow).toBe('');
    });

    it('opening the contact modal closes an open menu', () => {
        render(<SiteUIProvider><Probe /></SiteUIProvider>);
        fireEvent.click(screen.getByText('open-menu'));
        fireEvent.click(screen.getByText('open-contact'));
        expect(screen.getByText('menu:false')).toBeInTheDocument();
        expect(screen.getByText('contact:true')).toBeInTheDocument();
    });

    it('marks ready', () => {
        render(<SiteUIProvider><Probe /></SiteUIProvider>);
        fireEvent.click(screen.getByText('mark-ready'));
        expect(screen.getByText('ready:true')).toBeInTheDocument();
    });
});
