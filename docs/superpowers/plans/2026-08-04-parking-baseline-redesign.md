# Parking Baseline Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reskin the ParkEase React frontend (navy/blue editorial look, big clip-mask type, spring motion, Lenis smooth scroll) using the "Baseline" reference site as the visual/motion model, with every section's content and imagery swapped for a car-parking marketplace, while preserving all existing auth/booking/dashboard functionality untouched.

**Architecture:** New `layout/` (Header, Footer, MobileMenu) and `overlays/` (IntroLoader, ContactModal) components wrap the whole app via `App.jsx`, replacing the old `Navbar`. A new `home/` folder holds one component per landing-page section, composed by a rewritten `Home.jsx` which keeps ownership of the existing live business-search API call. Small `ui/` primitives (`TextReveal`, `Reveal`, `Eyebrow`, `PillButton`, `ArrowButton`, `CarouselDots`) and a `SiteUIContext` (menu/modal state + Lenis start/stop) are shared across all of the above. All copy and image URLs live in `data/homeContent.js` and `data/images.js`.

**Tech Stack:** React 19, Tailwind CSS 3.4 (new theme tokens added alongside existing ones), Framer Motion 12 (already installed — used for every spring/hover/parallax/in-view animation), Lenis 1.3.25 (new dependency, smooth scroll), Vitest 4 + React Testing Library 16 (new dev dependency — no test setup currently exists), React Router 7, lucide-react.

Reference design spec: `docs/superpowers/specs/2026-08-04-parking-baseline-redesign-design.md`.

## Global Constraints

- **Palette (Tailwind `theme.extend.colors`, added alongside existing `brand`/`primary` keys — do not remove those):**
  `navy: { DEFAULT: '#2563c9', deep: '#0f2f63', light: '#5790e6' }`, `harbor: '#0b6e97'`, `surface: { DEFAULT: '#f4f4f4', card: '#ffffff' }`, `ink: { DEFAULT: '#0a0a0a', soft: '#717784' }`, `ghost: '#d7dae1'`, `hairline: '#e6e8ec'`, `background: '#ffffff'`.
- **Radii:** `borderRadius: { card: '1.5rem', 'card-lg': '2rem', pill: '62.5rem' }` (added alongside existing `3xl`/`4xl`).
- **Font:** Google **Onest** (400/500) added to the existing font link in `index.html`; `fontFamily.sans` becomes `['Onest', 'Inter', 'sans-serif']` (Onest first, Inter as fallback — existing `font-outfit` heading utility is untouched).
- **Breakpoints used throughout:** `sm` 640px, `md` 768px, `lg` 1024px (Tailwind defaults, no change needed).
- **Hover micro-interactions disabled at `max-width: 768px`** via the `useMediaQuery('(max-width: 768px)')` hook — spread `whileHover` props conditionally.
- **Motion presets (Framer Motion `transition`, defined once in `src/components/ui/Reveal.jsx` as `SPRINGS`):** `reveal: { type: 'spring', stiffness: 120, damping: 20 }`, `snappy: { type: 'spring', stiffness: 260, damping: 22 }`, `panel: { type: 'spring', stiffness: 90, damping: 18 }`.
- **Text-reveal easings (exact, from the reference):** `easeOutExpo = [0.16, 1, 0.3, 1]`, `easeOutQuart = [0.25, 1, 0.5, 1]`, `easeInOutCubic = [0.65, 0, 0.35, 1]`.
- **Loader timings (exact):** `MIN_VISIBLE_MS 1400`, `MAX_VISIBLE_MS 2600`, `EXIT_MS 850`; progress-fill delay `120ms`, duration `1280ms`, `easeInOutCubic`; shown once per browser session via `sessionStorage` key `parkease-intro-seen`.
- **Verified image URLs (Unsplash, `?q=80&w=3840&auto=format&fit=crop`, HEAD-verified 200 `image/jpeg` on 2026-08-04):**
  - `heroBackground`: `photo-1772440223098-cc23f6f01209` (aerial parking lot)
  - `heroStatCard`: `photo-1649345646268-373c8c827144` (car close-up)
  - `trustSlide1`: `photo-1769167664137-62bd64e91f0f` (multi-level garage interior)
  - `trustSlide2`: `photo-1755555707544-5f2cea7413c1` (EV charging nozzle)
  - `trustSlide3`: `photo-1744719256525-3deab6fd16ac` (sleek car on a rooftop)
  - `facilityRooftop`: `photo-1741902370639-c33854ea84cb` (rooftop parking, sports cars)
  - `facilityGarage`: `photo-1743660518041-8122521a5ec9` (indoor multi-story garage)
- **No network calls from the contact modal** — its submit handler is a local `setTimeout`-based stub, never calls `api`.
- **Existing pages out of scope and must keep working unmodified:** `pages/Login`, `pages/Register`, `pages/Profile`, `pages/Admin`, `pages/Dashboard`, `pages/About`, `pages/BookingSuccess`, `pages/CheckoutSummary`, `pages/Home/BusinessDetails.jsx`, `components/ui/Badge.jsx`, `components/ui/Button.jsx`, `components/ui/Input.jsx`, `context/AuthContext.jsx`, `context/ThemeContext.jsx`, `context/SocketContext.jsx`, `api/api.js`.

---

### Task 1: Test infrastructure (Vitest + React Testing Library)

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/vite.config.js`
- Create: `frontend/src/test/setup.js`
- Test: `frontend/src/test/infrastructure.test.jsx`

**Interfaces:**
- Produces: a global Vitest setup (`src/test/setup.js`) that every later test file relies on for: (1) a `lenis` module mock (`vi.mock('lenis', ...)` registered globally), (2) an `IntersectionObserver` polyfill that fires `isIntersecting: true` synchronously on `observe()`, (3) a `window.matchMedia` polyfill, (4) a `window.requestAnimationFrame`/`cancelAnimationFrame` polyfill. `npm test` runs `vitest run`.

- [ ] **Step 1: Add test dependencies and scripts to `package.json`**

Add to `devDependencies` (alongside the existing entries, keep alphabetical placement consistent with the rest of the list):

```json
"@testing-library/jest-dom": "^7.0.0",
"@testing-library/react": "^16.3.2",
"@testing-library/user-event": "^14.6.1",
"jsdom": "^30.0.1",
"vitest": "^4.1.10"
```

Add to `dependencies`:

```json
"lenis": "^1.3.25"
```

Add to `scripts`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 2: Run install**

Run: `npm install`
Expected: installs succeed, `package-lock.json` updates, no errors.

- [ ] **Step 3: Point Vitest at jsdom and the setup file**

Replace the full contents of `vite.config.js`:

```js
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    css: true,
  },
})
```

- [ ] **Step 4: Write the setup file**

Create `src/test/setup.js`:

```js
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

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
    global.IntersectionObserver = MockIntersectionObserver;
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
```

- [ ] **Step 5: Write the infrastructure smoke test**

Create `src/test/infrastructure.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

const Ping = () => <p>pong</p>;

describe('test infrastructure', () => {
    it('renders React components with Testing Library', () => {
        render(<Ping />);
        expect(screen.getByText('pong')).toBeInTheDocument();
    });

    it('provides the polyfills from setup.js', () => {
        expect(typeof window.IntersectionObserver).toBe('function');
        expect(typeof window.matchMedia).toBe('function');
        expect(typeof window.requestAnimationFrame).toBe('function');
    });
});
```

- [ ] **Step 6: Run the test**

Run: `npm test`
Expected: 2 passing tests in `src/test/infrastructure.test.jsx`.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vite.config.js src/test/setup.js src/test/infrastructure.test.jsx
git commit -m "test: add Vitest + React Testing Library infrastructure"
```

---

### Task 2: Design tokens, fonts, and global styles

**Files:**
- Modify: `frontend/tailwind.config.js`
- Modify: `frontend/index.html`
- Modify: `frontend/src/index.css`
- Test: `frontend/src/test/tailwindTokens.test.js`

**Interfaces:**
- Produces: Tailwind utility classes `bg-navy`, `bg-navy-deep`, `bg-navy-light`, `text-navy`/`text-navy-deep`/`text-navy-light`, `bg-harbor`, `bg-surface`, `bg-surface-card`, `text-ink`, `text-ink-soft`, `bg-ghost`/`text-ghost`, `border-hairline`, `bg-background`, `rounded-card`, `rounded-card-lg`, `rounded-pill`. These are consumed by every component task from here on.

- [ ] **Step 1: Write the failing token test**

Create `src/test/tailwindTokens.test.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tailwindTokens`
Expected: FAIL — `colors.navy` is undefined.

- [ ] **Step 3: Add the tokens to `tailwind.config.js`**

Replace the full contents of `tailwind.config.js`:

```js
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
      extend: {
        fontFamily: {
          sans: ['Onest', 'Inter', 'sans-serif'],
          outfit: ['Outfit', 'sans-serif'],
        },
        colors: {
          brand: {
            yellow: '#facc15',
            black: '#000000',
            dark: '#0f0f0f',
            'dark-card': '#1a1a1a',
            'light-bg': '#f5f5f5',
            accent: '#facc15',
          },
          primary: {
            DEFAULT: '#facc15',
            dark: '#eab308',
          },
          navy: {
            DEFAULT: '#2563c9',
            deep: '#0f2f63',
            light: '#5790e6',
          },
          harbor: '#0b6e97',
          surface: {
            DEFAULT: '#f4f4f4',
            card: '#ffffff',
          },
          ink: {
            DEFAULT: '#0a0a0a',
            soft: '#717784',
          },
          ghost: '#d7dae1',
          hairline: '#e6e8ec',
          background: '#ffffff',
        },
        boxShadow: {
          'premium': '0 10px 30px -10px rgba(0, 0, 0, 0.08)',
          'premium-hover': '0 20px 40px -15px rgba(0, 0, 0, 0.12)',
          'yellow': '0 10px 15px -3px rgba(250, 204, 21, 0.3)',
        },
        borderRadius: {
          '3xl': '1.5rem',
          '4xl': '2rem',
          card: '1.5rem',
          'card-lg': '2rem',
          pill: '62.5rem',
        }
      },
    },
    plugins: [],
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tailwindTokens`
Expected: PASS (3 tests).

- [ ] **Step 5: Add the Onest font to `index.html`**

In `index.html`, replace the Google Fonts `<link>`:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800;900&family=Onest:wght@400;500&display=swap" rel="stylesheet">
```

- [ ] **Step 6: Add the focus-visible fallback to `src/index.css`**

Add after the existing `@layer base` block in `src/index.css` (keep the existing `success-tick` rules below it untouched):

```css
*:focus-visible {
  outline: 2px solid #5790e6;
  outline-offset: 2px;
}
```

- [ ] **Step 7: Commit**

```bash
git add tailwind.config.js index.html src/index.css src/test/tailwindTokens.test.js
git commit -m "feat: add navy/surface/ink design tokens and Onest font"
```

---

### Task 3: Content and image data modules

**Files:**
- Create: `frontend/src/data/images.js`
- Create: `frontend/src/data/homeContent.js`
- Test: `frontend/src/data/homeContent.test.js`

**Interfaces:**
- Produces: `IMAGES` (object, keys: `heroBackground`, `heroStatCard`, `trustSlide1`, `trustSlide2`, `trustSlide3`, `facilityRooftop`, `facilityGarage` — each a string URL) from `data/images.js`; and from `data/homeContent.js`: `HERO_CONTENT` (`{ titleWords: string[], taglineLines: string[] }`), `HERO_STAT` (`{ value, caption, dotColors: string[] }`), `TRUST_SLIDES` (array of `{ headline: string[4], name, role, imageKey, alt }`), `TRUST_BADGE` (`{ index, title, body, percent, percentCaption }`), `SERVICES` (array of `{ index, name, description, href }`), `FACILITIES` (array of `{ tone, name, description, imageKey, alt }`), `STATS` (array of `{ value, label }`), `TESTIMONIALS` (array of `{ quote, name, role }`), `NAV_LINKS` / `MENU_LINKS` (arrays of `{ name, href }` / `{ name, to }`), `FOOTER_LINKS` (`{ services, company, legal }`, each an array of `{ name, href }` or `{ name, to }`), `SOCIAL_LINKS` (array of `{ name, href }`), `CONTACT_INFO` (`{ email, phone, address }`).
- Consumes: nothing (leaf data modules).

- [ ] **Step 1: Write `data/images.js`**

Create `src/data/images.js`:

```js
const unsplash = (id) => `https://images.unsplash.com/photo-${id}?q=80&w=3840&auto=format&fit=crop`;

export const IMAGES = {
    heroBackground: unsplash('1772440223098-cc23f6f01209'),
    heroStatCard: unsplash('1649345646268-373c8c827144'),
    trustSlide1: unsplash('1769167664137-62bd64e91f0f'),
    trustSlide2: unsplash('1755555707544-5f2cea7413c1'),
    trustSlide3: unsplash('1744719256525-3deab6fd16ac'),
    facilityRooftop: unsplash('1741902370639-c33854ea84cb'),
    facilityGarage: unsplash('1743660518041-8122521a5ec9'),
};
```

- [ ] **Step 2: Write `data/homeContent.js`**

Create `src/data/homeContent.js`:

```js
export const HERO_CONTENT = {
    titleWords: ['Find', 'Your', 'Perfect', 'Spot'],
    taglineLines: ['Park Smart,', 'Drive More'],
};

export const HERO_STAT = {
    value: '12K+',
    caption: 'Drivers parked today',
    dotColors: ['#5790e6', '#c2e029', '#0b6e97', '#ffffff'],
};

export const TRUST_SLIDES = [
    {
        headline: ['Secure', 'Simple', 'Instant', 'Booking'],
        name: 'Downtown Garage',
        role: 'Verified Location',
        imageKey: 'trustSlide1',
        alt: 'Multi-level parking garage interior with cars parked along a ramp',
    },
    {
        headline: ['Verified', 'Trusted', 'Local', 'Hosts'],
        name: 'EV Charging Hub',
        role: 'Verified Location',
        imageKey: 'trustSlide2',
        alt: 'Electric car plugged into a charging station',
    },
    {
        headline: ['Smarter', 'City', 'Parking', 'Today'],
        name: 'Rooftop Collective',
        role: 'Verified Location',
        imageKey: 'trustSlide3',
        alt: 'Sleek car parked on a rooftop with a city skyline behind it',
    },
];

