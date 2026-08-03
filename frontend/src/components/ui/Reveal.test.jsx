import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Reveal, { SPRINGS } from './Reveal';

describe('Reveal', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('renders children', () => {
        render(<Reveal>Hello there</Reveal>);
        expect(screen.getByText('Hello there')).toBeInTheDocument();
    });

    it('renders as the given tag', () => {
        render(<Reveal as="article">Card content</Reveal>);
        expect(screen.getByText('Card content').tagName).toBe('ARTICLE');
    });

    it('falls back to visible when IntersectionObserver is unavailable', () => {
        vi.stubGlobal('IntersectionObserver', undefined);
        render(<Reveal>No observer</Reveal>);
        expect(screen.getByText('No observer')).toBeInTheDocument();
    });

    it('exposes the three named spring presets', () => {
        expect(SPRINGS.reveal).toEqual({ type: 'spring', stiffness: 120, damping: 20 });
        expect(SPRINGS.snappy).toEqual({ type: 'spring', stiffness: 260, damping: 22 });
        expect(SPRINGS.panel).toEqual({ type: 'spring', stiffness: 90, damping: 18 });
    });
});
