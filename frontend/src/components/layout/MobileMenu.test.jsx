import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import MobileMenu from './MobileMenu';

const mockAuth = { user: null, logout: vi.fn() };
const mockSiteUI = { isMenuOpen: true, closeMenu: vi.fn(), openContact: vi.fn() };

vi.mock('../../context/AuthContext', () => ({ useAuth: () => mockAuth }));
vi.mock('../../context/SiteUIContext', () => ({ useSiteUI: () => mockSiteUI }));

const renderMenu = () =>
    render(
        <MemoryRouter>
            <MobileMenu />
        </MemoryRouter>
    );

describe('MobileMenu', () => {
    beforeEach(() => {
        mockSiteUI.closeMenu.mockClear();
        mockSiteUI.openContact.mockClear();
        mockAuth.logout.mockClear();
    });

    it('renders all menu links', () => {
        renderMenu();
        expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Services' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'About' })).toBeInTheDocument();
    });

    it('shows Sign In / Register when logged out', () => {
        renderMenu();
        expect(screen.getByText('Sign In')).toBeInTheDocument();
        expect(screen.getByText('Register')).toBeInTheDocument();
    });

    it('closes the menu when a link is clicked', async () => {
        renderMenu();
        await userEvent.click(screen.getByRole('link', { name: 'Home' }));
        expect(mockSiteUI.closeMenu).toHaveBeenCalledTimes(1);
    });

    it('opens the contact modal from the List Your Lot pill', async () => {
        renderMenu();
        await userEvent.click(screen.getByText('List Your Lot'));
        expect(mockSiteUI.openContact).toHaveBeenCalledTimes(1);
    });

    it('closes on Escape', () => {
        renderMenu();
        fireEvent.keyDown(window, { key: 'Escape' });
        expect(mockSiteUI.closeMenu).toHaveBeenCalledTimes(1);
    });
});
