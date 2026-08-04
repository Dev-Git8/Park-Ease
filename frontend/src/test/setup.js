import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
    cleanup();
});

vi.mock('lenis', () => {
    class MockLenis {
        raf() {}
        stop() {}
        start() {}
        destroy() {}
    }
    return { default: MockLenis };
});

class MockIntersectionObserver {
    constructor(callback) {
        this.callback = callback;
    }

    observe(target) {
        this.callback([{ isIntersecting: true, target }]);
    }

    unobserve() {}

    disconnect() {}
}

if (typeof window.IntersectionObserver === 'undefined') {
    window.IntersectionObserver = MockIntersectionObserver;
}

if (typeof window.matchMedia !== 'function') {
    window.matchMedia = (query) => ({
        matches: false,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
    });
}

if (typeof window.requestAnimationFrame !== 'function') {
    window.requestAnimationFrame = (callback) => window.setTimeout(() => callback(Date.now()), 16);
    window.cancelAnimationFrame = (id) => window.clearTimeout(id);
}

// jsdom doesn't implement scrollTo/scrollIntoView; App.jsx and Home.jsx call them directly.
window.scrollTo = () => {};
window.HTMLElement.prototype.scrollIntoView = window.HTMLElement.prototype.scrollIntoView || (() => {});
