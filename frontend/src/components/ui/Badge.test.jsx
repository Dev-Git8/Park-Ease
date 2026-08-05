import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from './Badge';

describe('Badge', () => {
    it('renders its label', () => {
        render(<Badge>Active</Badge>);
        expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('applies the navy variant classes', () => {
        render(<Badge variant="navy">Featured</Badge>);
        expect(screen.getByText('Featured')).toHaveClass('bg-navy');
    });

    it('defaults to the slate variant', () => {
        render(<Badge>Pending</Badge>);
        expect(screen.getByText('Pending')).toHaveClass('bg-surface');
    });
});