export const TRUST_BADGE = {
    index: '#01',
    title: 'Trusted by drivers everywhere',
    body: "From quick errands to daily commutes, drivers book here because the spot is always exactly where the app says it'll be.",
    percent: '100%',
    percentCaption: 'Booking built around your trip',
};

export const SERVICES = [
    { index: '01', name: 'Hourly Parking', description: 'Drop in and pay only for the time you use.', href: '#hourly' },
    { index: '02', name: 'Monthly Passes', description: 'Reserved parking every day at a flat monthly rate.', href: '#monthly' },
    { index: '03', name: 'EV Charging Spots', description: 'Charge your vehicle while you park, hassle-free.', href: '#ev' },
    { index: '04', name: 'Valet & Event Parking', description: 'White-glove parking for events and busy venues.', href: '#valet' },
];

export const FACILITIES = [
    {
        tone: 'clay',
        name: 'Skyline Rooftop Lot',
        description: 'An open-air rooftop lot with skyline views and easy access.',
        imageKey: 'facilityRooftop',
        alt: 'Two sports cars parked on a rooftop parking garage',
    },
    {
        tone: 'blue',
        name: 'Harbor Parking Garage',
        description: 'A secure, climate-covered garage built for all-day parking.',
        imageKey: 'facilityGarage',
        alt: 'Modern multi-story parking garage interior with ventilation systems',
    },
];

export const STATS = [
    { value: '40+', label: 'Cities covered' },
    { value: '1,200+', label: 'Verified locations' },
    { value: '2.4M+', label: 'Successful bookings' },
    { value: '8', label: 'Years on the road' },
];

export const TESTIMONIALS = [
    { quote: 'I found a spot two minutes from the stadium during a sold-out game. Booked in seconds.', name: 'Maya Chen', role: 'Daily Commuter' },
    { quote: 'The monthly pass saved me over $200 and I never circle the block anymore.', name: 'Tomás Ibarra', role: 'Downtown Resident' },
    { quote: 'Listing my garage on ParkEase filled it every weekday within a week.', name: 'Renee Walsh', role: 'Lot Owner' },
];

export const NAV_LINKS = [
    { name: 'Find Parking', href: '#listings' },
    { name: 'Services', href: '#services' },
];

export const MENU_LINKS = [
    { name: 'Home', to: '/' },
    { name: 'Find Parking', to: '/#listings' },
    { name: 'Services', to: '/#services' },
    { name: 'About', to: '/about' },
];

export const FOOTER_LINKS = {
    services: [
        { name: 'Hourly Parking', href: '#hourly' },
        { name: 'Monthly Passes', href: '#monthly' },
        { name: 'EV Charging Spots', href: '#ev' },
        { name: 'Valet & Event Parking', href: '#valet' },
    ],
    company: [
        { name: 'About', to: '/about' },
        { name: 'List Your Lot', href: '#list-your-lot' },
        { name: 'Careers', href: '#careers' },
        { name: 'Contact', href: '#contact' },
    ],
    legal: [
        { name: 'Privacy', href: '#privacy' },
        { name: 'Terms', href: '#terms' },
        { name: 'Help Center', href: '#help' },
    ],
};

export const SOCIAL_LINKS = [
    { name: 'Instagram', href: '#instagram' },
    { name: 'X', href: '#x' },
    { name: 'YouTube', href: '#youtube' },
    { name: 'LinkedIn', href: '#linkedin' },
];

