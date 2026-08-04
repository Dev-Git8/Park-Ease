import { describe, it, expect } from 'vitest';
import { IMAGES } from './images';
import {
    HERO_CONTENT,
    HERO_STAT,
    TRUST_SLIDES,
    TRUST_BADGE,
    SERVICES,
    FACILITIES,
    STATS,
    TESTIMONIALS,
    NAV_LINKS,
    MENU_LINKS,
    FOOTER_LINKS,
    SOCIAL_LINKS,
    CONTACT_INFO,
} from './homeContent';

describe('data/images.js', () => {
    it('exposes exactly the 7 verified image keys as https URLs', () => {
        const keys = Object.keys(IMAGES);
        expect(keys.sort()).toEqual(
            ['facilityGarage', 'facilityRooftop', 'heroBackground', 'heroStatCard', 'trustSlide1', 'trustSlide2', 'trustSlide3'].sort()
        );
        keys.forEach((key) => expect(IMAGES[key]).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/));
    });
});

describe('data/homeContent.js', () => {
    it('has a 3-word hero title and a 2-line tagline', () => {
        expect(HERO_CONTENT.titleWords).toHaveLength(3);
        expect(HERO_CONTENT.taglineLines).toHaveLength(2);
    });

    it('has a dot color for every trust-slide/hero-stat that needs one', () => {
        expect(HERO_STAT.dotColors).toHaveLength(4);
    });

    it('references only image keys that exist in IMAGES', () => {
        TRUST_SLIDES.forEach((slide) => expect(IMAGES[slide.imageKey]).toBeDefined());
        FACILITIES.forEach((facility) => expect(IMAGES[facility.imageKey]).toBeDefined());
    });

    it('has 3 trust slides each with a 4-word headline', () => {
        expect(TRUST_SLIDES).toHaveLength(3);
        TRUST_SLIDES.forEach((slide) => expect(slide.headline).toHaveLength(4));
    });

    it('has the expected section list lengths', () => {
        expect(SERVICES).toHaveLength(4);
        expect(FACILITIES).toHaveLength(2);
        expect(STATS).toHaveLength(4);
        expect(TESTIMONIALS).toHaveLength(3);
    });

    it('has non-empty nav/menu/footer/social/contact data', () => {
        expect(NAV_LINKS.length).toBeGreaterThan(0);
        expect(MENU_LINKS.length).toBeGreaterThan(0);
        expect(FOOTER_LINKS.services.length).toBeGreaterThan(0);
        expect(FOOTER_LINKS.company.length).toBeGreaterThan(0);
        expect(FOOTER_LINKS.legal.length).toBeGreaterThan(0);
        expect(SOCIAL_LINKS.length).toBeGreaterThan(0);
        expect(TRUST_BADGE.title).toBeTruthy();
        expect(CONTACT_INFO.email).toContain('@');
    });
});
