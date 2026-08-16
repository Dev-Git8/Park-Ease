import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Stats from './Stats';

describe('Stats', () => {
    it('renders all four stat values and labels', async () => {
        render(<Stats />);
        expect(await screen.findByText('40+', {}, { timeout: 3000 })).toBeInTheDocument();
        expect(screen.getAllByText('Cities covered')).toHaveLength(2);
        expect(await screen.findByText('1,200+', {}, { timeout: 3000 })).toBeInTheDocument();
        expect(await screen.findByText('2.4M+', {}, { timeout: 3000 })).toBeInTheDocument();
        expect(await screen.findByText('8', {}, { timeout: 3000 })).toBeInTheDocument();
        expect(screen.getAllByText('Years on the road')).toHaveLength(2);
    });

    it('marks each stat label as visually hidden in its dt', () => {
        const { container } = render(<Stats />);
        const dts = container.querySelectorAll('dt');
        expect(dts).toHaveLength(4);
        dts.forEach((dt) => expect(dt).toHaveClass('sr-only'));
    });
});
