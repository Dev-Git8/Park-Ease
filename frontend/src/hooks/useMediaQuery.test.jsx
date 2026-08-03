import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import useMediaQuery from './useMediaQuery';

const Probe = ({ query }) => {
    const matches = useMediaQuery(query);
    return <p>{matches ? 'matches' : 'no-match'}</p>;
};

describe('useMediaQuery', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('reflects the initial matchMedia result', () => {
        vi.stubGlobal('matchMedia', (query) => ({
            matches: true,
            media: query,
            addEventListener: () => {},
            removeEventListener: () => {},
        }));
        render(<Probe query="(max-width: 768px)" />);
        expect(screen.getByText('matches')).toBeInTheDocument();
    });

    it('updates when the media query change event fires', () => {
        let changeListener;
        vi.stubGlobal('matchMedia', (query) => ({
            matches: false,
            media: query,
            addEventListener: (event, listener) => {
                if (event === 'change') changeListener = listener;
            },
            removeEventListener: () => {},
        }));
        render(<Probe query="(max-width: 768px)" />);
        expect(screen.getByText('no-match')).toBeInTheDocument();

        act(() => changeListener({ matches: true }));
        expect(screen.getByText('matches')).toBeInTheDocument();
    });
});
