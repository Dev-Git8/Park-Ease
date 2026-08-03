import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { SiteUIProvider } from '../../context/SiteUIContext';
import IntroLoader from './IntroLoader';

const renderLoader = (onReady) =>
    render(
        <SiteUIProvider>
            <IntroLoader onReady={onReady} />
        </SiteUIProvider>
    );

describe('IntroLoader', () => {
    beforeEach(() => {
        sessionStorage.clear();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('shows the wordmark while active', () => {
        renderLoader(() => {});
        expect(screen.getByText('Parkease')).toBeInTheDocument();
    });

    it('calls onReady after the minimum visible time and marks the session as seen', () => {
        const onReady = vi.fn();
        renderLoader(onReady);
        expect(onReady).not.toHaveBeenCalled();

        act(() => vi.advanceTimersByTime(1400));
        expect(onReady).toHaveBeenCalledTimes(1);
        expect(sessionStorage.getItem('parkease-intro-seen')).toBe('1');
    });

    it('removes itself from the DOM after the exit duration', () => {
        renderLoader(() => {});
        act(() => vi.advanceTimersByTime(1400 + 850));
        expect(screen.queryByText('Parkease')).not.toBeInTheDocument();
    });

    it('force-finishes at the max visible time if the load event never fires', () => {
        const originalReadyState = document.readyState;
        Object.defineProperty(document, 'readyState', { value: 'loading', configurable: true });
        const onReady = vi.fn();
        renderLoader(onReady);

        act(() => vi.advanceTimersByTime(2600));
        expect(onReady).toHaveBeenCalledTimes(1);

        Object.defineProperty(document, 'readyState', { value: originalReadyState, configurable: true });
    });

    it('skips the loader entirely when the session already saw it', () => {
        sessionStorage.setItem('parkease-intro-seen', '1');
        const onReady = vi.fn();
        renderLoader(onReady);
        expect(onReady).toHaveBeenCalledTimes(1);
        expect(screen.queryByText('Parkease')).not.toBeInTheDocument();
    });
});
