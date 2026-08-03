import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Eyebrow from './Eyebrow';
import PillButton from './PillButton';
import ArrowButton from './ArrowButton';
import CarouselDots from './CarouselDots';

describe('Eyebrow', () => {
    it('renders its label', () => {
        render(<Eyebrow>Get started</Eyebrow>);
        expect(screen.getByText('Get started')).toBeInTheDocument();
    });
});

describe('PillButton', () => {
    it('renders children and fires onClick', async () => {
        const onClick = vi.fn();
        render(<PillButton onClick={onClick}>Book a Visit</PillButton>);
        await userEvent.click(screen.getByRole('button', { name: /book a visit/i }));
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});

describe('ArrowButton', () => {
    it('fires onClick and exposes an accessible label per direction', async () => {
        const onClick = vi.fn();
        render(<ArrowButton direction="prev" onClick={onClick} />);
        const button = screen.getByRole('button', { name: /previous/i });
        await userEvent.click(button);
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});

describe('CarouselDots', () => {
    it('marks the active dot and calls onSelect with the clicked index', async () => {
        const onSelect = vi.fn();
        render(<CarouselDots count={3} activeIndex={1} onSelect={onSelect} />);
        const buttons = screen.getAllByRole('button');
        expect(buttons).toHaveLength(3);
        expect(buttons[1]).toHaveAttribute('aria-current', 'true');
        await userEvent.click(buttons[2]);
        expect(onSelect).toHaveBeenCalledWith(2);
    });
});
