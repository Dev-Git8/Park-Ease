import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

const Ping = () => <p>pong</p>;

describe('test infrastructure', () => {
    it('renders React components with Testing Library', () => {
        render(<Ping />);
        expect(screen.getByText('pong')).toBeInTheDocument();
    });

    it('provides the polyfills from setup.js', () => {
        expect(typeof window.IntersectionObserver).toBe('function');
        expect(typeof window.matchMedia).toBe('function');
        expect(typeof window.requestAnimationFrame).toBe('function');
    });
});
