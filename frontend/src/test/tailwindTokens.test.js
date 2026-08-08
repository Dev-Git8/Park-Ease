import { describe, it, expect } from 'vitest';
import tailwindConfig from '../../tailwind.config.js';

describe('tailwind theme tokens', () => {
    it('defines the Midnight Garage ignition/asphalt/pulse/surface/ink palette', () => {
        const { colors } = tailwindConfig.theme.extend;
        expect(colors.ignition.DEFAULT).toBe('#FF6A2B');
        expect(colors.ignition.dark).toBe('#E5501A');
        expect(colors.ignition.light).toBe('#FF8A5B');
        expect(colors.asphalt).toBe('#15171c');
        expect(colors.pulse).toBe('#22D3EE');
        expect(colors.surface.DEFAULT).toBe('#f5f4f2');
        expect(colors.surface.card).toBe('#ffffff');
        expect(colors.ink.DEFAULT).toBe('#0d0d0f');
        expect(colors.ink.soft).toBe('#6b7280');
        expect(colors.ghost).toBe('#d7dae1');
        expect(colors.hairline).toBe('#e6e8ec');
        expect(colors.background).toBe('#ffffff');
    });

    it('defines the glow-pulse animation for real-time slot updates', () => {
        const { animation, keyframes } = tailwindConfig.theme.extend;
        expect(animation['glow-pulse']).toBe('glow-pulse 1.2s ease-out 2');
        expect(keyframes['glow-pulse']['0%'].boxShadow).toContain('34, 211, 238');
    });

    it('defines the card/pill radii', () => {
        const { borderRadius } = tailwindConfig.theme.extend;
        expect(borderRadius.card).toBe('1.5rem');
        expect(borderRadius['card-lg']).toBe('2rem');
        expect(borderRadius.pill).toBe('62.5rem');
    });

    it('puts Onest first in the sans font stack', () => {
        expect(tailwindConfig.theme.extend.fontFamily.sans[0]).toBe('Onest');
    });
});
