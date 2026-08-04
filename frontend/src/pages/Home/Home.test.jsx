import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';

const mockSiteUI = { isReady: true };
vi.mock('../../context/SiteUIContext', () => ({ useSiteUI: () => mockSiteUI }));

vi.mock('../../api/api', () => ({
    default: {
        get: vi.fn((url) => {
            if (url.includes('search=Harbor')) {
                return Promise.resolve({ data: { data: [{ id: '2', name: 'Harbor Lot', address: '2 Bay St', pricePerHour: 6, imageUrl: null }] } });
            }
            return Promise.resolve({
                data: {
                    data: [
                        { id: '1', name: 'Downtown Garage', address: '1 Main St', pricePerHour: 4, imageUrl: null },
                        { id: '2', name: 'Harbor Lot', address: '2 Bay St', pricePerHour: 6, imageUrl: null },
                    ],
                },
            });
        }),
        post: vi.fn(),
    },
}));

describe('Home', () => {
    it('loads businesses on mount and renders them in the listings section', async () => {
        render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>
        );

        await waitFor(() => expect(screen.getByText('Downtown Garage')).toBeInTheDocument());
        expect(screen.getByText('Harbor Lot')).toBeInTheDocument();
    });

    it('re-fetches businesses filtered by the destination search term', async () => {
        const api = (await import('../../api/api')).default;
        render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>
        );
        await waitFor(() => expect(screen.getByText('Downtown Garage')).toBeInTheDocument());

        const user = userEvent.setup();
        await user.type(screen.getByPlaceholderText('City or area name'), 'Harbor');
        await user.click(screen.getByRole('button', { name: /^search$/i }));

        await waitFor(() => expect(api.get).toHaveBeenCalledWith(expect.stringContaining('search=Harbor')));
    });
});
