import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Services from './Services';

describe('Services', () => {
    it('renders all four service rows with index, name, description, and link', () => {
        render(<Services />);
        expect(screen.getByText('01')).toBeInTheDocument();
        expect(screen.getByText('Hourly Parking')).toBeInTheDocument();
        expect(screen.getByText('Drop in and pay only for the time you use.')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /valet & event parking/i })).toHaveAttribute('href', '#valet');
    });

    it('has the services section anchor id', () => {
        const { container } = render(<Services />);
        expect(container.querySelector('#services')).toBeInTheDocument();
    });
});
