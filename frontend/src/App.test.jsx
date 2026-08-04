import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

vi.mock('./api/api', () => ({
    default: {
        get: vi.fn().mockResolvedValue({ data: { data: [] } }),
        post: vi.fn().mockRejectedValue(new Error('no session')),
    },
}));

describe('App', () => {
    it('renders the Header, Home hero, and Footer together on the root route', async () => {
        render(<App />);

        expect(screen.getAllByText('Parkease').length).toBeGreaterThan(0);
        await waitFor(() => expect(screen.getByText('© 2026 ParkEase. All rights reserved.')).toBeInTheDocument());
    });

    it('does not have the old Navbar module on disk', () => {
        // A literal dynamic import of a deleted module fails Vite's transform-time
        // import analysis before the test can even run, so this checks the
        // filesystem directly instead of asserting on a rejected import().
        const navbarPath = resolve(process.cwd(), 'src/components/Navbar.jsx');
        expect(existsSync(navbarPath)).toBe(false);
    });
});
