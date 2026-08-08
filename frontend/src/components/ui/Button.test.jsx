import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';

describe('Button', () => {
    it('renders children and fires onClick', async () => {
        const onClick = vi.fn();
        render(<Button onClick={onClick}>Confirm</Button>);
        await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('applies the ignition primary variant by default', () => {
        render(<Button>Confirm</Button>);
        expect(screen.getByRole('button', { name: 'Confirm' })).toHaveClass('bg-ignition');
    });

    it('applies the secondary variant classes', () => {
        render(<Button variant="secondary">Cancel</Button>);
        expect(screen.getByRole('button', { name: 'Cancel' })).toHaveClass('border-hairline');
    });

    it('disables the button when disabled is true', () => {
        render(<Button disabled>Wait</Button>);
        expect(screen.getByRole('button', { name: 'Wait' })).toBeDisabled();
    });
});
