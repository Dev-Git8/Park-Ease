import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Footer from './Footer';

const mockSiteUI = { openContact: vi.fn() };
vi.mock('../../context/SiteUIContext', () => ({ useSiteUI: () => mockSiteUI }));

const renderFooter = () =>
    render(
        <MemoryRouter>
            <Footer />
        </MemoryRouter>
    );

describe('Footer', () => {
    it('renders contact info', () => {
        renderFooter();
        expect(screen.getByText('hello@parkease.com')).toBeInTheDocument();
        expect(screen.getByText('+1 (212) 555-0148')).toBeInTheDocument();
        expect(screen.getByText('500 Market Street, San Francisco')).toBeInTheDocument();
    });

    it('renders the Services, Company, and Legal & Support columns', () => {
        renderFooter();
        expect(screen.getByText('Hourly Parking')).toBeInTheDocument();
        expect(screen.getByText('List Your Lot')).toBeInTheDocument();
        expect(screen.getByText('Privacy')).toBeInTheDocument();
    });

    it('opens the contact modal from the CTA pill', async () => {
        renderFooter();
        await userEvent.click(screen.getByText('Book a Visit'));
        expect(mockSiteUI.openContact).toHaveBeenCalledTimes(1);
    });

    it('renders the copyright line', () => {
        renderFooter();
        expect(screen.getByText('© 2026 ParkEase. All rights reserved.')).toBeInTheDocument();
    });
});
