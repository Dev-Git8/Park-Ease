import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Users } from 'lucide-react';
import StatCard from './StatCard';

describe('StatCard', () => {
    it('renders the label and value', () => {
        render(<StatCard label="Total bookings" value="42" />);
        expect(screen.getByText('Total bookings')).toBeInTheDocument();
        expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders an optional icon', () => {
        render(<StatCard label="Users" value="10" icon={Users} />);
        expect(document.querySelector('svg')).toBeInTheDocument();
    });

    it('applies the dark tone background', () => {
        render(<StatCard label="Users" value="10" tone="dark" />);
        expect(screen.getByText('Users').closest('div.rounded-card')).toHaveClass('bg-navy-deep');
    });
});
