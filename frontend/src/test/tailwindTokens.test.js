import { describe, it, expect } from 'vitest';
import tailwindConfig from '../../tailwind.config.js';

describe('tailwind theme tokens', () => {
    it('defines the Baseline-derived navy/surface/ink palette', () => {
        const { colors } = tailwindConfig.theme.extend;
        expect(colors.navy.DEFAULT).toBe('#2563c9');
        expect(colors.navy.deep).toBe('#0f2f63');
        expect(colors.navy.light).toBe('#5790e6');
        expect(colors.harbor).toBe('#0b6e97');
        expect(colors.surface.DEFAULT).toBe('#f4f4f4');
        expect(colors.surface.card).toBe('#ffffff');
        expect(colors.ink.DEFAULT).toBe('#0a0a0a');
        expect(colors.ink.soft).toBe('#717784');
        expect(colors.ghost).toBe('#d7dae1');
        expect(colors.hairline).toBe('#e6e8ec');
        expect(colors.background).toBe('#ffffff');
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
