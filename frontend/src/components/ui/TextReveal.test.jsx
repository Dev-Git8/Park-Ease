import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import TextReveal, { TEXT_EASE } from './TextReveal';

describe('TextReveal', () => {
    it('renders every word', () => {
        render(<TextReveal segments={['Find', 'Your', 'Spot']} />);
        expect(screen.getByText(/Find/)).toBeInTheDocument();
        expect(screen.getByText(/Your/)).toBeInTheDocument();
        expect(screen.getByText(/Spot/)).toBeInTheDocument();
    });

    it('starts hidden and becomes visible when play is true', async () => {
        render(<TextReveal segments={['Hello']} play />);
        const inner = screen.getByText('Hello');
        await waitFor(() => expect(inner).toHaveStyle({ opacity: '1' }));
    });

    it('stays hidden while play is false', () => {
        render(<TextReveal segments={['Hidden']} play={false} />);
        expect(screen.getByText('Hidden')).toHaveStyle({ opacity: '0' });
    });

    it('re-fires the reveal when the segments change while play stays true', async () => {
        const { rerender } = render(<TextReveal segments={['One']} play />);
        await waitFor(() => expect(screen.getByText('One')).toHaveStyle({ opacity: '1' }));

        rerender(<TextReveal segments={['Two']} play />);
        expect(screen.getByText('Two')).toHaveStyle({ opacity: '0' });
        await waitFor(() => expect(screen.getByText('Two')).toHaveStyle({ opacity: '1' }));
    });

    it('renders lines mode as block-level segments', () => {
        render(<TextReveal segments={['Line one', 'Line two']} mode="lines" ease={TEXT_EASE.quart} />);
        expect(screen.getByText('Line one')).toBeInTheDocument();
        expect(screen.getByText('Line two')).toBeInTheDocument();
    });

    it('skips the clip-mask wrapper when clip is false', () => {
        render(<TextReveal segments={['Fade']} clip={false} distance="18px" play={false} />);
        expect(screen.getByText('Fade')).toHaveStyle({ transform: 'translateY(18px)' });
    });
});
