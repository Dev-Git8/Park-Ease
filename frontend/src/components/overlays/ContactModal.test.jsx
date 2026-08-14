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

    it('submits the form to the real API and shows the confirmation on success', async () => {
        const api = (await import('../../api/api')).default;
        api.post.mockResolvedValueOnce({ data: { success: true, data: { id: 1 } } });
        const user = userEvent.setup();
        render(<SiteUIProvider><Harness /></SiteUIProvider>);

        await user.click(screen.getByText('open'));
        await user.type(screen.getByPlaceholderText('Alex Rivera'), 'Jamie Fox');
        await user.type(screen.getByPlaceholderText('you@email.com'), 'jamie@example.com');
        await user.click(screen.getByRole('button', { name: /request a visit/i }));

        expect(await screen.findByText('Request received')).toBeInTheDocument();
        expect(screen.getByText(/thanks, jamie/i)).toBeInTheDocument();

        expect(api.post).toHaveBeenCalledWith('/visit-requests', {
            name: 'Jamie Fox',
            email: 'jamie@example.com',
            message: '',
        });
    });

    it('shows an error message when the submission fails', async () => {
        const api = (await import('../../api/api')).default;
        api.post.mockRejectedValueOnce({ response: { data: { message: 'Too many visit requests. Please try again later.' } } });
        const user = userEvent.setup();
        render(<SiteUIProvider><Harness /></SiteUIProvider>);

        await user.click(screen.getByText('open'));
        await user.type(screen.getByPlaceholderText('Alex Rivera'), 'Jamie Fox');
        await user.type(screen.getByPlaceholderText('you@email.com'), 'jamie@example.com');
        await user.click(screen.getByRole('button', { name: /request a visit/i }));

        expect(await screen.findByText('Too many visit requests. Please try again later.')).toBeInTheDocument();
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
