import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Mail } from 'lucide-react';
import Input from './Input';

describe('Input', () => {
    it('renders a label and forwards props to the input', () => {
        render(<Input label="Email" name="email" placeholder="you@email.com" icon={Mail} />);
        expect(screen.getByText('Email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('you@email.com')).toBeInTheDocument();
    });

    it('shows an error message when error is set', () => {
        render(<Input label="Email" error="Email is required" />);
        expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    it('applies the hairline border by default', () => {
        render(<Input label="Email" name="email" placeholder="you@email.com" />);
        expect(screen.getByPlaceholderText('you@email.com')).toHaveClass('border-hairline');
    });
});