export const CONTACT_INFO = {
    email: 'hello@parkease.com',
    phone: '+1 (212) 555-0148',
    address: '500 Market Street, San Francisco',
};
```

- [ ] **Step 3: Write the cross-file consistency test**

Create `src/data/homeContent.test.js`:

```js
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
    it('has a 4-word hero title and a 2-line tagline', () => {
        expect(HERO_CONTENT.titleWords).toHaveLength(4);
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
```

- [ ] **Step 4: Run the tests**

Run: `npm test -- homeContent`
Expected: PASS (all `describe` blocks).

- [ ] **Step 5: Commit**

```bash
git add src/data/images.js src/data/homeContent.js src/data/homeContent.test.js
git commit -m "feat: add hardcoded copy and verified image URL data modules"
```

---

### Task 4: Marketing UI atoms (Eyebrow, PillButton, ArrowButton, CarouselDots)

**Files:**
- Create: `frontend/src/components/ui/Eyebrow.jsx`
- Create: `frontend/src/components/ui/PillButton.jsx`
- Create: `frontend/src/components/ui/ArrowButton.jsx`
- Create: `frontend/src/components/ui/CarouselDots.jsx`
- Test: `frontend/src/components/ui/marketingAtoms.test.jsx`

**Interfaces:**
- Produces: `Eyebrow({ children, tone = 'dark' | 'light', className })`; `PillButton({ children, variant = 'light' | 'solid' | 'outline', ...buttonProps })` (renders a `<button>` with a trailing arrow icon); `ArrowButton({ direction = 'prev' | 'next', variant = 'outline' | 'solid', onClick, 'aria-label' })`; `CarouselDots({ count, activeIndex, onSelect, tone = 'dark' | 'light' })`.
- Consumes: `framer-motion`, `lucide-react` (already installed).

- [ ] **Step 1: Write the failing tests**

Create `src/components/ui/marketingAtoms.test.jsx`:

```jsx
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- marketingAtoms`
Expected: FAIL — cannot find modules `./Eyebrow`, `./PillButton`, etc.

- [ ] **Step 3: Implement `Eyebrow.jsx`**

Create `src/components/ui/Eyebrow.jsx`:

```jsx
const TEXT_TONES = {
    dark: 'text-ink-soft',
    light: 'text-white/70',
};

const DOT_TONES = {
    dark: 'bg-navy',
    light: 'bg-navy-light',
};

const Eyebrow = ({ children, tone = 'dark', className = '' }) => (
    <span className={`inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] ${TEXT_TONES[tone]} ${className}`}>
        <span className={`h-1.5 w-1.5 rounded-pill ${DOT_TONES[tone]}`} aria-hidden="true" />
        {children}
    </span>
);

export default Eyebrow;
```

- [ ] **Step 4: Implement `PillButton.jsx`**

Create `src/components/ui/PillButton.jsx`:

```jsx
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const VARIANTS = {
    light: 'bg-white text-navy-deep hover:bg-navy-light hover:text-white',
    solid: 'bg-ink text-white hover:bg-navy-deep',
    outline: 'border border-current text-ink hover:bg-ink hover:text-white',
};

const PillButton = ({ children, variant = 'solid', className = '', ...rest }) => (
    <motion.button
        type="button"
        initial="rest"
        whileHover="hover"
        animate="rest"
        className={`inline-flex items-center gap-2 rounded-pill px-7 py-3.5 text-sm font-medium uppercase tracking-wide transition-colors duration-300 ${VARIANTS[variant]} ${className}`}
        {...rest}
    >
        {children}
        <motion.span
            variants={{ rest: { x: 0 }, hover: { x: 5 } }}
            transition={{ type: 'spring', stiffness: 320, damping: 20 }}
            className="inline-flex"
        >
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </motion.span>
    </motion.button>
);

export default PillButton;
```

- [ ] **Step 5: Implement `ArrowButton.jsx`**

Create `src/components/ui/ArrowButton.jsx`:

```jsx
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const VARIANTS = {
    outline: 'border border-hairline text-ink hover:border-ink',
    solid: 'bg-ink border border-ink text-white hover:bg-navy-deep',
};

const ArrowButton = ({ direction = 'next', variant = 'outline', onClick, className = '', ...rest }) => (
    <button
        type="button"
        onClick={onClick}
        aria-label={direction === 'prev' ? 'Previous' : 'Next'}
        className={`grid h-12 w-12 place-items-center rounded-pill transition-colors duration-300 sm:h-14 sm:w-14 ${VARIANTS[variant]} ${className}`}
        {...rest}
    >
        <motion.span
            initial="rest"
            whileHover="hover"
            animate="rest"
            variants={{ rest: { scale: 1 }, hover: { scale: 1.15 } }}
            transition={{ type: 'spring', stiffness: 320, damping: 18 }}
            className={`inline-flex ${direction === 'prev' ? '-scale-x-100' : ''}`}
        >
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </motion.span>
    </button>
);

export default ArrowButton;
```

- [ ] **Step 6: Implement `CarouselDots.jsx`**

Create `src/components/ui/CarouselDots.jsx`:

```jsx
const CarouselDots = ({ count, activeIndex, onSelect, tone = 'dark' }) => {
    const activeColor = tone === 'dark' ? 'bg-ink' : 'bg-white';
    const idleColor = tone === 'dark' ? 'bg-ghost' : 'bg-white/40';

    return (
        <div className="flex items-center gap-2">
            {Array.from({ length: count }).map((_, i) => (
                <button
                    key={i}
                    type="button"
                    aria-current={i === activeIndex}
                    aria-label={`Go to slide ${i + 1}`}
                    onClick={() => onSelect(i)}
                    className="p-1.5"
                >
                    <span
                        className={`block h-1.5 rounded-pill transition-all duration-300 ${
                            i === activeIndex ? `w-5 ${activeColor}` : `w-1.5 ${idleColor}`
                        }`}
                    />
                </button>
            ))}
        </div>
    );
};

export default CarouselDots;
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm test -- marketingAtoms`
Expected: PASS (4 `describe` blocks).

- [ ] **Step 8: Commit**

```bash
git add src/components/ui/Eyebrow.jsx src/components/ui/PillButton.jsx src/components/ui/ArrowButton.jsx src/components/ui/CarouselDots.jsx src/components/ui/marketingAtoms.test.jsx
git commit -m "feat: add Eyebrow, PillButton, ArrowButton, CarouselDots UI atoms"
```

---

### Task 5: Reveal primitives (TextReveal, Reveal)

**Files:**
- Create: `frontend/src/components/ui/TextReveal.jsx`
- Create: `frontend/src/components/ui/Reveal.jsx`
- Test: `frontend/src/components/ui/TextReveal.test.jsx`
- Test: `frontend/src/components/ui/Reveal.test.jsx`

**Interfaces:**
- Produces from `TextReveal.jsx`: default export `TextReveal({ segments: string[], as = 'span', mode = 'words' | 'lines', clip = true, distance = '115%', play = true, stagger = 120, baseDelay = 0, duration = 950, ease = EASE_OUT_EXPO, className, segmentClassName })`, plus named exports `EASE_OUT_EXPO`, `EASE_OUT_QUART`, `TEXT_EASE = { expo, quart }`.
- Produces from `Reveal.jsx`: default export `Reveal({ children, as = 'div', from = { opacity: 0, y: 28 }, to = { opacity: 1, y: 0 }, delayIn = 0, preset = 'reveal', className })`, plus named export `SPRINGS = { reveal, snappy, panel }`.
- Consumes: `framer-motion` (`motion`, `useReducedMotion`).

- [ ] **Step 1: Write the failing `TextReveal` test**

Create `src/components/ui/TextReveal.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import TextReveal, { TEXT_EASE } from './TextReveal';

describe('TextReveal', () => {
    it('renders every word with a space between them', () => {
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

    it('renders lines mode as block-level segments without a trailing space', () => {
        render(<TextReveal segments={['Line one', 'Line two']} mode="lines" ease={TEXT_EASE.quart} />);
        expect(screen.getByText('Line one')).toBeInTheDocument();
        expect(screen.getByText('Line two')).toBeInTheDocument();
    });

    it('skips the clip-mask wrapper when clip is false', () => {
        render(<TextReveal segments={['Fade']} clip={false} distance="18px" play={false} />);
        expect(screen.getByText('Fade')).toHaveStyle({ transform: 'translateY(18px)' });
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- TextReveal`
Expected: FAIL — cannot find module `./TextReveal`.

- [ ] **Step 3: Implement `TextReveal.jsx`**

Create `src/components/ui/TextReveal.jsx`:

```jsx
import { useEffect, useState } from 'react';

export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1];
export const EASE_OUT_QUART = [0.25, 1, 0.5, 1];
export const TEXT_EASE = { expo: EASE_OUT_EXPO, quart: EASE_OUT_QUART };

const TextReveal = ({
    segments,
    as: Tag = 'span',
    mode = 'words',
    clip = true,
    distance = '115%',
    play = true,
    stagger = 120,
    baseDelay = 0,
    duration = 950,
    ease = EASE_OUT_EXPO,
    className = '',
    segmentClassName = '',
}) => {
    const [visible, setVisible] = useState(false);
    const contentKey = segments.join('|');

    useEffect(() => {
        if (!play) {
            setVisible(false);
            return undefined;
        }
        setVisible(false);
        const timer = setTimeout(() => setVisible(true), 0);
        return () => clearTimeout(timer);
        // contentKey re-fires the reveal whenever the active text changes (carousels).
    }, [play, contentKey]);

    const renderSegment = (segment, i) => (
        <span
            className={`inline-block ${segmentClassName}`}
            style={{
                transform: visible ? 'translateY(0)' : `translateY(${distance})`,
                opacity: visible ? 1 : 0,
                transitionProperty: 'transform, opacity',
                transitionDuration: `${duration}ms`,
                transitionTimingFunction: `cubic-bezier(${ease.join(',')})`,
                transitionDelay: `${baseDelay + i * stagger}ms`,
            }}
        >
            {segment}
            {mode === 'words' && i < segments.length - 1 ? ' ' : ''}
        </span>
    );

    if (!clip) {
        return (
            <Tag className={className}>
                {segments.map((segment, i) => (
                    <span key={`${segment}-${i}`} className={mode === 'lines' ? 'block' : 'inline-block'}>
                        {renderSegment(segment, i)}
                    </span>
                ))}
            </Tag>
        );
    }

    const clipPadding = mode === 'lines' ? 'pb-[0.14em]' : 'pb-[0.12em]';

    return (
        <Tag className={className}>
            {segments.map((segment, i) => (
                <span key={`${segment}-${i}`} className={`overflow-hidden ${clipPadding} ${mode === 'lines' ? 'block' : 'inline-block'}`}>
                    {renderSegment(segment, i)}
                </span>
            ))}
        </Tag>
    );
};

export default TextReveal;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- TextReveal`
Expected: PASS (6 tests).

- [ ] **Step 5: Write the failing `Reveal` test**

Create `src/components/ui/Reveal.test.jsx`:

```jsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Reveal, { SPRINGS } from './Reveal';

describe('Reveal', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('renders children', () => {
        render(<Reveal>Hello there</Reveal>);
        expect(screen.getByText('Hello there')).toBeInTheDocument();
    });

    it('renders as the given tag', () => {
        render(<Reveal as="article">Card content</Reveal>);
        expect(screen.getByText('Card content').tagName).toBe('ARTICLE');
    });

    it('falls back to visible when IntersectionObserver is unavailable', () => {
        vi.stubGlobal('IntersectionObserver', undefined);
        render(<Reveal>No observer</Reveal>);
        expect(screen.getByText('No observer')).toBeInTheDocument();
    });

    it('exposes the three named spring presets', () => {
        expect(SPRINGS.reveal).toEqual({ type: 'spring', stiffness: 120, damping: 20 });
        expect(SPRINGS.snappy).toEqual({ type: 'spring', stiffness: 260, damping: 22 });
        expect(SPRINGS.panel).toEqual({ type: 'spring', stiffness: 90, damping: 18 });
    });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test -- Reveal.test`
Expected: FAIL — cannot find module `./Reveal`.

- [ ] **Step 7: Implement `Reveal.jsx`**

Create `src/components/ui/Reveal.jsx`:

```jsx
import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export const SPRINGS = {
    reveal: { type: 'spring', stiffness: 120, damping: 20 },
    snappy: { type: 'spring', stiffness: 260, damping: 22 },
    panel: { type: 'spring', stiffness: 90, damping: 18 },
};

const useInView = (options) => {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const node = ref.current;
        if (!node || typeof IntersectionObserver === 'undefined') {
            setInView(true);
            return undefined;
        }
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setInView(true);
                observer.disconnect();
            }
        }, options);
        observer.observe(node);
        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return [ref, inView];
};

const Reveal = ({
    children,
    as: Tag = 'div',
    from = { opacity: 0, y: 28 },
    to = { opacity: 1, y: 0 },
    delayIn = 0,
    preset = 'reveal',
    className = '',
}) => {
    const [ref, inView] = useInView({ threshold: 0.2 });
    const reducedMotion = useReducedMotion();
    const MotionTag = motion[Tag] ?? motion.div;
    const visible = inView || reducedMotion;

    return (
        <MotionTag
            ref={ref}
            className={className}
            initial={from}
            animate={visible ? to : from}
            transition={{ ...SPRINGS[preset], delay: reducedMotion ? 0 : delayIn / 1000 }}
        >
            {children}
        </MotionTag>
    );
};

export default Reveal;
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm test -- Reveal.test`
Expected: PASS (4 tests).

- [ ] **Step 9: Commit**

```bash
git add src/components/ui/TextReveal.jsx src/components/ui/TextReveal.test.jsx src/components/ui/Reveal.jsx src/components/ui/Reveal.test.jsx
git commit -m "feat: add TextReveal clip-mask and Reveal in-view spring primitives"
```

---

### Task 6: `useLenis` and `useMediaQuery` hooks

**Files:**
- Create: `frontend/src/hooks/useLenis.js`
- Create: `frontend/src/hooks/useMediaQuery.js`
- Test: `frontend/src/hooks/useLenis.test.jsx`
- Test: `frontend/src/hooks/useMediaQuery.test.jsx`

**Interfaces:**
- Produces: `useLenis()` returns a stable `{ start(), stop() }` object (memoized, safe to put in effect dependency arrays). `useMediaQuery(query: string)` returns a boolean and re-renders on change.
- Consumes: `lenis` npm package (mocked globally by `src/test/setup.js`).

- [ ] **Step 1: Write the failing `useLenis` test**

Create `src/hooks/useLenis.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, act } from '@testing-library/react';
import useLenis from './useLenis';

const Probe = ({ onReady }) => {
    const lenis = useLenis();
    onReady(lenis);
    return null;
};

describe('useLenis', () => {
    it('returns stable start/stop functions across renders', () => {
        const seen = [];
        const { rerender } = render(<Probe onReady={(lenis) => seen.push(lenis)} />);
        rerender(<Probe onReady={(lenis) => seen.push(lenis)} />);
        expect(seen[0]).toBe(seen[1]);
    });

    it('exposes callable start and stop without throwing', () => {
        let captured;
        render(<Probe onReady={(lenis) => { captured = lenis; }} />);
        expect(() => act(() => captured.stop())).not.toThrow();
        expect(() => act(() => captured.start())).not.toThrow();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- useLenis`
Expected: FAIL — cannot find module `./useLenis`.

- [ ] **Step 3: Implement `useLenis.js`**

Create `src/hooks/useLenis.js`:

```js
import { useEffect, useMemo, useRef } from 'react';
import Lenis from 'lenis';

const useLenis = () => {
    const lenisRef = useRef(null);

    useEffect(() => {
        const lenis = new Lenis({ smoothWheel: true });
        lenisRef.current = lenis;

        let frameId;
        const raf = (time) => {
            lenis.raf(time);
            frameId = requestAnimationFrame(raf);
        };
        frameId = requestAnimationFrame(raf);

        return () => {
            cancelAnimationFrame(frameId);
            lenis.destroy();
            lenisRef.current = null;
        };
    }, []);

    return useMemo(
        () => ({
            stop: () => lenisRef.current?.stop(),
            start: () => lenisRef.current?.start(),
        }),
        []
    );
};

export default useLenis;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- useLenis`
Expected: PASS (2 tests).

- [ ] **Step 5: Write the failing `useMediaQuery` test**

Create `src/hooks/useMediaQuery.test.jsx`:

```jsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import useMediaQuery from './useMediaQuery';

const Probe = ({ query }) => {
    const matches = useMediaQuery(query);
    return <p>{matches ? 'matches' : 'no-match'}</p>;
};

describe('useMediaQuery', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('reflects the initial matchMedia result', () => {
        vi.stubGlobal('matchMedia', (query) => ({
            matches: true,
            media: query,
            addEventListener: () => {},
            removeEventListener: () => {},
        }));
        render(<Probe query="(max-width: 768px)" />);
        expect(screen.getByText('matches')).toBeInTheDocument();
    });

    it('updates when the media query change event fires', () => {
        let changeListener;
        vi.stubGlobal('matchMedia', (query) => ({
            matches: false,
            media: query,
            addEventListener: (event, listener) => {
                if (event === 'change') changeListener = listener;
            },
            removeEventListener: () => {},
        }));
        render(<Probe query="(max-width: 768px)" />);
        expect(screen.getByText('no-match')).toBeInTheDocument();

        act(() => changeListener({ matches: true }));
        expect(screen.getByText('matches')).toBeInTheDocument();
    });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test -- useMediaQuery`
Expected: FAIL — cannot find module `./useMediaQuery`.

- [ ] **Step 7: Implement `useMediaQuery.js`**

Create `src/hooks/useMediaQuery.js`:

```js
import { useEffect, useState } from 'react';

const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

    useEffect(() => {
        const mediaQueryList = window.matchMedia(query);
        const listener = (event) => setMatches(event.matches);
        setMatches(mediaQueryList.matches);
        mediaQueryList.addEventListener('change', listener);
        return () => mediaQueryList.removeEventListener('change', listener);
    }, [query]);

    return matches;
};

export default useMediaQuery;
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm test -- useMediaQuery`
Expected: PASS (2 tests).

- [ ] **Step 9: Commit**

```bash
git add src/hooks/useLenis.js src/hooks/useLenis.test.jsx src/hooks/useMediaQuery.js src/hooks/useMediaQuery.test.jsx
git commit -m "feat: add useLenis and useMediaQuery hooks"
```

---

### Task 7: `SiteUIContext`

**Files:**
- Create: `frontend/src/context/SiteUIContext.jsx`
- Test: `frontend/src/context/SiteUIContext.test.jsx`

**Interfaces:**
- Consumes: `useLenis()` from Task 6.
- Produces: `SiteUIProvider({ children })` and `useSiteUI()` returning `{ isMenuOpen, openMenu, closeMenu, isContactOpen, openContact, closeContact, isReady, markReady, lenis: { start, stop } }`. `openContact` also closes the menu if it was open. While `isMenuOpen || isContactOpen` is true, `document.documentElement.style` gets `position: relative; overflow: hidden; height: 100%` and `lenis.stop()` is called; otherwise those styles are removed and `lenis.start()` is called. This is consumed by every Task 8–20 component.

- [ ] **Step 1: Write the failing test**

Create `src/context/SiteUIContext.test.jsx`:

```jsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SiteUIProvider, useSiteUI } from './SiteUIContext';

const Probe = () => {
    const ui = useSiteUI();
    return (
        <div>
            <p>menu:{String(ui.isMenuOpen)}</p>
            <p>contact:{String(ui.isContactOpen)}</p>
            <p>ready:{String(ui.isReady)}</p>
            <button onClick={ui.openMenu}>open-menu</button>
            <button onClick={ui.closeMenu}>close-menu</button>
            <button onClick={ui.openContact}>open-contact</button>
            <button onClick={ui.closeContact}>close-contact</button>
            <button onClick={ui.markReady}>mark-ready</button>
        </div>
    );
};

describe('SiteUIContext', () => {
    beforeEach(() => {
        document.documentElement.style.removeProperty('overflow');
    });

    it('starts closed and not ready', () => {
        render(<SiteUIProvider><Probe /></SiteUIProvider>);
        expect(screen.getByText('menu:false')).toBeInTheDocument();
        expect(screen.getByText('contact:false')).toBeInTheDocument();
        expect(screen.getByText('ready:false')).toBeInTheDocument();
    });

    it('opens the menu and locks scroll, then closes it and unlocks', () => {
        render(<SiteUIProvider><Probe /></SiteUIProvider>);
        fireEvent.click(screen.getByText('open-menu'));
        expect(screen.getByText('menu:true')).toBeInTheDocument();
        expect(document.documentElement.style.overflow).toBe('hidden');

        fireEvent.click(screen.getByText('close-menu'));
        expect(screen.getByText('menu:false')).toBeInTheDocument();
        expect(document.documentElement.style.overflow).toBe('');
    });

    it('opening the contact modal closes an open menu', () => {
        render(<SiteUIProvider><Probe /></SiteUIProvider>);
        fireEvent.click(screen.getByText('open-menu'));
        fireEvent.click(screen.getByText('open-contact'));
        expect(screen.getByText('menu:false')).toBeInTheDocument();
        expect(screen.getByText('contact:true')).toBeInTheDocument();
    });

    it('marks ready', () => {
        render(<SiteUIProvider><Probe /></SiteUIProvider>);
        fireEvent.click(screen.getByText('mark-ready'));
        expect(screen.getByText('ready:true')).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- SiteUIContext`
Expected: FAIL — cannot find module `./SiteUIContext`.

- [ ] **Step 3: Implement `SiteUIContext.jsx`**

Create `src/context/SiteUIContext.jsx`:

```jsx
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import useLenis from '../hooks/useLenis';

const SiteUIContext = createContext(null);

export const SiteUIProvider = ({ children }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isContactOpen, setIsContactOpen] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const lenis = useLenis();

    const locked = isMenuOpen || isContactOpen;

    useEffect(() => {
        const html = document.documentElement;
        if (locked) {
            html.style.position = 'relative';
            html.style.overflow = 'hidden';
            html.style.height = '100%';
            lenis.stop();
        } else {
            html.style.removeProperty('position');
            html.style.removeProperty('overflow');
            html.style.removeProperty('height');
            lenis.start();
        }
    }, [locked, lenis]);

    const openMenu = useCallback(() => setIsMenuOpen(true), []);
    const closeMenu = useCallback(() => setIsMenuOpen(false), []);
    const openContact = useCallback(() => {
        setIsMenuOpen(false);
        setIsContactOpen(true);
    }, []);
    const closeContact = useCallback(() => setIsContactOpen(false), []);
    const markReady = useCallback(() => setIsReady(true), []);

    return (
        <SiteUIContext.Provider
            value={{ isMenuOpen, openMenu, closeMenu, isContactOpen, openContact, closeContact, isReady, markReady, lenis }}
        >
            {children}
        </SiteUIContext.Provider>
    );
};

export const useSiteUI = () => useContext(SiteUIContext);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- SiteUIContext`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/context/SiteUIContext.jsx src/context/SiteUIContext.test.jsx
git commit -m "feat: add SiteUIContext for menu/modal state, ready flag, and Lenis lock"
```

---

### Task 8: `IntroLoader` overlay

**Files:**
- Create: `frontend/src/components/overlays/IntroLoader.jsx`
- Test: `frontend/src/components/overlays/IntroLoader.test.jsx`

**Interfaces:**
- Consumes: `useSiteUI()` from Task 7 (uses `lenis.start`/`lenis.stop`; calls the `onReady` prop, which `App.jsx` will wire to `markReady`).
- Produces: `IntroLoader({ onReady: () => void })`. Renders a full-screen navy curtain once per browser session (`sessionStorage['parkease-intro-seen']`), calls `onReady` after `MIN_VISIBLE_MS` (or immediately if already seen this session, or forced at `MAX_VISIBLE_MS` if `window.load` never fires), then removes itself from the DOM after `EXIT_MS`.

- [ ] **Step 1: Write the failing test**

Create `src/components/overlays/IntroLoader.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SiteUIProvider } from '../../context/SiteUIContext';
import IntroLoader from './IntroLoader';

const renderLoader = (onReady) =>
    render(
        <SiteUIProvider>
            <IntroLoader onReady={onReady} />
        </SiteUIProvider>
    );

describe('IntroLoader', () => {
    beforeEach(() => {
        sessionStorage.clear();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('shows the wordmark while active', () => {
        renderLoader(() => {});
        expect(screen.getByText('Parkease')).toBeInTheDocument();
    });

    it('calls onReady after the minimum visible time and marks the session as seen', () => {
        const onReady = vi.fn();
        renderLoader(onReady);
        expect(onReady).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1400);
        expect(onReady).toHaveBeenCalledTimes(1);
        expect(sessionStorage.getItem('parkease-intro-seen')).toBe('1');
    });

    it('removes itself from the DOM after the exit duration', () => {
        renderLoader(() => {});
        vi.advanceTimersByTime(1400 + 850);
        expect(screen.queryByText('Parkease')).not.toBeInTheDocument();
    });

    it('force-finishes at the max visible time if the load event never fires', () => {
        const originalReadyState = document.readyState;
        Object.defineProperty(document, 'readyState', { value: 'loading', configurable: true });
        const onReady = vi.fn();
        renderLoader(onReady);

        vi.advanceTimersByTime(2600);
        expect(onReady).toHaveBeenCalledTimes(1);

        Object.defineProperty(document, 'readyState', { value: originalReadyState, configurable: true });
    });

    it('skips the loader entirely when the session already saw it', () => {
        sessionStorage.setItem('parkease-intro-seen', '1');
        const onReady = vi.fn();
        renderLoader(onReady);
        expect(onReady).toHaveBeenCalledTimes(1);
        expect(screen.queryByText('Parkease')).not.toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- IntroLoader`
Expected: FAIL — cannot find module `./IntroLoader`.

- [ ] **Step 3: Implement `IntroLoader.jsx`**

Create `src/components/overlays/IntroLoader.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Car } from 'lucide-react';
import { useSiteUI } from '../../context/SiteUIContext';

const MIN_VISIBLE_MS = 1400;
const MAX_VISIBLE_MS = 2600;
const EXIT_MS = 850;
const SESSION_KEY = 'parkease-intro-seen';

const IntroLoader = ({ onReady }) => {
    const { lenis } = useSiteUI();
    const reducedMotion = useReducedMotion();
    const alreadySeen = sessionStorage.getItem(SESSION_KEY) === '1';

    const [visible, setVisible] = useState(!alreadySeen);
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        if (alreadySeen) {
            onReady();
            return undefined;
        }

        lenis.stop();
        const minVisible = reducedMotion ? 200 : MIN_VISIBLE_MS;
        const maxVisible = reducedMotion ? 200 : MAX_VISIBLE_MS;
        const exitMs = reducedMotion ? 0 : EXIT_MS;

        let finished = false;
        let exitTimer;
        const finish = () => {
            if (finished) return;
            finished = true;
            onReady();
            lenis.start();
            setExiting(true);
            sessionStorage.setItem(SESSION_KEY, '1');
            exitTimer = window.setTimeout(() => setVisible(false), exitMs);
        };

        let minTimer;
        const startCountdown = () => {
            minTimer = window.setTimeout(finish, minVisible);
        };

        if (document.readyState === 'complete') {
            startCountdown();
        } else {
            window.addEventListener('load', startCountdown, { once: true });
        }

        const maxTimer = window.setTimeout(finish, maxVisible);

        return () => {
            window.clearTimeout(minTimer);
            window.clearTimeout(maxTimer);
            window.clearTimeout(exitTimer);
            window.removeEventListener('load', startCountdown);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!visible) return null;

    return (
        <div
            className={`fixed inset-0 z-[200] flex flex-col items-center justify-center gap-8 bg-navy-deep text-white transition-transform ${
                exiting ? '-translate-y-[105%]' : 'translate-y-0'
            }`}
            style={{
                transitionDuration: `${reducedMotion ? 0 : EXIT_MS}ms`,
                transitionTimingFunction: 'cubic-bezier(0.65, 0, 0.35, 1)',
            }}
            role="status"
            aria-live="polite"
        >
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                className="flex items-center gap-2 text-2xl font-medium uppercase tracking-[0.2em]"
            >
                <Car className="h-7 w-7" aria-hidden="true" />
                Parkease
            </motion.div>
            <div className="h-px w-40 overflow-hidden rounded-pill bg-white/20">
                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{
                        delay: reducedMotion ? 0 : 0.12,
                        duration: reducedMotion ? 0.2 : 1.28,
                        ease: [0.65, 0, 0.35, 1],
                    }}
                    style={{ transformOrigin: 'left' }}
                    className="h-full w-full bg-white"
                />
            </div>
        </div>
    );
};

export default IntroLoader;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- IntroLoader`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/overlays/IntroLoader.jsx src/components/overlays/IntroLoader.test.jsx
git commit -m "feat: add IntroLoader once-per-session curtain"
```

---

### Task 9: `ContactModal` overlay ("List Your Lot")

**Files:**
- Create: `frontend/src/components/overlays/ContactModal.jsx`
- Test: `frontend/src/components/overlays/ContactModal.test.jsx`

**Interfaces:**
- Consumes: `useSiteUI()` (Task 7), `TextReveal`/`TEXT_EASE` (Task 5), `Eyebrow` (Task 4).
- Produces: `ContactModal()` (no props — fully driven by `SiteUIContext`). Portals to `document.body`. Never imports or calls `../../api/api`.

- [ ] **Step 1: Write the failing test**

Create `src/components/overlays/ContactModal.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('is not interactive until opened', () => {
        render(<SiteUIProvider><Harness /></SiteUIProvider>);
        expect(screen.getByRole('dialog', { hidden: true }).parentElement).toHaveClass('pointer-events-none');
    });

    it('submits the form as a local stub without calling the api module', async () => {
        const api = (await import('../../api/api')).default;
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        render(<SiteUIProvider><Harness /></SiteUIProvider>);

        await user.click(screen.getByText('open'));
        await user.type(screen.getByPlaceholderText('Alex Rivera'), 'Jamie Fox');
        await user.type(screen.getByPlaceholderText('you@email.com'), 'jamie@example.com');
        await user.click(screen.getByRole('button', { name: /request a visit/i }));

        expect(screen.getByText(/sending/i)).toBeInTheDocument();
        vi.advanceTimersByTime(600);
        expect(await screen.findByText('Request received')).toBeInTheDocument();
        expect(screen.getByText(/thanks, jamie/i)).toBeInTheDocument();

        expect(api.get).not.toHaveBeenCalled();
        expect(api.post).not.toHaveBeenCalled();
    });

    it('closes on Escape', async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        render(<SiteUIProvider><Harness /></SiteUIProvider>);
        await user.click(screen.getByText('open'));
        expect(screen.getByRole('dialog').parentElement).not.toHaveClass('pointer-events-none');

        fireEvent.keyDown(window, { key: 'Escape' });
        expect(screen.getByRole('dialog', { hidden: true }).parentElement).toHaveClass('pointer-events-none');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ContactModal`
Expected: FAIL — cannot find module `./ContactModal`.

- [ ] **Step 3: Implement `ContactModal.jsx`**

Create `src/components/overlays/ContactModal.jsx`:

```jsx
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
                className="absolute inset-0 bg-navy-deep/40 backdrop-blur-sm"
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
                        <div className="mx-auto grid h-12 w-12 place-items-center rounded-pill bg-navy text-white">
                            <Check className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <p className="mt-4 text-lg font-medium">Request received</p>
                        <p className="mt-2 text-sm text-ink-soft">
                            Thanks, {name.split(' ')[0] || 'there'} — our team will reach out about listing your space.
                        </p>
                        <button
                            type="button"
                            onClick={closeContact}
                            className="mt-6 rounded-pill bg-ink px-7 py-3.5 text-sm font-medium uppercase tracking-wide text-white transition-colors hover:bg-navy-deep"
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
                                className="w-full rounded-xl border border-hairline bg-background px-4 py-3 text-sm focus:border-navy-light focus:outline-none"
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
                                className="w-full rounded-xl border border-hairline bg-background px-4 py-3 text-sm focus:border-navy-light focus:outline-none"
                            />
                        </label>
                        <label className="flex flex-col gap-2">
                            <span className="text-xs font-medium uppercase tracking-[0.18em] text-ink-soft">Tell us about your lot</span>
                            <textarea
                                rows={3}
                                value={message}
                                onChange={(event) => setMessage(event.target.value)}
                                placeholder="I have a 12-space lot near downtown I'd like to list…"
                                className="w-full rounded-xl border border-hairline bg-background px-4 py-3 text-sm focus:border-navy-light focus:outline-none"
                            />
                        </label>
                        <button
                            type="submit"
                            disabled={status === 'sending'}
                            className="mt-2 rounded-pill bg-ink px-7 py-3.5 text-sm font-medium uppercase tracking-wide text-white transition-colors hover:bg-navy-deep disabled:opacity-50"
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- ContactModal`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/overlays/ContactModal.jsx src/components/overlays/ContactModal.test.jsx
git commit -m "feat: add ContactModal List Your Lot inquiry stub"
```

---

### Task 10: `Header` layout component

**Files:**
- Create: `frontend/src/components/layout/Header.jsx`
- Test: `frontend/src/components/layout/Header.test.jsx`

**Interfaces:**
- Consumes: `useAuth()` from `context/AuthContext.jsx` (existing, `{ user: { name, role } | null, logout() }`), `useTheme()` from `context/ThemeContext.jsx` (existing, `{ theme: 'light' | 'dark', toggleTheme() }`), `useSiteUI()` (Task 7, uses `openMenu`, `openContact`), `NAV_LINKS` (Task 3).
- Produces: `Header()` — no props. Renders transparent-over-hero on `/` when unscrolled, solid navy otherwise.

- [ ] **Step 1: Write the failing test**

Create `src/components/layout/Header.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Header from './Header';

const mockAuth = { user: null, logout: vi.fn() };
const mockTheme = { theme: 'light', toggleTheme: vi.fn() };
const mockSiteUI = { openMenu: vi.fn(), openContact: vi.fn() };

vi.mock('../../context/AuthContext', () => ({ useAuth: () => mockAuth }));
vi.mock('../../context/ThemeContext', () => ({ useTheme: () => mockTheme }));
vi.mock('../../context/SiteUIContext', () => ({ useSiteUI: () => mockSiteUI }));

const renderHeader = (path = '/') =>
    render(
        <MemoryRouter initialEntries={[path]}>
            <Header />
        </MemoryRouter>
    );

describe('Header', () => {
    it('shows the ParkEase brand mark', () => {
        renderHeader();
        expect(screen.getByText('Parkease')).toBeInTheDocument();
    });

    it('shows Sign In when logged out', () => {
        mockAuth.user = null;
        renderHeader();
        expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    it('shows the user name and no Sign In link when logged in', () => {
        mockAuth.user = { name: 'Jamie Fox', role: 'customer' };
        renderHeader();
        expect(screen.getByText('Jamie Fox')).toBeInTheDocument();
        expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
        mockAuth.user = null;
    });

    it('opens the menu when the burger button is clicked', async () => {
        renderHeader();
        await userEvent.click(screen.getByRole('button', { name: /open menu/i }));
        expect(mockSiteUI.openMenu).toHaveBeenCalledTimes(1);
    });

    it('opens the contact modal when List Your Lot is clicked', async () => {
        renderHeader();
        await userEvent.click(screen.getByText('List Your Lot'));
        expect(mockSiteUI.openContact).toHaveBeenCalledTimes(1);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- Header.test`
Expected: FAIL — cannot find module `./Header`.

- [ ] **Step 3: Implement `Header.jsx`**

Create `src/components/layout/Header.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Car, LogOut, Menu, Moon, Sun, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSiteUI } from '../../context/SiteUIContext';
import { NAV_LINKS } from '../../data/homeContent';

const Header = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { openMenu, openContact } = useSiteUI();
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);

    const isHome = location.pathname === '/';
    const transparent = isHome && !scrolled;

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header
            className={`sticky top-0 z-50 flex items-center justify-between px-6 py-6 text-xs transition-colors duration-300 sm:px-10 ${
                transparent ? 'bg-transparent text-white' : 'bg-navy-deep text-white shadow-md'
            }`}
        >
            <nav className="hidden flex-1 items-center gap-8 lg:flex">
                {NAV_LINKS.map((link) => (
                    <a key={link.name} href={link.href} className="uppercase tracking-widest text-white/90 transition-colors hover:text-white">
                        {link.name}
                    </a>
                ))}
                <Link to="/about" className="uppercase tracking-widest text-white/90 transition-colors hover:text-white">
                    About
                </Link>
            </nav>

            <Link to="/" className="flex flex-1 items-center justify-center gap-2 text-base font-medium uppercase tracking-[0.2em]">
                <Car className="h-5 w-5" aria-hidden="true" />
                Parkease
            </Link>

            <div className="flex flex-1 items-center justify-end gap-4">
                <button
                    type="button"
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                    className="hidden h-10 w-10 place-items-center rounded-pill bg-white/15 backdrop-blur transition-colors hover:bg-white/25 sm:grid"
                >
                    {theme === 'light' ? <Moon className="h-4 w-4" aria-hidden="true" /> : <Sun className="h-4 w-4" aria-hidden="true" />}
                </button>

                <button
                    type="button"
                    onClick={openContact}
                    className="hidden text-[11px] font-medium uppercase tracking-widest underline-offset-4 hover:underline sm:inline"
                >
                    List Your Lot
                </button>

                {user ? (
                    <Link
                        to={user.role === 'admin' ? '/admin' : user.role === 'business' ? '/dashboard' : '/profile'}
                        className="hidden items-center gap-2 sm:flex"
                    >
                        <User className="h-4 w-4" aria-hidden="true" />
                        <span className="text-[11px] font-medium uppercase tracking-widest">{user.name}</span>
                    </Link>
                ) : (
                    <Link to="/login" className="hidden text-[11px] font-medium uppercase tracking-widest underline-offset-4 hover:underline sm:inline">
                        Sign In
                    </Link>
                )}

                {user && (
                    <button type="button" onClick={logout} aria-label="Log out" className="hidden sm:inline-flex">
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                    </button>
                )}

                <button
                    type="button"
                    onClick={openMenu}
                    aria-label="Open menu"
                    className="grid h-10 w-10 place-items-center rounded-pill bg-white/15 backdrop-blur transition-colors hover:bg-white/25"
                >
                    <Menu className="h-4 w-4" aria-hidden="true" />
                </button>
            </div>
        </header>
    );
};

export default Header;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- Header.test`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Header.jsx src/components/layout/Header.test.jsx
git commit -m "feat: add site-wide Header replacing Navbar"
```

---

### Task 11: `MobileMenu` layout component (fullscreen overlay)

**Files:**
- Create: `frontend/src/components/layout/MobileMenu.jsx`
- Test: `frontend/src/components/layout/MobileMenu.test.jsx`

**Interfaces:**
- Consumes: `useAuth()`, `useSiteUI()` (Task 7), `Reveal` (Task 5), `PillButton` (Task 4), `MENU_LINKS`/`SOCIAL_LINKS` (Task 3).
- Produces: `MobileMenu()` — no props, portaled to `document.body`.

- [ ] **Step 1: Write the failing test**

Create `src/components/layout/MobileMenu.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import MobileMenu from './MobileMenu';

const mockAuth = { user: null, logout: vi.fn() };
const mockSiteUI = { isMenuOpen: true, closeMenu: vi.fn(), openContact: vi.fn() };

vi.mock('../../context/AuthContext', () => ({ useAuth: () => mockAuth }));
vi.mock('../../context/SiteUIContext', () => ({ useSiteUI: () => mockSiteUI }));

const renderMenu = () =>
    render(
        <MemoryRouter>
            <MobileMenu />
        </MemoryRouter>
    );

describe('MobileMenu', () => {
    it('renders all menu links', () => {
        renderMenu();
        expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Services' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'About' })).toBeInTheDocument();
    });

    it('shows Sign In / Register when logged out', () => {
        renderMenu();
        expect(screen.getByText('Sign In')).toBeInTheDocument();
        expect(screen.getByText('Register')).toBeInTheDocument();
    });

    it('closes the menu when a link is clicked', async () => {
        renderMenu();
        await userEvent.click(screen.getByRole('link', { name: 'Home' }));
        expect(mockSiteUI.closeMenu).toHaveBeenCalledTimes(1);
    });

    it('opens the contact modal from the List Your Lot pill', async () => {
        renderMenu();
        await userEvent.click(screen.getByText('List Your Lot'));
        expect(mockSiteUI.openContact).toHaveBeenCalledTimes(1);
    });

    it('closes on Escape', () => {
        renderMenu();
        fireEvent.keyDown(window, { key: 'Escape' });
        expect(mockSiteUI.closeMenu).toHaveBeenCalledTimes(1);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- MobileMenu`
Expected: FAIL — cannot find module `./MobileMenu`.

- [ ] **Step 3: Implement `MobileMenu.jsx`**

Create `src/components/layout/MobileMenu.jsx`:

```jsx
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Car, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSiteUI } from '../../context/SiteUIContext';
import Reveal from '../ui/Reveal';
import PillButton from '../ui/PillButton';
import { MENU_LINKS, SOCIAL_LINKS } from '../../data/homeContent';

const MobileMenu = () => {
    const { user, logout } = useAuth();
    const { isMenuOpen, closeMenu, openContact } = useSiteUI();

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') closeMenu();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [closeMenu]);

    return createPortal(
        <div className={`fixed inset-0 z-[70] flex flex-col ${isMenuOpen ? '' : 'pointer-events-none'}`}>
            <motion.div
                className="absolute inset-0 bg-navy-deep"
                initial={{ opacity: 0 }}
                animate={{ opacity: isMenuOpen ? 1 : 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                onClick={closeMenu}
            />
            <motion.div
                initial={{ opacity: 0, y: -24 }}
                animate={isMenuOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: -24 }}
                transition={{ type: 'spring', stiffness: 220, damping: 28 }}
                className="relative flex h-full flex-col p-2 text-white sm:p-3"
            >
                <div className="flex items-center justify-between p-4 sm:p-8">
                    <div className="flex items-center gap-2 text-base font-medium uppercase tracking-[0.2em]">
                        <Car className="h-5 w-5" aria-hidden="true" />
                        Parkease
                    </div>
                    <button
                        type="button"
                        onClick={closeMenu}
                        aria-label="Close menu"
                        className="grid h-10 w-10 place-items-center rounded-pill bg-white/15 transition-colors hover:bg-white/25"
                    >
                        <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                </div>

                <nav className="flex flex-1 flex-col justify-center gap-2 px-4 sm:px-8">
                    {MENU_LINKS.map((link, i) => (
                        <Reveal key={link.name} delayIn={120 + i * 70} preset="reveal">
                            <Link
                                to={link.to}
                                onClick={closeMenu}
                                className="block text-5xl font-medium leading-tight tracking-tight transition-colors hover:text-navy-light sm:text-7xl"
                            >
                                {link.name}
                            </Link>
                        </Reveal>
                    ))}
                    {user ? (
                        <button
                            type="button"
                            onClick={() => {
                                logout();
                                closeMenu();
                            }}
                            className="mt-4 text-left text-2xl font-medium uppercase tracking-widest text-white/70 hover:text-white"
                        >
                            Log Out
                        </button>
                    ) : (
                        <div className="mt-4 flex gap-6 text-2xl font-medium uppercase tracking-widest text-white/70">
                            <Link to="/login" onClick={closeMenu} className="hover:text-white">Sign In</Link>
                            <Link to="/register" onClick={closeMenu} className="hover:text-white">Register</Link>
                        </div>
                    )}
                </nav>

                <div className="flex flex-col gap-6 border-t border-white/15 p-4 pt-8 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                    <PillButton variant="light" onClick={openContact}>List Your Lot</PillButton>
                    <div className="flex gap-5 text-sm font-medium uppercase tracking-widest text-white/70">
                        {SOCIAL_LINKS.map((social) => (
                            <a key={social.name} href={social.href} className="hover:text-white">{social.name}</a>
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

export default MobileMenu;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- MobileMenu`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/MobileMenu.jsx src/components/layout/MobileMenu.test.jsx
git commit -m "feat: add fullscreen MobileMenu overlay"
```

---

### Task 12: `Footer` layout component

**Files:**
- Create: `frontend/src/components/layout/Footer.jsx`
- Test: `frontend/src/components/layout/Footer.test.jsx`

**Interfaces:**
- Consumes: `useSiteUI()` (Task 7), `Eyebrow`/`PillButton` (Task 4), `TextReveal`/`TEXT_EASE`/`Reveal` (Task 5), `CONTACT_INFO`/`FOOTER_LINKS`/`SOCIAL_LINKS` (Task 3).
- Produces: `Footer()` — no props.

- [ ] **Step 1: Write the failing test**

Create `src/components/layout/Footer.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Footer from './Footer';

const mockSiteUI = { openContact: vi.fn() };
vi.mock('../../context/SiteUIContext', () => ({ useSiteUI: () => mockSiteUI }));

const renderFooter = () =>
    render(
        <MemoryRouter>
            <Footer />
        </MemoryRouter>
    );

describe('Footer', () => {
    it('renders contact info', () => {
        renderFooter();
        expect(screen.getByText('hello@parkease.com')).toBeInTheDocument();
        expect(screen.getByText('+1 (212) 555-0148')).toBeInTheDocument();
        expect(screen.getByText('500 Market Street, San Francisco')).toBeInTheDocument();
    });

    it('renders the Services, Company, and Legal & Support columns', () => {
        renderFooter();
        expect(screen.getByText('Hourly Parking')).toBeInTheDocument();
        expect(screen.getByText('List Your Lot')).toBeInTheDocument();
        expect(screen.getByText('Privacy')).toBeInTheDocument();
    });

    it('opens the contact modal from the CTA pill', async () => {
        renderFooter();
        await userEvent.click(screen.getByText('Book a Visit'));
        expect(mockSiteUI.openContact).toHaveBeenCalledTimes(1);
    });

    it('renders the copyright line', () => {
        renderFooter();
        expect(screen.getByText('© 2026 ParkEase. All rights reserved.')).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- Footer.test`
Expected: FAIL — cannot find module `./Footer`.

- [ ] **Step 3: Implement `Footer.jsx`**

Create `src/components/layout/Footer.jsx`:

```jsx
import { Link } from 'react-router-dom';
import { Car, Mail, Phone } from 'lucide-react';
import Eyebrow from '../ui/Eyebrow';
import TextReveal, { TEXT_EASE } from '../ui/TextReveal';
import PillButton from '../ui/PillButton';
import Reveal from '../ui/Reveal';
import { useSiteUI } from '../../context/SiteUIContext';
import { CONTACT_INFO, FOOTER_LINKS, SOCIAL_LINKS } from '../../data/homeContent';

const FooterColumn = ({ title, links }) => (
    <nav>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/50">{title}</p>
        <ul className="mt-4 flex flex-col gap-3 text-sm text-white/80">
            {links.map((link) => (
                <li key={link.name}>
                    {link.to ? (
                        <Link to={link.to} className="hover:text-white">{link.name}</Link>
                    ) : (
                        <a href={link.href} className="hover:text-white">{link.name}</a>
                    )}
                </li>
            ))}
        </ul>
    </nav>
);

const Footer = () => {
    const { openContact } = useSiteUI();

    return (
        <footer id="contact" className="mt-3 rounded-card-lg bg-navy-deep px-6 py-14 text-white sm:px-10 sm:py-16">
            <div className="flex flex-col gap-8 border-b border-white/15 pb-14 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <Eyebrow tone="light">Get started</Eyebrow>
                    <TextReveal
                        as="p"
                        mode="lines"
                        segments={['Ready to', 'park?']}
                        duration={950}
                        ease={TEXT_EASE.expo}
                        className="mt-4 text-6xl font-medium leading-[0.92] tracking-tight"
                    />
                </div>
                <Reveal delayIn={150} preset="reveal">
                    <PillButton variant="light" onClick={openContact}>Book a Visit</PillButton>
                </Reveal>
            </div>

            <div className="grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
                <div className="max-w-xs">
                    <div className="flex items-center gap-2 text-lg font-medium uppercase tracking-[0.2em]">
                        <Car className="h-5 w-5" aria-hidden="true" />
                        Parkease
                    </div>
                    <p className="mt-4 text-sm text-white/65">
                        A smarter way to find, book, and manage parking — from hourly spots to full parking lots.
                    </p>
                    <address className="mt-6 flex flex-col gap-2 text-sm not-italic text-white/80">
                        <a href={`mailto:${CONTACT_INFO.email}`} className="inline-flex items-center gap-2 hover:text-white">
                            <Mail className="h-4 w-4" aria-hidden="true" /> {CONTACT_INFO.email}
                        </a>
                        <a href={`tel:${CONTACT_INFO.phone.replace(/[^+\d]/g, '')}`} className="inline-flex items-center gap-2 hover:text-white">
                            <Phone className="h-4 w-4" aria-hidden="true" /> {CONTACT_INFO.phone}
                        </a>
                        <span className="text-white/55">{CONTACT_INFO.address}</span>
                    </address>
                </div>

                <FooterColumn title="Services" links={FOOTER_LINKS.services} />
                <FooterColumn title="Company" links={FOOTER_LINKS.company} />
                <FooterColumn title="Legal & Support" links={FOOTER_LINKS.legal} />
            </div>

            <div className="flex flex-col gap-5 border-t border-white/15 pt-8 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
                <p>© 2026 ParkEase. All rights reserved.</p>
                <nav className="flex gap-5">
                    {SOCIAL_LINKS.map((social) => (
                        <a key={social.name} href={social.href} className="hover:text-white">{social.name}</a>
                    ))}
                </nav>
            </div>
        </footer>
    );
};

export default Footer;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- Footer.test`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Footer.jsx src/components/layout/Footer.test.jsx
git commit -m "feat: add site-wide Footer"
```

---

### Task 13: `Hero` home section

**Files:**
- Create: `frontend/src/components/home/Hero.jsx`
- Test: `frontend/src/components/home/Hero.test.jsx`

**Interfaces:**
- Consumes: `TextReveal`/`TEXT_EASE` (Task 5), `Reveal` (Task 5), `CarouselDots` (Task 4), `HERO_CONTENT`/`HERO_STAT` (Task 3), `IMAGES` (Task 3).
- Produces: `Hero({ businesses: Array<{id, name, imageUrl}>, searchTerm: string, onSearchTermChange: (value) => void, onSearch: (event) => void, ready: boolean })`. This is the interface `pages/Home/Home.jsx` (Task 20) will call with.

- [ ] **Step 1: Write the failing test**

Create `src/components/home/Hero.test.jsx`:

```jsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Hero from './Hero';

const businesses = [
    { id: '1', name: 'Downtown Garage', imageUrl: 'https://example.com/a.jpg' },
    { id: '2', name: 'Harbor Lot', imageUrl: 'https://example.com/b.jpg' },
    { id: '3', name: 'Skyline Rooftop', imageUrl: 'https://example.com/c.jpg' },
];

describe('Hero', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders the hero title words and tagline', () => {
        render(<Hero businesses={businesses} searchTerm="" onSearchTermChange={() => {}} onSearch={() => {}} ready />);
        expect(screen.getByText(/Find/)).toBeInTheDocument();
        expect(screen.getByText(/Perfect/)).toBeInTheDocument();
        expect(screen.getByText('12K+')).toBeInTheDocument();
    });

    it('shows the first featured business in the collection slider', () => {
        render(<Hero businesses={businesses} searchTerm="" onSearchTermChange={() => {}} onSearch={() => {}} ready />);
        expect(screen.getByText('Downtown Garage')).toBeInTheDocument();
    });

    it('advances the slider on the autoplay interval', () => {
        vi.useFakeTimers();
        render(<Hero businesses={businesses} searchTerm="" onSearchTermChange={() => {}} onSearch={() => {}} ready />);
        expect(screen.getByText('Downtown Garage')).toBeInTheDocument();
        vi.advanceTimersByTime(3800);
        expect(screen.getByText('Harbor Lot')).toBeInTheDocument();
    });

    it('calls onSearchTermChange and onSearch from the destination form', async () => {
        const onSearchTermChange = vi.fn();
        const onSearch = vi.fn((event) => event.preventDefault());
        render(<Hero businesses={businesses} searchTerm="" onSearchTermChange={onSearchTermChange} onSearch={onSearch} ready />);

        await userEvent.type(screen.getByPlaceholderText('City or area name'), 'S');
        expect(onSearchTermChange).toHaveBeenCalledWith('S');

        await userEvent.click(screen.getByRole('button', { name: /search/i }));
        expect(onSearch).toHaveBeenCalledTimes(1);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- Hero.test`
Expected: FAIL — cannot find module `./Hero`.

- [ ] **Step 3: Implement `Hero.jsx`**

Create `src/components/home/Hero.jsx`:

```jsx
import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Navigation } from 'lucide-react';
import TextReveal, { TEXT_EASE } from '../ui/TextReveal';
import Reveal from '../ui/Reveal';
import CarouselDots from '../ui/CarouselDots';
import { HERO_CONTENT, HERO_STAT } from '../../data/homeContent';
import { IMAGES } from '../../data/images';

const SLIDE_INTERVAL_MS = 3800;

const FeaturedSlide = ({ slide, ready }) => {
    if (!slide) return null;
    return (
        <motion.a
            key={slide.id}
            href={`/business/${slide.id}`}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={ready ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 210, damping: 24 }}
            className="flex items-center gap-3 rounded-card border border-white/15 bg-white/10 p-3 shadow-lg backdrop-blur"
        >
            <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-white/10">
                {slide.imageUrl && <img src={slide.imageUrl} alt={slide.name} loading="lazy" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0">
                <p className="truncate text-[0.7rem] font-medium uppercase tracking-wide">Featured Location</p>
                <p className="truncate text-[0.7rem] uppercase text-white/80">{slide.name}</p>
                <span className="text-[0.65rem] underline">View spot →</span>
            </div>
        </motion.a>
    );
};

const Hero = ({ businesses, searchTerm, onSearchTermChange, onSearch, ready }) => {
    const sectionRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
    const parallaxY = useTransform(scrollYProgress, [0, 1], ['0%', '12%']);

    const slides = businesses.slice(0, 3);
    const [activeSlide, setActiveSlide] = useState(0);

    useEffect(() => {
        setActiveSlide(0);
    }, [slides.length]);

    useEffect(() => {
        if (!ready || slides.length < 2) return undefined;
        const timer = window.setInterval(() => {
            setActiveSlide((prev) => (prev + 1) % slides.length);
        }, SLIDE_INTERVAL_MS);
        return () => window.clearInterval(timer);
    }, [ready, slides.length]);

    const currentSlide = slides[activeSlide];

    return (
        <section
            ref={sectionRef}
            className="relative isolate flex min-h-[36rem] flex-col overflow-hidden rounded-card-lg bg-navy-deep text-white"
            style={{ height: 'calc(100svh - 1rem)' }}
        >
            <div className="absolute inset-0 -z-10">
                <motion.div style={{ y: parallaxY, top: '-16%', height: '132%' }} className="absolute left-0 right-0 w-full">
                    <img
                        src={IMAGES.heroBackground}
                        alt="Rows of cars parked in a parking lot, seen from above"
                        loading="eager"
                        fetchPriority="high"
                        className="h-full w-full object-cover"
                    />
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-b from-navy-deep/65 via-navy-deep/35 to-navy-deep/75" />
            </div>

            <div className="mt-24 px-6 sm:px-10">
                <TextReveal
                    as="h1"
                    mode="words"
                    segments={HERO_CONTENT.titleWords}
                    play={ready}
                    stagger={140}
                    duration={1100}
                    ease={TEXT_EASE.expo}
                    className="whitespace-nowrap text-[12.5vw] font-medium uppercase leading-[0.85] tracking-tight"
                />
            </div>

            <div className="mt-auto flex flex-col gap-6 px-6 pb-6 sm:flex-row sm:items-end sm:justify-between sm:px-10 sm:pb-8">
                <TextReveal
                    as="p"
                    mode="lines"
                    segments={HERO_CONTENT.taglineLines}
                    play={ready}
                    baseDelay={350}
                    stagger={110}
                    duration={900}
                    ease={TEXT_EASE.expo}
                    className="text-[2.4rem] font-medium uppercase leading-[0.95] tracking-tight text-white/85"
                />

                <div className="flex items-end gap-4">
                    {slides.length > 0 && (
                        <div className="hidden w-64 flex-col gap-3 md:flex">
                            <FeaturedSlide slide={currentSlide} ready={ready} />
                            <CarouselDots count={slides.length} activeIndex={activeSlide} onSelect={setActiveSlide} tone="light" />
                        </div>
                    )}

                    <Reveal delayIn={780} preset="reveal">
                        <article className="flex w-full max-w-[20rem] items-stretch gap-3 rounded-card border border-white/15 bg-white/10 p-3 shadow-lg backdrop-blur sm:max-w-[15rem]">
                            <div className="flex flex-1 flex-col justify-between">
                                <p className="text-3xl font-medium leading-none">{HERO_STAT.value}</p>
                                <div className="flex -space-x-2">
                                    {HERO_STAT.dotColors.map((color, i) => (
                                        <span
                                            key={`${color}-${i}`}
                                            className="h-5 w-5 rounded-pill border border-navy-deep/40"
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                                <p className="text-[0.65rem] text-white/80">{HERO_STAT.caption}</p>
                            </div>
                            <img
                                src={IMAGES.heroStatCard}
                                alt="Close-up of a car parked in a parking lot"
                                loading="lazy"
                                className="aspect-[3/4] w-16 rounded-xl object-cover"
                            />
                        </article>
                    </Reveal>
                </div>
            </div>

            <form onSubmit={onSearch} className="mx-6 mb-6 flex flex-col gap-4 rounded-card bg-white/95 p-6 text-ink shadow-xl sm:mx-10 sm:mb-8 sm:max-w-md">
                <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium uppercase tracking-widest text-ink-soft">Destination</span>
                    <input
                        value={searchTerm}
                        onChange={(event) => onSearchTermChange(event.target.value)}
                        placeholder="City or area name"
                        className="rounded-2xl border border-hairline bg-surface px-5 py-4 text-sm font-medium outline-none focus:border-navy-light"
                    />
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1">
                        <span className="text-[11px] font-medium uppercase tracking-widest text-ink-soft">Arrival time</span>
                        <input type="time" className="rounded-2xl border border-hairline bg-surface px-4 py-3 text-sm font-medium outline-none focus:border-navy-light" />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[11px] font-medium uppercase tracking-widest text-ink-soft">Duration</span>
                        <select className="rounded-2xl border border-hairline bg-surface px-4 py-3 text-sm font-medium outline-none focus:border-navy-light">
                            <option>Select duration</option>
                            <option>1 Hour</option>
                            <option>4 Hours</option>
                            <option>Full Day</option>
                        </select>
                    </label>
                </div>
                <button
                    type="submit"
                    className="inline-flex items-center gap-3 self-start rounded-pill bg-navy pl-2 pr-6 py-2 text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
                >
                    <span className="grid h-8 w-8 place-items-center rounded-pill bg-navy-deep">
                        <Navigation className="h-3 w-3 rotate-45" aria-hidden="true" />
                    </span>
                    <span className="text-[11px] font-medium uppercase tracking-widest">Search</span>
                </button>
            </form>
        </section>
    );
};

export default Hero;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- Hero.test`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/home/Hero.jsx src/components/home/Hero.test.jsx
git commit -m "feat: add Hero section with parallax, live featured slider, and search form"
```

---

### Task 14: `TrustCarousel` home section

**Files:**
- Create: `frontend/src/components/home/TrustCarousel.jsx`
- Test: `frontend/src/components/home/TrustCarousel.test.jsx`

**Interfaces:**
- Consumes: `Reveal` (Task 5), `TextReveal`/`TEXT_EASE` (Task 5), `ArrowButton`/`CarouselDots` (Task 4), `TRUST_SLIDES`/`TRUST_BADGE` (Task 3), `IMAGES` (Task 3).
- Produces: `TrustCarousel()` — no props.

- [ ] **Step 1: Write the failing test**

Create `src/components/home/TrustCarousel.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TrustCarousel from './TrustCarousel';

describe('TrustCarousel', () => {
    it('shows the first slide by default', () => {
        render(<TrustCarousel />);
        expect(screen.getByText('Downtown Garage')).toBeInTheDocument();
        expect(screen.getByText('Secure')).toBeInTheDocument();
    });

    it('advances to the next slide when the next arrow is clicked', async () => {
        render(<TrustCarousel />);
        await userEvent.click(screen.getByRole('button', { name: /next/i }));
        expect(screen.getByText('EV Charging Hub')).toBeInTheDocument();
    });

    it('wraps to the last slide when previous is clicked from the first slide', async () => {
        render(<TrustCarousel />);
        await userEvent.click(screen.getByRole('button', { name: /previous/i }));
        expect(screen.getByText('Rooftop Collective')).toBeInTheDocument();
    });

    it('jumps to a slide when its dot is clicked', async () => {
        render(<TrustCarousel />);
        const dots = screen.getAllByRole('button', { name: /go to slide/i });
        await userEvent.click(dots[2]);
        expect(screen.getByText('Rooftop Collective')).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- TrustCarousel`
Expected: FAIL — cannot find module `./TrustCarousel`.

- [ ] **Step 3: Implement `TrustCarousel.jsx`**

Create `src/components/home/TrustCarousel.jsx`:

```jsx
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Reveal from '../ui/Reveal';
import TextReveal, { TEXT_EASE } from '../ui/TextReveal';
import ArrowButton from '../ui/ArrowButton';
import CarouselDots from '../ui/CarouselDots';
import { TRUST_SLIDES, TRUST_BADGE } from '../../data/homeContent';
import { IMAGES } from '../../data/images';

const TrustCarousel = () => {
    const [active, setActive] = useState(0);
    const slide = TRUST_SLIDES[active];
    const [w1, w2, w3, w4] = slide.headline;

    const goTo = (index) => setActive(((index % TRUST_SLIDES.length) + TRUST_SLIDES.length) % TRUST_SLIDES.length);

    return (
        <section className="relative isolate overflow-hidden bg-background px-6 py-16 sm:px-10 sm:py-20">
            <div className="relative z-20 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <Reveal preset="reveal" className="grid h-28 w-28 shrink-0 place-items-center rounded-pill bg-surface text-center sm:h-32 sm:w-32">
                    <div>
                        <p className="text-2xl font-medium">{TRUST_BADGE.percent}</p>
                        <p className="mx-auto mt-1 max-w-[7em] text-[0.6rem] text-ink-soft">{TRUST_BADGE.percentCaption}</p>
                    </div>
                </Reveal>
                <Reveal delayIn={120} preset="reveal" className="max-w-md rounded-card bg-surface p-5 sm:p-6">
                    <article className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                        <span className="inline-flex rounded-xl bg-background px-4 py-2 text-xl font-medium">{TRUST_BADGE.index}</span>
                        <div>
                            <h3 className="text-lg font-medium">{TRUST_BADGE.title}</h3>
                            <p className="mt-2 text-xs leading-relaxed text-ink-soft">{TRUST_BADGE.body}</p>
                        </div>
                    </article>
                </Reveal>
            </div>

            <h2 className="pointer-events-none relative z-0 mx-auto mt-12 max-w-[88rem] select-none text-center text-[8.2vw] font-medium uppercase leading-[1.02] tracking-tight">
                <span className="flex justify-between">
                    <TextReveal as="span" segments={[w1]} duration={700} ease={TEXT_EASE.expo} className="text-ghost" />
                    <TextReveal as="span" segments={[w2]} duration={700} ease={TEXT_EASE.expo} className="text-ghost" />
                </span>
                <span className="flex justify-between">
                    <TextReveal as="span" segments={[w3]} duration={700} ease={TEXT_EASE.expo} className="text-ink" />
                    <TextReveal as="span" segments={[w4]} duration={700} ease={TEXT_EASE.expo} className="text-ghost" />
                </span>
            </h2>

            <Reveal
                from={{ opacity: 0, y: 60, scale: 0.92 }}
                to={{ opacity: 1, y: 0, scale: 1 }}
                preset="reveal"
                className="relative z-10 mx-auto -mt-8 w-52 rotate-6 sm:-mt-16 sm:w-64"
            >
                <figure className="relative aspect-[3/4] overflow-hidden rounded-card bg-navy">
                    <AnimatePresence mode="wait">
                        <motion.img
                            key={slide.imageKey}
                            src={IMAGES[slide.imageKey]}
                            alt={slide.alt}
                            loading="lazy"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                            className="h-full w-full object-cover"
                        />
                    </AnimatePresence>
                    <figcaption className="absolute inset-x-3 bottom-3 rounded-xl bg-navy-deep/40 px-3 py-2 text-white backdrop-blur">
                        <p className="text-sm font-medium">{slide.name}</p>
                        <p className="text-[0.65rem] text-white/80">{slide.role}</p>
                    </figcaption>
                </figure>
            </Reveal>

            <div className="relative z-20 mt-12 flex items-center justify-between sm:mt-24">
                <ArrowButton direction="prev" variant="outline" onClick={() => goTo(active - 1)} />
                <CarouselDots count={TRUST_SLIDES.length} activeIndex={active} onSelect={goTo} tone="dark" />
                <ArrowButton direction="next" variant="solid" onClick={() => goTo(active + 1)} />
            </div>
        </section>
    );
};

export default TrustCarousel;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- TrustCarousel`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/home/TrustCarousel.jsx src/components/home/TrustCarousel.test.jsx
git commit -m "feat: add TrustCarousel section with ghost-word reveal and location cross-fade"
```

---

### Task 15: `Services` home section

**Files:**
- Create: `frontend/src/components/home/Services.jsx`
- Test: `frontend/src/components/home/Services.test.jsx`

**Interfaces:**
- Consumes: `Eyebrow` (Task 4), `TextReveal`/`TEXT_EASE`/`Reveal` (Task 5), `SERVICES` (Task 3).
- Produces: `Services()` — no props.

- [ ] **Step 1: Write the failing test**

Create `src/components/home/Services.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Services from './Services';

describe('Services', () => {
    it('renders all four service rows with index, name, description, and link', () => {
        render(<Services />);
        expect(screen.getByText('01')).toBeInTheDocument();
        expect(screen.getByText('Hourly Parking')).toBeInTheDocument();
        expect(screen.getByText('Drop in and pay only for the time you use.')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /valet & event parking/i })).toHaveAttribute('href', '#valet');
    });

    it('has the services section anchor id', () => {
        const { container } = render(<Services />);
        expect(container.querySelector('#services')).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- Services.test`
Expected: FAIL — cannot find module `./Services`.

- [ ] **Step 3: Implement `Services.jsx`**

Create `src/components/home/Services.jsx`:

```jsx
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Eyebrow from '../ui/Eyebrow';
import TextReveal, { TEXT_EASE } from '../ui/TextReveal';
import Reveal from '../ui/Reveal';
import { SERVICES } from '../../data/homeContent';

const Services = () => (
    <section id="services" className="bg-surface px-6 py-24 sm:px-10">
        <Eyebrow>Parking services</Eyebrow>
        <TextReveal
            as="h2"
            mode="lines"
            segments={['Built for', 'every trip']}
            duration={950}
            ease={TEXT_EASE.expo}
            className="mt-4 text-5xl font-medium leading-[0.95] tracking-tight"
        />

        <ul className="mt-14">
            {SERVICES.map((service, i) => (
                <Reveal
                    key={service.index}
                    as="li"
                    delayIn={i * 90}
                    preset="reveal"
                    className={`border-t border-hairline ${i === SERVICES.length - 1 ? 'border-b' : ''}`}
                >
                    <motion.a
                        href={service.href}
                        initial="rest"
                        whileHover="hover"
                        animate="rest"
                        className="flex items-center gap-6 py-7 focus-visible:bg-background"
                    >
                        <span className="w-10 text-sm font-medium text-ink-soft">{service.index}</span>
                        <div className="flex-1">
                            <p className="text-2xl font-medium tracking-tight sm:text-3xl">{service.name}</p>
                            <p className="mt-1 text-sm text-ink-soft">{service.description}</p>
                        </div>
                        <motion.span
                            variants={{ rest: { x: 0, opacity: 0.55 }, hover: { x: 8, opacity: 1 } }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-pill border border-hairline"
                        >
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </motion.span>
                    </motion.a>
                </Reveal>
            ))}
        </ul>
    </section>
);

export default Services;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- Services.test`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/home/Services.jsx src/components/home/Services.test.jsx
git commit -m "feat: add Services section (parking programs list)"
```

---

### Task 16: `Listings` home section (live business grid)

**Files:**
- Create: `frontend/src/components/home/Listings.jsx`
- Test: `frontend/src/components/home/Listings.test.jsx`

**Interfaces:**
- Consumes: `Eyebrow` (Task 4), `TextReveal`/`TEXT_EASE`/`Reveal` (Task 5).
- Produces: `Listings({ businesses: Array<{id, name, address, pricePerHour, imageUrl}>, loading: boolean })`. This replaces the grid that used to live directly in `pages/Home/Home.jsx`.

- [ ] **Step 1: Write the failing test**

Create `src/components/home/Listings.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Listings from './Listings';

const renderListings = (props) =>
    render(
        <MemoryRouter>
            <Listings {...props} />
        </MemoryRouter>
    );

describe('Listings', () => {
    it('shows skeleton placeholders while loading', () => {
        const { container } = renderListings({ businesses: [], loading: true });
        expect(container.querySelectorAll('.animate-pulse')).toHaveLength(3);
    });

    it('shows an empty-state message when there are no results and not loading', () => {
        renderListings({ businesses: [], loading: false });
        expect(screen.getByText(/no locations match your search/i)).toBeInTheDocument();
    });

    it('renders a card per business with a working Book Now link', () => {
        const businesses = [
            { id: '1', name: 'Downtown Garage', address: '1 Main St', pricePerHour: 4, imageUrl: null },
            { id: '2', name: 'Harbor Lot', address: '2 Bay St', pricePerHour: 6, imageUrl: 'https://example.com/x.jpg' },
        ];
        renderListings({ businesses, loading: false });

        expect(screen.getByText('Downtown Garage')).toBeInTheDocument();
        expect(screen.getByText('Harbor Lot')).toBeInTheDocument();
        expect(screen.getByText('$4')).toBeInTheDocument();

        const links = screen.getAllByRole('link', { name: /book now/i });
        expect(links[0]).toHaveAttribute('href', '/business/1');
        expect(links[1]).toHaveAttribute('href', '/business/2');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- Listings.test`
Expected: FAIL — cannot find module `./Listings`.

- [ ] **Step 3: Implement `Listings.jsx`**

Create `src/components/home/Listings.jsx`:

```jsx
import { ArrowRight, MapPin, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import Eyebrow from '../ui/Eyebrow';
import TextReveal, { TEXT_EASE } from '../ui/TextReveal';
import Reveal from '../ui/Reveal';

const Listings = ({ businesses, loading }) => (
    <section id="listings" className="bg-background px-6 py-24 sm:px-10">
        <Eyebrow>Verified network</Eyebrow>
        <TextReveal
            as="h2"
            mode="lines"
            segments={['Available', 'locations']}
            duration={950}
            ease={TEXT_EASE.expo}
            className="mt-4 text-5xl font-medium leading-[0.95] tracking-tight"
        />

        {loading ? (
            <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-80 animate-pulse rounded-card-lg bg-surface" />
                ))}
            </div>
        ) : businesses.length === 0 ? (
            <p className="mt-14 text-sm text-ink-soft">No locations match your search yet — try another destination.</p>
        ) : (
            <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {businesses.map((biz, i) => (
                    <Reveal key={biz.id} as="article" delayIn={i * 80} preset="reveal" className="rounded-card-lg border border-hairline bg-surface-card p-4 shadow-lg">
                        <div className="relative h-56 w-full overflow-hidden rounded-card bg-surface">
                            {biz.imageUrl ? (
                                <img src={biz.imageUrl} alt={biz.name} loading="lazy" className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full bg-gradient-to-br from-navy-light to-navy-deep" />
                            )}
                            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-5">
                                <span className="inline-flex items-center gap-2 text-white">
                                    <Star className="h-4 w-4 fill-current" aria-hidden="true" />
                                    <span className="text-xs font-medium uppercase tracking-widest">4.9 Rating</span>
                                </span>
                            </div>
                        </div>
                        <div className="px-2 pb-2 pt-5">
                            <h3 className="text-2xl font-medium tracking-tight">{biz.name}</h3>
                            <p className="mt-2 flex items-center gap-2 text-xs text-ink-soft">
                                <MapPin className="h-3.5 w-3.5 text-navy" aria-hidden="true" />
                                {biz.address}
                            </p>
                            <div className="mt-5 flex items-center justify-between border-t border-hairline pt-4">
                                <div>
                                    <p className="text-[10px] font-medium uppercase tracking-widest text-ink-soft">Fee</p>
                                    <p className="text-2xl font-medium">
                                        ${biz.pricePerHour}
                                        <span className="ml-1 text-xs uppercase text-ink-soft">/hr</span>
                                    </p>
                                </div>
                                <Link
                                    to={`/business/${biz.id}`}
                                    className="inline-flex items-center gap-2 rounded-pill bg-ink px-5 py-3 text-xs font-medium uppercase tracking-widest text-white transition-colors hover:bg-navy-deep"
                                >
                                    Book Now
                                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                                </Link>
                            </div>
                        </div>
                    </Reveal>
                ))}
            </div>
        )}
    </section>
);

export default Listings;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- Listings.test`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/home/Listings.jsx src/components/home/Listings.test.jsx
git commit -m "feat: add Listings section for the live business search results"
```

---

### Task 17: `Facilities` home section

**Files:**
- Create: `frontend/src/components/home/Facilities.jsx`
- Test: `frontend/src/components/home/Facilities.test.jsx`

**Interfaces:**
- Consumes: `Reveal` (Task 5), `TextReveal`/`TEXT_EASE` (Task 5), `FACILITIES` (Task 3), `IMAGES` (Task 3).
- Produces: `Facilities()` — no props.

- [ ] **Step 1: Write the failing test**

Create `src/components/home/Facilities.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Facilities from './Facilities';

describe('Facilities', () => {
    it('renders the intro heading lines', () => {
        render(<Facilities />);
        expect(screen.getByText('Tour Our')).toBeInTheDocument();
        expect(screen.getByText('Parking')).toBeInTheDocument();
        expect(screen.getByText('Facilities')).toBeInTheDocument();
    });

    it('renders both facility cards with name and description', () => {
        render(<Facilities />);
        expect(screen.getByText('Skyline Rooftop Lot')).toBeInTheDocument();
        expect(screen.getByText('An open-air rooftop lot with skyline views and easy access.')).toBeInTheDocument();
        expect(screen.getByText('Harbor Parking Garage')).toBeInTheDocument();
        expect(screen.getByText('A secure, climate-covered garage built for all-day parking.')).toBeInTheDocument();
    });

    it('gives each facility image its descriptive alt text', () => {
        render(<Facilities />);
        expect(screen.getByAltText('Two sports cars parked on a rooftop parking garage')).toBeInTheDocument();
        expect(screen.getByAltText('Modern multi-story parking garage interior with ventilation systems')).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- Facilities.test`
Expected: FAIL — cannot find module `./Facilities`.

- [ ] **Step 3: Implement `Facilities.jsx`**

Create `src/components/home/Facilities.jsx`:

```jsx
import { motion } from 'framer-motion';
import Reveal from '../ui/Reveal';
import TextReveal, { TEXT_EASE } from '../ui/TextReveal';
import { FACILITIES } from '../../data/homeContent';
import { IMAGES } from '../../data/images';

const TONE_CAPTION_CLASSES = {
    clay: 'bg-navy-deep/40',
    blue: 'bg-harbor/55',
};

const Facilities = () => (
    <section id="facilities" className="-mt-10 rounded-card-lg bg-background px-6 pb-20 pt-16 sm:px-10">
        <div className="grid items-end gap-10 md:grid-cols-2">
            <div className="max-w-sm">
                <Reveal from={{ opacity: 0, scale: 0.85 }} to={{ opacity: 1, scale: 1 }} preset="reveal">
                    <img
                        src={IMAGES.facilityGarage}
                        alt="Modern multi-story parking garage interior with ventilation systems"
                        loading="lazy"
                        className="h-16 w-16 rounded-card object-cover"
                    />
                </Reveal>
                <TextReveal
                    as="h2"
                    mode="lines"
                    segments={['Tour Our', 'Parking', 'Facilities']}
                    stagger={120}
                    duration={950}
                    ease={TEXT_EASE.expo}
                    className="mt-6 text-5xl font-medium leading-[0.95] tracking-tight"
                />
                <TextReveal
                    as="p"
                    mode="words"
                    clip={false}
                    distance="18px"
                    segments={
                        'Reserve a spot for quick errands, daily commutes, or long-term storage — and park in facilities built for security and convenience.'.split(
                            ' '
                        )
                    }
                    stagger={28}
                    baseDelay={250}
                    duration={700}
                    ease={TEXT_EASE.quart}
                    className="mt-6 max-w-xs text-sm text-ink-soft"
                />
            </div>

            <div className="flex items-end gap-5">
                {FACILITIES.map((facility, i) => (
                    <Reveal
                        key={facility.name}
                        from={{ opacity: 0, y: 48 }}
                        to={{ opacity: 1, y: 0 }}
                        delayIn={i * 140}
                        preset="reveal"
                        className={`flex-1 ${i === 1 ? 'mb-8' : ''}`}
                    >
                        <motion.figure initial="rest" whileHover="hover" animate="rest" className="relative aspect-[3/4] overflow-hidden rounded-card bg-surface">
                            <motion.img
                                src={IMAGES[facility.imageKey]}
                                alt={facility.alt}
                                loading="lazy"
                                variants={{ rest: { scale: 1 }, hover: { scale: 1.03 } }}
                                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                                className="h-full w-full object-cover"
                            />
                            <figcaption className={`absolute inset-x-3 bottom-3 rounded-xl px-4 py-3 text-white backdrop-blur ${TONE_CAPTION_CLASSES[facility.tone]}`}>
                                <p className="text-sm font-medium">{facility.name}</p>
                                <p className="mt-1 text-[0.65rem] text-white/85">{facility.description}</p>
                            </figcaption>
                        </motion.figure>
                    </Reveal>
                ))}
            </div>
        </div>
    </section>
);

export default Facilities;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- Facilities.test`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/home/Facilities.jsx src/components/home/Facilities.test.jsx
git commit -m "feat: add Facilities section with rooftop and garage tiles"
```

---

### Task 18: `Stats` home section

**Files:**
- Create: `frontend/src/components/home/Stats.jsx`
- Test: `frontend/src/components/home/Stats.test.jsx`

**Interfaces:**
- Consumes: `Eyebrow` (Task 4), `TextReveal`/`TEXT_EASE`/`Reveal` (Task 5), `STATS` (Task 3).
- Produces: `Stats()` — no props.

- [ ] **Step 1: Write the failing test**

Create `src/components/home/Stats.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Stats from './Stats';

describe('Stats', () => {
    it('renders all four stat values and labels', () => {
        render(<Stats />);
        expect(screen.getByText('40+')).toBeInTheDocument();
        expect(screen.getByText('Cities covered')).toBeInTheDocument();
        expect(screen.getByText('1,200+')).toBeInTheDocument();
        expect(screen.getByText('2.4M+')).toBeInTheDocument();
        expect(screen.getByText('8')).toBeInTheDocument();
        expect(screen.getByText('Years on the road')).toBeInTheDocument();
    });

    it('marks each stat label as visually hidden in its dt', () => {
        const { container } = render(<Stats />);
        const dts = container.querySelectorAll('dt');
        expect(dts).toHaveLength(4);
        dts.forEach((dt) => expect(dt).toHaveClass('sr-only'));
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- Stats.test`
Expected: FAIL — cannot find module `./Stats`.

- [ ] **Step 3: Implement `Stats.jsx`**

Create `src/components/home/Stats.jsx`:

```jsx
import Eyebrow from '../ui/Eyebrow';
import TextReveal, { TEXT_EASE } from '../ui/TextReveal';
import Reveal from '../ui/Reveal';
import { STATS } from '../../data/homeContent';

const Stats = () => (
    <section className="mt-3 rounded-card-lg bg-navy-deep px-6 py-20 text-white sm:px-10">
        <Eyebrow tone="light">By the numbers</Eyebrow>
        <TextReveal
            as="h2"
            mode="lines"
            segments={['A network that', 'keeps you moving']}
            duration={950}
            ease={TEXT_EASE.expo}
            className="mt-4 text-5xl font-medium leading-[0.95] tracking-tight"
        />

        <dl className="mt-16 grid grid-cols-2 gap-x-8 gap-y-12 lg:grid-cols-4">
            {STATS.map((stat, i) => (
                <Reveal
                    key={stat.label}
                    as="div"
                    from={{ opacity: 0, y: 30 }}
                    to={{ opacity: 1, y: 0 }}
                    delayIn={i * 110}
                    preset="reveal"
                    className="border-t border-white/20 pt-5"
                >
                    <dt className="sr-only">{stat.label}</dt>
                    <dd>
                        <p className="text-6xl font-medium tracking-tight sm:text-7xl">{stat.value}</p>
                        <p className="mt-3 text-sm text-white/65">{stat.label}</p>
                    </dd>
                </Reveal>
            ))}
        </dl>
    </section>
);

export default Stats;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- Stats.test`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/home/Stats.jsx src/components/home/Stats.test.jsx
git commit -m "feat: add Stats band section"
```

---

### Task 19: `Testimonials` home section

**Files:**
- Create: `frontend/src/components/home/Testimonials.jsx`
- Test: `frontend/src/components/home/Testimonials.test.jsx`

**Interfaces:**
- Consumes: `Eyebrow` (Task 4), `TextReveal`/`TEXT_EASE`/`Reveal` (Task 5), `TESTIMONIALS` (Task 3).
- Produces: `Testimonials()` — no props.

- [ ] **Step 1: Write the failing test**

Create `src/components/home/Testimonials.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Testimonials from './Testimonials';

describe('Testimonials', () => {
    it('renders all three testimonial quotes, names, and roles', () => {
        render(<Testimonials />);
        expect(screen.getByText(/booked in seconds/i)).toBeInTheDocument();
        expect(screen.getByText('Maya Chen')).toBeInTheDocument();
        expect(screen.getByText('Daily Commuter')).toBeInTheDocument();

        expect(screen.getByText(/never circle the block/i)).toBeInTheDocument();
        expect(screen.getByText('Tomás Ibarra')).toBeInTheDocument();

        expect(screen.getByText(/filled it every weekday/i)).toBeInTheDocument();
        expect(screen.getByText('Renee Walsh')).toBeInTheDocument();
    });

    it('has the testimonials section anchor id', () => {
        const { container } = render(<Testimonials />);
        expect(container.querySelector('#testimonials')).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- Testimonials.test`
Expected: FAIL — cannot find module `./Testimonials`.

- [ ] **Step 3: Implement `Testimonials.jsx`**

Create `src/components/home/Testimonials.jsx`:

```jsx
import Eyebrow from '../ui/Eyebrow';
import TextReveal, { TEXT_EASE } from '../ui/TextReveal';
import Reveal from '../ui/Reveal';
import { TESTIMONIALS } from '../../data/homeContent';

const Testimonials = () => (
    <section id="testimonials" className="bg-background px-6 py-20 sm:px-10 sm:py-24">
        <Eyebrow>What drivers say</Eyebrow>
        <TextReveal
            as="h2"
            mode="lines"
            segments={['Loved by', 'drivers everywhere']}
            duration={950}
            ease={TEXT_EASE.expo}
            className="mt-4 text-5xl font-medium leading-[0.95] tracking-tight"
        />

        <ul className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((testimonial, i) => (
                <Reveal
                    key={testimonial.name}
                    as="li"
                    from={{ opacity: 0, y: 40 }}
                    to={{ opacity: 1, y: 0 }}
                    delayIn={i * 120}
                    preset="reveal"
                    className="flex h-full flex-col justify-between rounded-card bg-surface p-7"
                >
                    <div>
                        <p className="text-4xl leading-none text-navy" aria-hidden="true">&ldquo;</p>
                        <blockquote className="mt-4 text-lg leading-relaxed text-ink">{testimonial.quote}</blockquote>
                    </div>
                    <figcaption className="mt-6 border-t border-hairline pt-4">
                        <p className="font-medium">{testimonial.name}</p>
                        <p className="text-sm text-ink-soft">{testimonial.role}</p>
                    </figcaption>
                </Reveal>
            ))}
        </ul>
    </section>
);

export default Testimonials;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- Testimonials.test`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/home/Testimonials.jsx src/components/home/Testimonials.test.jsx
git commit -m "feat: add Testimonials section"
```

---

### Task 20: Wire `Home.jsx` and `App.jsx`, remove `Navbar`

**Files:**
- Modify: `frontend/src/pages/Home/Home.jsx` (full rewrite)
- Modify: `frontend/src/App.jsx` (full rewrite)
- Delete: `frontend/src/components/Navbar.jsx`
- Test: `frontend/src/pages/Home/Home.test.jsx`
- Test: `frontend/src/App.test.jsx`

**Interfaces:**
- Consumes: every component/hook/context from Tasks 3–19, plus the existing `api/api.js` default export and `context/AuthContext.jsx` / `context/ThemeContext.jsx` / `context/SocketContext.jsx` (all untouched).
- Produces: the fully wired app. No other file depends on this task's exports — it's the integration point.

- [ ] **Step 1: Write the failing `Home.jsx` test**

Create `src/pages/Home/Home.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';

const mockSiteUI = { isReady: true };
vi.mock('../../context/SiteUIContext', () => ({ useSiteUI: () => mockSiteUI }));

vi.mock('../../api/api', () => ({
    default: {
        get: vi.fn((url) => {
            if (url.includes('search=Harbor')) {
                return Promise.resolve({ data: { data: [{ id: '2', name: 'Harbor Lot', address: '2 Bay St', pricePerHour: 6, imageUrl: null }] } });
            }
            return Promise.resolve({
                data: {
                    data: [
                        { id: '1', name: 'Downtown Garage', address: '1 Main St', pricePerHour: 4, imageUrl: null },
                        { id: '2', name: 'Harbor Lot', address: '2 Bay St', pricePerHour: 6, imageUrl: null },
                    ],
                },
            });
        }),
        post: vi.fn(),
    },
}));

describe('Home', () => {
    it('loads businesses on mount and renders them in the listings section', async () => {
        render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>
        );

        await waitFor(() => expect(screen.getByText('Downtown Garage')).toBeInTheDocument());
        expect(screen.getByText('Harbor Lot')).toBeInTheDocument();
    });

    it('re-fetches businesses filtered by the destination search term', async () => {
        const api = (await import('../../api/api')).default;
        render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>
        );
        await waitFor(() => expect(screen.getByText('Downtown Garage')).toBeInTheDocument());

        await userEvent.type(screen.getByPlaceholderText('City or area name'), 'Harbor');
        await userEvent.click(screen.getByRole('button', { name: /^search$/i }));

        await waitFor(() => expect(api.get).toHaveBeenCalledWith(expect.stringContaining('search=Harbor')));
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- pages/Home/Home.test`
Expected: FAIL — `Home.jsx` still renders the old inline hero/grid markup, none of the mocked business names appear via the new section components.

- [ ] **Step 3: Rewrite `pages/Home/Home.jsx`**

Replace the full contents of `src/pages/Home/Home.jsx`:

```jsx
import { useEffect, useState } from 'react';
import api from '../../api/api';
import Hero from '../../components/home/Hero';
import TrustCarousel from '../../components/home/TrustCarousel';
import Services from '../../components/home/Services';
import Listings from '../../components/home/Listings';
import Facilities from '../../components/home/Facilities';
import Stats from '../../components/home/Stats';
import Testimonials from '../../components/home/Testimonials';
import { useSiteUI } from '../../context/SiteUIContext';

const Home = () => {
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { isReady } = useSiteUI();

    const fetchBusinesses = async (search = '') => {
        setLoading(true);
        try {
            const endpoint = search ? `/business?search=${encodeURIComponent(search)}` : '/business';
            const { data } = await api.get(endpoint);
            setBusinesses(data.data);
        } catch (error) {
            console.error('Error fetching businesses', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBusinesses();
    }, []);

    const handleSearch = (event) => {
        if (event) event.preventDefault();
        fetchBusinesses(searchTerm);
        document.getElementById('listings')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="flex flex-col gap-3 pb-3">
            <Hero businesses={businesses} searchTerm={searchTerm} onSearchTermChange={setSearchTerm} onSearch={handleSearch} ready={isReady} />
            <TrustCarousel />
            <Services />
            <Listings businesses={businesses} loading={loading} />
            <Facilities />
            <Stats />
            <Testimonials />
        </div>
    );
};

export default Home;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- pages/Home/Home.test`
Expected: PASS (2 tests).

- [ ] **Step 5: Write the failing `App.jsx` test**

Create `src/App.test.jsx`:

```jsx
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

    it('does not render the old Navbar module', async () => {
        await expect(import('./components/Navbar')).rejects.toThrow();
    });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test -- App.test`
Expected: FAIL — `App.jsx` still renders the old `Navbar` and has no `Footer`; the second test's dynamic `import('./components/Navbar')` currently resolves successfully (the module still exists on disk), so the `rejects.toThrow()` assertion fails.

- [ ] **Step 7: Rewrite `App.jsx`**

Replace the full contents of `src/App.jsx`:

```jsx
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import { SiteUIProvider, useSiteUI } from './context/SiteUIContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import MobileMenu from './components/layout/MobileMenu';
import IntroLoader from './components/overlays/IntroLoader';
import ContactModal from './components/overlays/ContactModal';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Profile from './pages/Profile/Profile';
import BusinessDetails from './pages/Home/BusinessDetails';
import BookingSuccess from './pages/BookingSuccess/BookingSuccess';
import AdminDashboard from './pages/Admin/AdminDashboard';
import BusinessDashboard from './pages/Dashboard/BusinessDashboard';
import About from './pages/About/About';
import CheckoutSummary from './pages/CheckoutSummary';

const ProtectedRoute = ({ children, roles }) => {
    const { user, loading } = useAuth();

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-navy"></div>
        </div>
    );

    if (!user) return <Navigate to="/login" />;

    if (roles && !roles.includes(user.role)) {
        return <Navigate to="/" />;
    }

    return children;
};

const AppContent = () => {
    const { markReady } = useSiteUI();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <main className="w-full overflow-x-clip bg-white p-2 sm:p-3">
            <IntroLoader onReady={markReady} />
            <Header />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/business/:id" element={<BusinessDetails />} />
                <Route path="/booking-success" element={<BookingSuccess />} />
                <Route path="/about" element={<About />} />

                {/* Customer Routes */}
                <Route path="/profile" element={
                    <ProtectedRoute roles={['customer']}>
                        <Profile />
                    </ProtectedRoute>
                } />
                <Route path="/checkout-summary" element={
                    <ProtectedRoute roles={['customer']}>
                        <CheckoutSummary />
                    </ProtectedRoute>
                } />

                {/* Business Owner Routes */}
                <Route path="/dashboard" element={
                    <ProtectedRoute roles={['business']}>
                        <BusinessDashboard />
                    </ProtectedRoute>
                } />

                {/* Admin Routes */}
                <Route path="/admin" element={
                    <ProtectedRoute roles={['admin']}>
                        <AdminDashboard />
                    </ProtectedRoute>
                } />
            </Routes>
            <Footer />
            <MobileMenu />
            <ContactModal />
        </main>
    );
};

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <SocketProvider>
                    <SiteUIProvider>
                        <Router>
                            <AppContent />
                        </Router>
                    </SiteUIProvider>
                </SocketProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
```

- [ ] **Step 8: Delete the old Navbar**

Run: `git rm src/components/Navbar.jsx`

- [ ] **Step 9: Run test to verify it passes**

Run: `npm test -- App.test`
Expected: PASS (2 tests — the dynamic `import('./components/Navbar')` now rejects with "Cannot find module" / "Failed to resolve import", which is what the test expects).

- [ ] **Step 10: Run the full test suite**

Run: `npm test`
Expected: every test file from Tasks 1–20 passes.

- [ ] **Step 11: Run lint**

Run: `npm run lint`
Expected: no errors. Fix any `no-unused-vars` findings (e.g. remove now-unused imports) before proceeding.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: wire Header/Footer/overlays into App, compose Home from new sections, remove Navbar"
```

- [ ] **Step 13: Manual verification in the dev server**

Run: `npm run dev`, open the printed local URL, and walk the golden path from the design spec (§10):

1. On first load, the navy intro loader plays once, then the hero title/tagline/slider/stat-card animate in.
2. Scroll through Trust → Services → Listings → Facilities → Stats → Testimonials → Footer; confirm the live listings grid matches what the backend returns.
3. Type a destination in the hero search and submit; confirm the page scrolls to Listings and the results update.
4. Open and close the burger menu (fullscreen overlay) and the "List Your Lot" contact modal (submit the stub form and confirm no network tab activity for it).
5. Toggle dark mode from the header; confirm it still works.
6. Reload the page within the same tab/session; confirm the intro loader does **not** replay.
7. Resize to a mobile width (<768px) and confirm hover-only affordances are simply inert (no layout breakage) and the mobile menu still opens/closes.
8. Visit `/login`, `/about`, `/register` and confirm they render normally under the new Header/Footer with no console errors.

Note any visual or functional issues found and fix them before considering this task done.

---

## Self-review notes

- **Spec coverage:** every section in the design doc's §7 content-mapping table has a task (Hero → Task 13, Trust → 14, Services → 15, Listings → 16, Facilities → 17, Stats → 18, Testimonials → 19, Footer → 12, Contact modal → 9, Loader → 8, Menu overlay → 11, Header → 10). Tokens/fonts (§4) → Task 2. Motion presets and text-reveal easings (§5.1) → baked into Tasks 5, 8, 13, 14, 17. Lenis (§5.2) → Task 6/7. Imagery (§5.5) → Task 3, using the URLs verified live during plan-writing (2026-08-04). The §11 "open item" about the hero stat card was resolved in favor of the stated default (fixed constant, `HERO_STAT`) since there's no existing endpoint returning that count.
- **Type/interface consistency:** confirmed `Hero` accepts `{businesses, searchTerm, onSearchTermChange, onSearch, ready}` in both its own task (13) and its caller in Task 20; `Listings` accepts `{businesses, loading}` consistently between Task 16 and Task 20; `useSiteUI()`'s field names (`isMenuOpen`, `openMenu`, `closeMenu`, `isContactOpen`, `openContact`, `closeContact`, `isReady`, `markReady`, `lenis`) are used identically by Tasks 8–13, 20; `TextReveal`'s `TEXT_EASE.expo`/`TEXT_EASE.quart` names match between Task 5's export and every consumer.
- **No placeholders:** every step has literal, complete code; the previously open "which images" and "which library versions" questions were resolved with real, verified values before this document was written, not deferred into the tasks.
