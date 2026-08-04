import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Testimonials from './Testimonials';

describe('Testimonials', () => {
    it('renders all three testimonial quotes, names, and roles', () => {
        render(<Testimonials />);
        expect(screen.getByText(/booked in seconds/i)).toBeInTheDocument();
        expect(screen.getByText('Maya Chen')).toBeInTheDocument();
        expect(screen.getByText('Daily Commuter')).toBeInTheDocument();

        expect(screen.getByText(/never circle the block/i)).toBeInTheDocument();
        expect(screen.getByText('Tomás Ibarra')).toBeInTheDocument();

        expect(screen.getByText(/filled it every weekday/i)).toBeInTheDocument();
        expect(screen.getByText('Renee Walsh')).toBeInTheDocument();
    });

    it('has the testimonials section anchor id', () => {
        const { container } = render(<Testimonials />);
        expect(container.querySelector('#testimonials')).toBeInTheDocument();
    });
});
