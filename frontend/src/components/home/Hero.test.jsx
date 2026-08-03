import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Hero from './Hero';

const businesses = [
    { id: '1', name: 'Downtown Garage', imageUrl: 'https://example.com/a.jpg' },
    { id: '2', name: 'Harbor Lot', imageUrl: 'https://example.com/b.jpg' },
    { id: '3', name: 'Skyline Rooftop', imageUrl: 'https://example.com/c.jpg' },
];

describe('Hero', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders the hero title words and stat card', () => {
        render(<Hero businesses={businesses} searchTerm="" onSearchTermChange={() => {}} onSearch={() => {}} ready />);
        expect(screen.getByText(/Find/)).toBeInTheDocument();
        expect(screen.getByText(/Perfect/)).toBeInTheDocument();
        expect(screen.getByText('12K+')).toBeInTheDocument();
    });

    it('shows the first featured business in the collection slider', () => {
        render(<Hero businesses={businesses} searchTerm="" onSearchTermChange={() => {}} onSearch={() => {}} ready />);
        expect(screen.getByText('Downtown Garage')).toBeInTheDocument();
    });

    it('advances the slider on the autoplay interval', () => {
        vi.useFakeTimers();
        render(<Hero businesses={businesses} searchTerm="" onSearchTermChange={() => {}} onSearch={() => {}} ready />);
        expect(screen.getByText('Downtown Garage')).toBeInTheDocument();
        act(() => vi.advanceTimersByTime(3800));
        expect(screen.getByText('Harbor Lot')).toBeInTheDocument();
    });

    it('calls onSearchTermChange and onSearch from the destination form', async () => {
        const onSearchTermChange = vi.fn();
        const onSearch = vi.fn((event) => event.preventDefault());
        render(<Hero businesses={businesses} searchTerm="" onSearchTermChange={onSearchTermChange} onSearch={onSearch} ready />);

        await userEvent.type(screen.getByPlaceholderText('City or area name'), 'S');
        expect(onSearchTermChange).toHaveBeenCalledWith('S');

        await userEvent.click(screen.getByRole('button', { name: /search/i }));
        expect(onSearch).toHaveBeenCalledTimes(1);
    });
});
