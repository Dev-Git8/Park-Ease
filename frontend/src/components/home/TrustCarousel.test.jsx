import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TrustCarousel from './TrustCarousel';

describe('TrustCarousel', () => {
    it('shows the first slide by default', () => {
        render(<TrustCarousel />);
        expect(screen.getByText('Downtown Garage')).toBeInTheDocument();
        expect(screen.getByText('Secure')).toBeInTheDocument();
    });

    it('advances to the next slide when the next arrow is clicked', async () => {
        render(<TrustCarousel />);
        await userEvent.click(screen.getByRole('button', { name: /next/i }));
        expect(screen.getByText('EV Charging Hub')).toBeInTheDocument();
    });

    it('wraps to the last slide when previous is clicked from the first slide', async () => {
        render(<TrustCarousel />);
        await userEvent.click(screen.getByRole('button', { name: /previous/i }));
        expect(screen.getByText('Rooftop Collective')).toBeInTheDocument();
    });

    it('jumps to a slide when its dot is clicked', async () => {
        render(<TrustCarousel />);
        const dots = screen.getAllByRole('button', { name: /go to slide/i });
        await userEvent.click(dots[2]);
        expect(screen.getByText('Rooftop Collective')).toBeInTheDocument();
    });
});
