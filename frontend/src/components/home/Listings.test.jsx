import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Listings from './Listings';

const renderListings = (props) =>
    render(
        <MemoryRouter>
            <Listings {...props} />
        </MemoryRouter>
    );

describe('Listings', () => {
    it('shows skeleton placeholders while loading', () => {
        const { container } = renderListings({ businesses: [], loading: true });
        expect(container.querySelectorAll('.animate-pulse')).toHaveLength(3);
    });

    it('shows an empty-state message when there are no results and not loading', () => {
        renderListings({ businesses: [], loading: false });
        expect(screen.getByText(/no locations match your search/i)).toBeInTheDocument();
    });

    it('renders a card per business with a working Book Now link', () => {
        const businesses = [
            { id: '1', name: 'Downtown Garage', address: '1 Main St', pricePerHour: 4, imageUrl: null },
            { id: '2', name: 'Harbor Lot', address: '2 Bay St', pricePerHour: 6, imageUrl: 'https://example.com/x.jpg' },
        ];
        renderListings({ businesses, loading: false });

        expect(screen.getByText('Downtown Garage')).toBeInTheDocument();
        expect(screen.getByText('Harbor Lot')).toBeInTheDocument();
        expect(screen.getByText('$4')).toBeInTheDocument();

        const links = screen.getAllByRole('link', { name: /book now/i });
        expect(links[0]).toHaveAttribute('href', '/business/1');
        expect(links[1]).toHaveAttribute('href', '/business/2');
    });
});
