import { describe, it, expect } from 'vitest';
import { render, act } from '@testing-library/react';
import useLenis from './useLenis';

const Probe = ({ onReady }) => {
    const lenis = useLenis();
    onReady(lenis);
    return null;
};

describe('useLenis', () => {
    it('returns stable start/stop functions across renders', () => {
        const seen = [];
        const { rerender } = render(<Probe onReady={(lenis) => seen.push(lenis)} />);
        rerender(<Probe onReady={(lenis) => seen.push(lenis)} />);
        expect(seen[0]).toBe(seen[1]);
    });

    it('exposes callable start and stop without throwing', () => {
        let captured;
        render(<Probe onReady={(lenis) => { captured = lenis; }} />);
        expect(() => act(() => captured.stop())).not.toThrow();
        expect(() => act(() => captured.start())).not.toThrow();
    });
});
