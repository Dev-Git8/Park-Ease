import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
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
        render(<Hero businesses={businesses} ready />);
        expect(screen.getByText(/Find/)).toBeInTheDocument();
        expect(screen.getByText(/Spot/)).toBeInTheDocument();
        expect(screen.getByText('12K+')).toBeInTheDocument();
    });

    it('shows the first featured business in the collection slider', () => {
        render(<Hero businesses={businesses} ready />);
        expect(screen.getByText('Downtown Garage')).toBeInTheDocument();
    });

    it('advances the slider on the autoplay interval', () => {
        vi.useFakeTimers();
        render(<Hero businesses={businesses} ready />);
        expect(screen.getByText('Downtown Garage')).toBeInTheDocument();
        act(() => vi.advanceTimersByTime(3800));
        expect(screen.getByText('Harbor Lot')).toBeInTheDocument();
    });
});
