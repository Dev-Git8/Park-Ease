import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from './Badge';

describe('Badge', () => {
    it('renders its label', () => {
        render(<Badge>Active</Badge>);
        expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('applies the ignition variant classes', () => {
        render(<Badge variant="ignition">Featured</Badge>);
        expect(screen.getByText('Featured')).toHaveClass('bg-ignition');
    });

    it('defaults to the slate variant', () => {
        render(<Badge>Pending</Badge>);
        expect(screen.getByText('Pending')).toHaveClass('bg-surface');
    });
});
