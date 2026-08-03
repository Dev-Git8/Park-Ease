import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Header from './Header';

const mockAuth = { user: null, logout: vi.fn() };
const mockTheme = { theme: 'light', toggleTheme: vi.fn() };
const mockSiteUI = { openMenu: vi.fn(), openContact: vi.fn() };

vi.mock('../../context/AuthContext', () => ({ useAuth: () => mockAuth }));
vi.mock('../../context/ThemeContext', () => ({ useTheme: () => mockTheme }));
vi.mock('../../context/SiteUIContext', () => ({ useSiteUI: () => mockSiteUI }));

const renderHeader = (path = '/') =>
    render(
        <MemoryRouter initialEntries={[path]}>
            <Header />
        </MemoryRouter>
    );

describe('Header', () => {
    it('shows the ParkEase brand mark', () => {
        renderHeader();
        expect(screen.getByText('Parkease')).toBeInTheDocument();
    });

    it('shows Sign In when logged out', () => {
        mockAuth.user = null;
        renderHeader();
        expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    it('shows the user name and no Sign In link when logged in', () => {
        mockAuth.user = { name: 'Jamie Fox', role: 'customer' };
        renderHeader();
        expect(screen.getByText('Jamie Fox')).toBeInTheDocument();
        expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
        mockAuth.user = null;
    });

    it('opens the menu when the burger button is clicked', async () => {
        renderHeader();
        await userEvent.click(screen.getByRole('button', { name: /open menu/i }));
        expect(mockSiteUI.openMenu).toHaveBeenCalledTimes(1);
    });

    it('opens the contact modal when List Your Lot is clicked', async () => {
        renderHeader();
        await userEvent.click(screen.getByText('List Your Lot'));
        expect(mockSiteUI.openContact).toHaveBeenCalledTimes(1);
    });
});
