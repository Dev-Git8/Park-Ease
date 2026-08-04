import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Facilities from './Facilities';

describe('Facilities', () => {
    it('renders the intro heading lines', () => {
        render(<Facilities />);
        expect(screen.getByText('Tour Our')).toBeInTheDocument();
        expect(screen.getByText('Parking')).toBeInTheDocument();
        expect(screen.getByText('Facilities')).toBeInTheDocument();
    });

    it('renders both facility cards with name and description', () => {
        render(<Facilities />);
        expect(screen.getByText('Skyline Rooftop Lot')).toBeInTheDocument();
        expect(screen.getByText('An open-air rooftop lot with skyline views and easy access.')).toBeInTheDocument();
        expect(screen.getByText('Harbor Parking Garage')).toBeInTheDocument();
        expect(screen.getByText('A secure, climate-covered garage built for all-day parking.')).toBeInTheDocument();
    });

    it('gives each facility image its descriptive alt text', () => {
        render(<Facilities />);
        expect(screen.getByAltText('Two sports cars parked on a rooftop parking garage')).toBeInTheDocument();
        expect(screen.getByAltText('Modern multi-story parking garage interior with ventilation systems')).toBeInTheDocument();
    });
});
