import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteUIProvider, useSiteUI } from '../../context/SiteUIContext';
import ContactModal from './ContactModal';

vi.mock('../../api/api', () => ({
    default: { get: vi.fn(), post: vi.fn() },
}));

const Harness = () => {
    const { openContact } = useSiteUI();
    return (
        <>
            <button onClick={openContact}>open</button>
            <ContactModal />
        </>
    );
};

describe('ContactModal', () => {
    it('is not interactive until opened', () => {
        render(<SiteUIProvider><Harness /></SiteUIProvider>);
        expect(screen.getByRole('dialog', { hidden: true }).parentElement).toHaveClass('pointer-events-none');
    });

    it('submits the form as a local stub without calling the api module', async () => {
        const api = (await import('../../api/api')).default;
        const user = userEvent.setup();
        render(<SiteUIProvider><Harness /></SiteUIProvider>);

        await user.click(screen.getByText('open'));
        await user.type(screen.getByPlaceholderText('Alex Rivera'), 'Jamie Fox');
        await user.type(screen.getByPlaceholderText('you@email.com'), 'jamie@example.com');
        await user.click(screen.getByRole('button', { name: /request a visit/i }));

        expect(screen.getByText(/sending/i)).toBeInTheDocument();
        expect(await screen.findByText('Request received', {}, { timeout: 2000 })).toBeInTheDocument();
        expect(screen.getByText(/thanks, jamie/i)).toBeInTheDocument();

        expect(api.get).not.toHaveBeenCalled();
        expect(api.post).not.toHaveBeenCalled();
    });

    it('closes on Escape', async () => {
        const user = userEvent.setup();
        render(<SiteUIProvider><Harness /></SiteUIProvider>);
        await user.click(screen.getByText('open'));
        expect(screen.getByRole('dialog').parentElement).not.toHaveClass('pointer-events-none');

        fireEvent.keyDown(window, { key: 'Escape' });
        expect(screen.getByRole('dialog', { hidden: true }).parentElement).toHaveClass('pointer-events-none');
    });
});
