import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import Eyebrow from '../ui/Eyebrow';
import TextReveal, { TEXT_EASE } from '../ui/TextReveal';
import { useSiteUI } from '../../context/SiteUIContext';

const ContactModal = () => {
    const { isContactOpen, closeContact } = useSiteUI();
    const [status, setStatus] = useState('idle');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const nameInputRef = useRef(null);

    useEffect(() => {
        if (!isContactOpen) return undefined;
        const focusTimer = window.setTimeout(() => nameInputRef.current?.focus(), 120);
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') closeContact();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.clearTimeout(focusTimer);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isContactOpen, closeContact]);

    useEffect(() => {
        if (isContactOpen) return undefined;
        const resetTimer = window.setTimeout(() => {
            setStatus('idle');
            setName('');
            setEmail('');
            setMessage('');
        }, 350);
        return () => window.clearTimeout(resetTimer);
    }, [isContactOpen]);

    const handleSubmit = (event) => {
        event.preventDefault();
        setStatus('sending');
        window.setTimeout(() => setStatus('sent'), 600);
    };

    return createPortal(
        <div className={`fixed inset-0 z-[90] flex items-end justify-center p-3 sm:items-center sm:p-6 ${isContactOpen ? '' : 'pointer-events-none'}`}>
            <motion.div
                className="absolute inset-0 bg-asphalt/40 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: isContactOpen ? 1 : 0 }}
                transition={{ type: 'spring', stiffness: 240, damping: 30 }}
                onClick={closeContact}
            />
            <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="List your lot"
                initial={{ opacity: 0, y: 28, scale: 0.96 }}
                animate={isContactOpen ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 28, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 240, damping: 26 }}
                className="relative max-h-[92svh] w-full max-w-lg overflow-y-auto rounded-card-lg bg-surface-card p-6 text-ink shadow-2xl sm:p-8"
            >
                <div className="flex items-start justify-between">
                    <div>
                        <Eyebrow>List your lot</Eyebrow>
                        <TextReveal
                            as="h2"
                            mode="lines"
                            segments={['Come see', 'your future spot']}
                            play={isContactOpen}
                            stagger={90}
                            duration={800}
                            ease={TEXT_EASE.expo}
                            className="mt-3 text-4xl font-medium leading-none tracking-tight sm:text-5xl"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={closeContact}
                        aria-label="Close"
                        className="grid h-10 w-10 place-items-center rounded-pill bg-surface transition-colors hover:bg-hairline"
                    >
                        <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                </div>

                {status === 'sent' ? (
                    <div className="mt-8 rounded-card bg-surface p-6 text-center">
                        <div className="mx-auto grid h-12 w-12 place-items-center rounded-pill bg-ignition text-white">
                            <Check className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <p className="mt-4 text-lg font-medium">Request received</p>
                        <p className="mt-2 text-sm text-ink-soft">
                            Thanks, {name.split(' ')[0] || 'there'} — our team will reach out about listing your space.
                        </p>
                        <button
                            type="button"
                            onClick={closeContact}
                            className="mt-6 rounded-pill bg-ink px-7 py-3.5 text-sm font-medium uppercase tracking-wide text-white transition-colors hover:bg-ignition-dark"
                        >
                            Done
                        </button>
                    </div>
                ) : (
                    <form noValidate onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
                        <label className="flex flex-col gap-2">
                            <span className="text-xs font-medium uppercase tracking-[0.18em] text-ink-soft">Full name</span>
                            <input
                                ref={nameInputRef}
                                required
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                placeholder="Alex Rivera"
                                className="w-full rounded-xl border border-hairline bg-background px-4 py-3 text-sm focus:border-ignition focus:outline-none"
                            />
                        </label>
                        <label className="flex flex-col gap-2">
                            <span className="text-xs font-medium uppercase tracking-[0.18em] text-ink-soft">Email</span>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="you@email.com"
                                className="w-full rounded-xl border border-hairline bg-background px-4 py-3 text-sm focus:border-ignition focus:outline-none"
                            />
                        </label>
                        <label className="flex flex-col gap-2">
                            <span className="text-xs font-medium uppercase tracking-[0.18em] text-ink-soft">Tell us about your lot</span>
                            <textarea
                                rows={3}
                                value={message}
                                onChange={(event) => setMessage(event.target.value)}
                                placeholder="I have a 12-space lot near downtown I'd like to list…"
                                className="w-full rounded-xl border border-hairline bg-background px-4 py-3 text-sm focus:border-ignition focus:outline-none"
                            />
                        </label>
                        <button
                            type="submit"
                            disabled={status === 'sending'}
                            className="mt-2 rounded-pill bg-ink px-7 py-3.5 text-sm font-medium uppercase tracking-wide text-white transition-colors hover:bg-ignition-dark disabled:opacity-50"
                        >
                            {status === 'sending' ? 'Sending…' : 'Request a visit'}
                        </button>
                    </form>
                )}
            </motion.div>
        </div>,
        document.body
    );
};

export default ContactModal;
