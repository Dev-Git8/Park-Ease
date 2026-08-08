# Midnight Garage Visual Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the sitewide navy/ink visual language with the approved "Midnight Garage" car-themed palette (asphalt dark surfaces, ignition-orange accents, electric-cyan "pulse" live-state signal) across every page and component, plus the motion details that carry the rest of the theme (glow-pulse on real-time slot updates, tabular-nums stat ticks, directional route transitions, glowing button hovers).

**Architecture:** The entire frontend already routes every color through a small set of named Tailwind tokens (`navy`, `navy-deep`, `navy-light`, `harbor`) rather than raw hex values, so this is a token-rename-and-remap exercise, not a rewrite. The remap is **not** a blind find-replace: `navy`/`navy-light` play two different roles depending on context (a bold action/accent color in most places, but a neutral placeholder/decorative background in a few), and `navy-light` specifically needs `ignition` (not `ignition-light`) when it sits on a light/white surface versus `ignition-light` when it sits on a dark/asphalt one. Every file below was read in full before this plan was written specifically to resolve that per-instance.

**Tech Stack:** React 19, Tailwind CSS 3, framer-motion (already a dependency, used for the new route-transition wrapper).

## Global Constraints

- New/changed color tokens (`frontend/tailwind.config.js`): `ignition` (`DEFAULT #FF6A2B`, `dark #E5501A`, `light #FF8A5B`) replaces `navy`; `asphalt` (`#15171c`) replaces `navy-deep`; `pulse` (`#22D3EE`) is new; `surface.DEFAULT` becomes `#f5f4f2` (was `#f4f4f4`); `ink.DEFAULT` becomes `#0d0d0f` (was `#0a0a0a`); `ink.soft` becomes `#6b7280` (was `#717784`); `harbor` is removed entirely (its one usage becomes `pulse`). `ghost`, `hairline`, `surface.card`, `background` are unchanged.
- Remap rule used throughout: bare `navy`/`text-navy`/`border-navy` on a button, badge, icon-accent, link, or focus/selection state → `ignition`. `navy-deep` used as a hover-darken target for an already-accented or `ink`-based element → `ignition-dark`. `navy-deep` used as a standalone surface panel (hero, footer, header, modal, card, loader) → `asphalt`. `navy-light` used as a border/accent/text color **on a dark/asphalt surface** → `ignition-light`; the same role **on a light/white surface** → `ignition` (stronger contrast on white). `navy`/`navy-deep` used as a neutral decorative/placeholder background (not an accent) → `asphalt`, not `ignition`.
- Loading spinners (generic in-progress indicators) get the new `pulse` cyan, not `ignition` — "live/in-progress" is exactly what that token means per the design spec.
- Red (errors/danger/overdue) and emerald (success/settled) are untouched everywhere — this was a deliberate design decision to avoid colliding with existing semantics.
- No new npm dependencies.

---

### Task 1: Tailwind tokens, retire `harbor`, add the glow-pulse keyframe

**Files:**
- Modify: `frontend/tailwind.config.js`
- Modify: `frontend/src/test/tailwindTokens.test.js`
- Modify: `frontend/src/components/home/Facilities.jsx`

**Interfaces:**
- Produces: `ignition`, `ignition-dark`, `ignition-light`, `asphalt`, `pulse` color tokens and an `animate-glow-pulse` utility class, consumed by every subsequent task in this plan.

- [ ] **Step 1: Replace the color/animation tokens**

Replace the full contents of `frontend/tailwind.config.js` with:

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
          ignition: {
            DEFAULT: '#FF6A2B',
            dark: '#E5501A',
            light: '#FF8A5B',
          },
          asphalt: '#15171c',
          pulse: '#22D3EE',
          surface: {
            DEFAULT: '#f5f4f2',
            card: '#ffffff',
          },
          ink: {
            DEFAULT: '#0d0d0f',
            soft: '#6b7280',
          },
          ghost: '#d7dae1',
          hairline: '#e6e8ec',
          background: '#ffffff',
        },
        borderRadius: {
          '3xl': '1.5rem',
          '4xl': '2rem',
          card: '1.5rem',
          'card-lg': '2rem',
          pill: '62.5rem',
        },
        keyframes: {
          'glow-pulse': {
            '0%': { boxShadow: '0 0 0 0 rgba(34, 211, 238, 0.55)' },
            '100%': { boxShadow: '0 0 0 14px rgba(34, 211, 238, 0)' },
          },
        },
        animation: {
          'glow-pulse': 'glow-pulse 1.2s ease-out 2',
        },
      },
    },
    plugins: [],
  }
```

- [ ] **Step 2: Update the failing token test**

Replace the full contents of `frontend/src/test/tailwindTokens.test.js` with:

```js
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
```

- [ ] **Step 3: Retire `harbor` in Facilities.jsx**

In `frontend/src/components/home/Facilities.jsx`, replace:

```js
const TONE_CAPTION_CLASSES = {
    clay: 'bg-navy-deep/40',
    blue: 'bg-harbor/55',
};
```

with:

```js
const TONE_CAPTION_CLASSES = {
    clay: 'bg-asphalt/40',
    blue: 'bg-pulse/55',
};
```

- [ ] **Step 4: Run the token test**

Run: `cd frontend && npx vitest run src/test/tailwindTokens.test.js`
Expected: PASS, both tests green.

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.js src/test/tailwindTokens.test.js src/components/home/Facilities.jsx
git commit -m "feat: replace navy/harbor tokens with Midnight Garage palette (ignition/asphalt/pulse)"
```

---

### Task 2: UI atoms — Button, Badge, Input, StatCard, Eyebrow, PillButton, ArrowButton, ErrorBoundary

**Files:**
- Modify: `frontend/src/components/ui/Button.jsx`
- Modify: `frontend/src/components/ui/Badge.jsx`
- Modify: `frontend/src/components/ui/Badge.test.jsx`
- Modify: `frontend/src/components/ui/Input.jsx`
- Modify: `frontend/src/components/ui/StatCard.jsx`
- Modify: `frontend/src/components/ui/StatCard.test.jsx`
- Modify: `frontend/src/components/ui/Eyebrow.jsx`
- Modify: `frontend/src/components/ui/PillButton.jsx`
- Modify: `frontend/src/components/ui/ArrowButton.jsx`
- Modify: `frontend/src/components/ErrorBoundary.jsx`
- Modify: `frontend/src/components/ui/Button.test.jsx`

**Interfaces:**
- Produces: `Badge`'s `navy` variant is renamed to `ignition` (every call site across the app is updated in later tasks in this plan — `AdminDashboard.jsx`, `BusinessDashboard.jsx`, `BusinessDetails.jsx`, `CheckoutSummary.jsx`). `Button`'s `primary` variant gains a glow-on-hover in addition to its color change.

- [ ] **Step 1: Button.jsx — ignition palette + hover glow**

Replace the full contents of `frontend/src/components/ui/Button.jsx` with:

```jsx
import React from 'react';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    disabled = false,
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center font-medium uppercase tracking-wide transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-ignition text-white hover:bg-ignition-dark hover:shadow-[0_0_24px_-4px_rgba(255,106,43,0.65)]",
        secondary: "bg-white text-ink border border-hairline hover:border-ignition",
        accent: "bg-ink text-white hover:bg-ignition-dark",
        ghost: "bg-transparent text-ink-soft hover:text-ink",
        danger: "bg-red-500 text-white hover:bg-red-600"
    };

    const sizes = {
        sm: "px-5 py-2.5 text-[11px] rounded-pill",
        md: "px-7 py-3.5 text-xs rounded-pill",
        lg: "px-9 py-4 text-sm rounded-pill",
        xl: "px-12 py-5 text-base rounded-pill"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
```

- [ ] **Step 2: Update Button.test.jsx's assertion**

In `frontend/src/components/ui/Button.test.jsx`, replace:

```js
    it('applies the navy primary variant by default', () => {
        render(<Button>Confirm</Button>);
        expect(screen.getByRole('button', { name: 'Confirm' })).toHaveClass('bg-navy');
    });
```

with:

```js
    it('applies the ignition primary variant by default', () => {
        render(<Button>Confirm</Button>);
        expect(screen.getByRole('button', { name: 'Confirm' })).toHaveClass('bg-ignition');
    });
```

- [ ] **Step 3: Badge.jsx — rename the `navy` variant to `ignition`**

Replace the full contents of `frontend/src/components/ui/Badge.jsx` with:

```jsx
import React from 'react';

const Badge = ({ children, variant = 'slate', className = '' }) => {
    const variants = {
        success: "bg-emerald-50 text-emerald-600",
        warning: "bg-amber-50 text-amber-600",
        danger: "bg-red-50 text-red-600",
        ignition: "bg-ignition text-white",
        accent: "bg-ink text-white",
        slate: "bg-surface text-ink-soft"
    };

    return (
        <span className={`px-4 py-1.5 rounded-pill text-[10px] font-medium uppercase tracking-wide ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};

export default Badge;
```

- [ ] **Step 4: Update Badge.test.jsx**

In `frontend/src/components/ui/Badge.test.jsx`, replace:

```js
    it('applies the navy variant classes', () => {
        render(<Badge variant="navy">Featured</Badge>);
        expect(screen.getByText('Featured')).toHaveClass('bg-navy');
    });
```

with:

```js
    it('applies the ignition variant classes', () => {
        render(<Badge variant="ignition">Featured</Badge>);
        expect(screen.getByText('Featured')).toHaveClass('bg-ignition');
    });
```

- [ ] **Step 5: Input.jsx — light-surface rule (bare `ignition`, not `ignition-light`)**

In `frontend/src/components/ui/Input.jsx`, replace:

```jsx
                {Icon && (
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-ink-soft transition-colors group-focus-within:text-navy">
                        <Icon size={18} />
                    </div>
                )}
                <input
                    className={`
                        w-full bg-background border border-hairline
                        py-4 ${Icon ? 'pl-14' : 'px-6'} pr-6 rounded-2xl text-sm font-medium text-ink
                        placeholder:text-ink-soft/60
                        focus:outline-none focus:border-navy-light
                        transition-colors duration-300
                        ${error ? 'border-red-500' : ''}
                    `}
                    {...props}
                />
```

with:

```jsx
                {Icon && (
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-ink-soft transition-colors group-focus-within:text-ignition">
                        <Icon size={18} />
                    </div>
                )}
                <input
                    className={`
                        w-full bg-background border border-hairline
                        py-4 ${Icon ? 'pl-14' : 'px-6'} pr-6 rounded-2xl text-sm font-medium text-ink
                        placeholder:text-ink-soft/60
                        focus:outline-none focus:border-ignition
                        transition-colors duration-300
                        ${error ? 'border-red-500' : ''}
                    `}
                    {...props}
                />
```

- [ ] **Step 6: StatCard.jsx — asphalt dark tone + tabular-nums ignition tick**

Replace the full contents of `frontend/src/components/ui/StatCard.jsx` with:

```jsx
import React from 'react';

const StatCard = ({ label, value, icon: Icon, tone = 'light', className = '' }) => {
    const tones = {
        light: 'bg-white border border-hairline text-ink',
        dark: 'bg-asphalt text-white',
    };

    return (
        <div className={`rounded-card p-6 ${tones[tone]} ${className}`}>
            {Icon && (
                <div className={`mb-4 grid h-10 w-10 place-items-center rounded-pill ${tone === 'dark' ? 'bg-white/10' : 'bg-surface'}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
            )}
            <span className="mb-2 block h-0.5 w-6 rounded-full bg-ignition" aria-hidden="true" />
            <p className={`text-xs font-medium uppercase tracking-[0.18em] ${tone === 'dark' ? 'text-white/60' : 'text-ink-soft'}`}>{label}</p>
            <p className="mt-1 font-outfit text-3xl font-medium tracking-tight tabular-nums">{value}</p>
        </div>
    );
};

export default StatCard;
```

- [ ] **Step 7: Update StatCard.test.jsx**

In `frontend/src/components/ui/StatCard.test.jsx`, replace:

```js
    it('applies the dark tone background', () => {
        render(<StatCard label="Users" value="10" tone="dark" />);
        expect(screen.getByText('Users').closest('div.rounded-card')).toHaveClass('bg-navy-deep');
    });
```

with:

```js
    it('applies the dark tone background', () => {
        render(<StatCard label="Users" value="10" tone="dark" />);
        expect(screen.getByText('Users').closest('div.rounded-card')).toHaveClass('bg-asphalt');
    });
```

- [ ] **Step 8: Eyebrow.jsx**

Replace the full contents of `frontend/src/components/ui/Eyebrow.jsx` with:

```jsx
const TEXT_TONES = {
    dark: 'text-ink-soft',
    light: 'text-white/70',
};

const DOT_TONES = {
    dark: 'bg-ignition',
    light: 'bg-ignition-light',
};

const Eyebrow = ({ children, tone = 'dark', className = '' }) => (
    <span className={`inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] ${TEXT_TONES[tone]} ${className}`}>
        <span className={`h-1.5 w-1.5 rounded-pill ${DOT_TONES[tone]}`} aria-hidden="true" />
        {children}
    </span>
);

export default Eyebrow;
```

- [ ] **Step 9: PillButton.jsx**

Replace the full contents of `frontend/src/components/ui/PillButton.jsx` with:

```jsx
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const VARIANTS = {
    light: 'bg-white text-ignition-dark hover:bg-ignition-light hover:text-white',
    solid: 'bg-ink text-white hover:bg-ignition-dark',
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

- [ ] **Step 10: ArrowButton.jsx**

In `frontend/src/components/ui/ArrowButton.jsx`, replace:

```js
const VARIANTS = {
    outline: 'border border-hairline text-ink hover:border-ink',
    solid: 'bg-ink border border-ink text-white hover:bg-navy-deep',
};
```

with:

```js
const VARIANTS = {
    outline: 'border border-hairline text-ink hover:border-ink',
    solid: 'bg-ink border border-ink text-white hover:bg-ignition-dark',
};
```

- [ ] **Step 11: ErrorBoundary.jsx**

In `frontend/src/components/ErrorBoundary.jsx`, replace:

```jsx
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-navy text-white px-8 py-3 rounded-pill text-sm font-medium uppercase tracking-wide hover:bg-navy-deep transition-colors"
                        >
```

with:

```jsx
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-ignition text-white px-8 py-3 rounded-pill text-sm font-medium uppercase tracking-wide hover:bg-ignition-dark transition-colors"
                        >
```

- [ ] **Step 12: Run the affected unit tests**

Run: `cd frontend && npx vitest run src/components/ui/Button.test.jsx src/components/ui/Badge.test.jsx src/components/ui/StatCard.test.jsx`
Expected: PASS, all green.

- [ ] **Step 13: Grep for any remaining `bg-navy`/`text-navy`/`border-navy`/`harbor` in this task's files**

Run: `cd frontend && grep -n "navy\|harbor" src/components/ui/Button.jsx src/components/ui/Badge.jsx src/components/ui/Input.jsx src/components/ui/StatCard.jsx src/components/ui/Eyebrow.jsx src/components/ui/PillButton.jsx src/components/ui/ArrowButton.jsx src/components/ErrorBoundary.jsx`
Expected: no output.

- [ ] **Step 14: Commit**

```bash
git add src/components/ui/Button.jsx src/components/ui/Button.test.jsx src/components/ui/Badge.jsx src/components/ui/Badge.test.jsx src/components/ui/Input.jsx src/components/ui/StatCard.jsx src/components/ui/StatCard.test.jsx src/components/ui/Eyebrow.jsx src/components/ui/PillButton.jsx src/components/ui/ArrowButton.jsx src/components/ErrorBoundary.jsx
git commit -m "feat: retheme UI atoms onto the Midnight Garage palette"
```

---

### Task 3: Layout — Header, Footer, MobileMenu

**Files:**
- Modify: `frontend/src/components/layout/Header.jsx`
- Modify: `frontend/src/components/layout/Footer.jsx`
- Modify: `frontend/src/components/layout/MobileMenu.jsx`

- [ ] **Step 1: Header.jsx**

In `frontend/src/components/layout/Header.jsx`, replace:

```js
                transparent ? 'bg-transparent text-white' : 'bg-navy-deep text-white shadow-md'
```

with:

```js
                transparent ? 'bg-transparent text-white' : 'bg-asphalt text-white shadow-md'
```

- [ ] **Step 2: Footer.jsx**

In `frontend/src/components/layout/Footer.jsx`, replace:

```jsx
        <footer id="contact" className="mt-3 rounded-card-lg bg-navy-deep px-6 py-14 text-white sm:px-10 sm:py-16">
```

with:

```jsx
        <footer id="contact" className="mt-3 rounded-card-lg bg-asphalt px-6 py-14 text-white sm:px-10 sm:py-16">
```

- [ ] **Step 3: MobileMenu.jsx — surface + dark-panel accent (`ignition-light`)**

In `frontend/src/components/layout/MobileMenu.jsx`, replace:

```jsx
                className="absolute inset-0 bg-navy-deep"
```

with:

```jsx
                className="absolute inset-0 bg-asphalt"
```

Replace:

```jsx
                                className="block text-5xl font-medium leading-tight tracking-tight transition-colors hover:text-navy-light sm:text-7xl"
```

with:

```jsx
                                className="block text-5xl font-medium leading-tight tracking-tight transition-colors hover:text-ignition-light sm:text-7xl"
```

- [ ] **Step 4: Grep check**

Run: `cd frontend && grep -n "navy\|harbor" src/components/layout/Header.jsx src/components/layout/Footer.jsx src/components/layout/MobileMenu.jsx`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Header.jsx src/components/layout/Footer.jsx src/components/layout/MobileMenu.jsx
git commit -m "feat: retheme Header, Footer, MobileMenu onto the Midnight Garage palette"
```

---

### Task 4: Overlays — IntroLoader, ContactModal

**Files:**
- Modify: `frontend/src/components/overlays/IntroLoader.jsx`
- Modify: `frontend/src/components/overlays/ContactModal.jsx`

**Interfaces:** ContactModal's form inputs sit on a light `bg-surface-card` panel (not a dark one) - they follow the light-surface rule (`ignition`, not `ignition-light`), even though the modal's own backdrop scrim is dark.

- [ ] **Step 1: IntroLoader.jsx**

In `frontend/src/components/overlays/IntroLoader.jsx`, replace:

```jsx
            className={`fixed inset-0 z-[200] flex flex-col items-center justify-center gap-8 bg-navy-deep text-white transition-transform ${
```

with:

```jsx
            className={`fixed inset-0 z-[200] flex flex-col items-center justify-center gap-8 bg-asphalt text-white transition-transform ${
```

- [ ] **Step 2: ContactModal.jsx — scrim + accent icon + button hovers (asphalt/ignition-dark)**

In `frontend/src/components/overlays/ContactModal.jsx`, replace:

```jsx
                className="absolute inset-0 bg-navy-deep/40 backdrop-blur-sm"
```

with:

```jsx
                className="absolute inset-0 bg-asphalt/40 backdrop-blur-sm"
```

Replace:

```jsx
                        <div className="mx-auto grid h-12 w-12 place-items-center rounded-pill bg-navy text-white">
```

with:

```jsx
                        <div className="mx-auto grid h-12 w-12 place-items-center rounded-pill bg-ignition text-white">
```

Replace (the "Done" button):

```jsx
                            className="mt-6 rounded-pill bg-ink px-7 py-3.5 text-sm font-medium uppercase tracking-wide text-white transition-colors hover:bg-navy-deep"
```

with:

```jsx
                            className="mt-6 rounded-pill bg-ink px-7 py-3.5 text-sm font-medium uppercase tracking-wide text-white transition-colors hover:bg-ignition-dark"
```

- [ ] **Step 3: ContactModal.jsx — form inputs (light-surface rule: bare `ignition`)**

In `frontend/src/components/overlays/ContactModal.jsx`, there are three identical-pattern inputs/textarea. Replace all three occurrences of:

```
focus:border-navy-light focus:outline-none
```

with:

```
focus:border-ignition focus:outline-none
```

(Full name input, email input, and the message textarea - all three currently read `className="w-full rounded-xl border border-hairline bg-background px-4 py-3 text-sm focus:border-navy-light focus:outline-none"`; only the `focus:border-navy-light` fragment changes in each.)

- [ ] **Step 4: ContactModal.jsx — submit button hover**

Replace:

```jsx
                            className="mt-2 rounded-pill bg-ink px-7 py-3.5 text-sm font-medium uppercase tracking-wide text-white transition-colors hover:bg-navy-deep disabled:opacity-50"
```

with:

```jsx
                            className="mt-2 rounded-pill bg-ink px-7 py-3.5 text-sm font-medium uppercase tracking-wide text-white transition-colors hover:bg-ignition-dark disabled:opacity-50"
```

- [ ] **Step 5: Grep check**

Run: `cd frontend && grep -n "navy\|harbor" src/components/overlays/IntroLoader.jsx src/components/overlays/ContactModal.jsx`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/components/overlays/IntroLoader.jsx src/components/overlays/ContactModal.jsx
git commit -m "feat: retheme IntroLoader and ContactModal onto the Midnight Garage palette"
```

---

### Task 5: Home components — Hero, Listings, Stats, Testimonials, TrustCarousel

**Files:**
- Modify: `frontend/src/components/home/Hero.jsx`
- Modify: `frontend/src/components/home/Listings.jsx`
- Modify: `frontend/src/components/home/Stats.jsx`
- Modify: `frontend/src/components/home/Testimonials.jsx`
- Modify: `frontend/src/components/home/TrustCarousel.jsx`

(`Facilities.jsx` was already handled in Task 1; `Services.jsx` has no navy/harbor tokens and needs no change.)

**Interfaces:** Hero's search form sits on a light `bg-white/95` panel (light-surface rule: bare `ignition`), while its own hero surface and stat-card border are dark (`asphalt`/`ignition-dark`).

- [ ] **Step 1: Hero.jsx — surface + gradient**

In `frontend/src/components/home/Hero.jsx`, replace:

```jsx
            className="relative isolate flex min-h-[36rem] flex-col overflow-hidden rounded-card-lg bg-navy-deep text-white"
```

with:

```jsx
            className="relative isolate flex min-h-[36rem] flex-col overflow-hidden rounded-card-lg bg-asphalt text-white"
```

Replace:

```jsx
                <div className="absolute inset-0 bg-gradient-to-b from-navy-deep/65 via-navy-deep/35 to-navy-deep/75" />
```

with:

```jsx
                <div className="absolute inset-0 bg-gradient-to-b from-asphalt/65 via-asphalt/35 to-asphalt/75" />
```

- [ ] **Step 2: Hero.jsx — decorative dot border**

Replace:

```jsx
                                            className="h-5 w-5 rounded-pill border border-navy-deep/40"
```

with:

```jsx
                                            className="h-5 w-5 rounded-pill border border-asphalt/40"
```

- [ ] **Step 3: Hero.jsx — search form (light-surface rule)**

There are four identical-role `focus:border-navy-light` occurrences on the search form's destination input, time input, and duration select (all sitting on the light `bg-white/95` form panel). Replace all four occurrences of:

```
outline-none focus:border-navy-light
```

with:

```
outline-none focus:border-ignition
```

- [ ] **Step 4: Hero.jsx — search submit button (accent + nested dark badge)**

Replace:

```jsx
                    className="inline-flex items-center gap-3 self-start rounded-pill bg-navy pl-2 pr-6 py-2 text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
                >
                    <span className="grid h-8 w-8 place-items-center rounded-pill bg-navy-deep">
```

with:

```jsx
                    className="inline-flex items-center gap-3 self-start rounded-pill bg-ignition pl-2 pr-6 py-2 text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
                >
                    <span className="grid h-8 w-8 place-items-center rounded-pill bg-ignition-dark">
```

- [ ] **Step 5: Listings.jsx**

In `frontend/src/components/home/Listings.jsx`, replace:

```jsx
                                <div className="h-full w-full bg-gradient-to-br from-navy-light to-navy-deep" />
```

with:

```jsx
                                <div className="h-full w-full bg-gradient-to-br from-ignition-light to-asphalt" />
```

Replace:

```jsx
                                <MapPin className="h-3.5 w-3.5 text-navy" aria-hidden="true" />
```

with:

```jsx
                                <MapPin className="h-3.5 w-3.5 text-ignition" aria-hidden="true" />
```

Replace:

```jsx
                                    className="inline-flex items-center gap-2 rounded-pill bg-ink px-5 py-3 text-xs font-medium uppercase tracking-widest text-white transition-colors hover:bg-navy-deep"
```

with:

```jsx
                                    className="inline-flex items-center gap-2 rounded-pill bg-ink px-5 py-3 text-xs font-medium uppercase tracking-widest text-white transition-colors hover:bg-ignition-dark"
```

- [ ] **Step 6: Stats.jsx**

In `frontend/src/components/home/Stats.jsx`, replace:

```jsx
    <section className="mt-3 rounded-card-lg bg-navy-deep px-6 py-20 text-white sm:px-10">
```

with:

```jsx
    <section className="mt-3 rounded-card-lg bg-asphalt px-6 py-20 text-white sm:px-10">
```

- [ ] **Step 7: Testimonials.jsx**

In `frontend/src/components/home/Testimonials.jsx`, replace:

```jsx
                        <p className="text-4xl leading-none text-navy" aria-hidden="true">&ldquo;</p>
```

with:

```jsx
                        <p className="text-4xl leading-none text-ignition" aria-hidden="true">&ldquo;</p>
```

- [ ] **Step 8: TrustCarousel.jsx — neutral image placeholder stays asphalt**

In `frontend/src/components/home/TrustCarousel.jsx`, replace:

```jsx
                <figure className="relative aspect-[3/4] overflow-hidden rounded-card bg-navy">
```

with:

```jsx
                <figure className="relative aspect-[3/4] overflow-hidden rounded-card bg-asphalt">
```

Replace:

```jsx
                    <figcaption className="absolute inset-x-3 bottom-3 rounded-xl bg-navy-deep/40 px-3 py-2 text-white backdrop-blur">
```

with:

```jsx
                    <figcaption className="absolute inset-x-3 bottom-3 rounded-xl bg-asphalt/40 px-3 py-2 text-white backdrop-blur">
```

- [ ] **Step 9: Grep check**

Run: `cd frontend && grep -n "navy\|harbor" src/components/home/Hero.jsx src/components/home/Listings.jsx src/components/home/Stats.jsx src/components/home/Testimonials.jsx src/components/home/TrustCarousel.jsx`
Expected: no output.

- [ ] **Step 10: Commit**

```bash
git add src/components/home/Hero.jsx src/components/home/Listings.jsx src/components/home/Stats.jsx src/components/home/Testimonials.jsx src/components/home/TrustCarousel.jsx
git commit -m "feat: retheme Hero, Listings, Stats, Testimonials, TrustCarousel onto the Midnight Garage palette"
```

---

### Task 6: App.jsx — directional route transitions + pulse loading spinner

**Files:**
- Modify: `frontend/src/App.jsx`

**Interfaces:**
- Produces: every route change now animates with a directional slide+fade instead of a hard cut, via a `motion.div` wrapper keyed by `location.pathname`.

- [ ] **Step 1: Add the motion imports and route-transition variants**

Replace:

```jsx
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
```

with:

```jsx
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
```

Add this constant right after the imports (before `ProtectedRoute`):

```jsx
const ROUTE_TRANSITION = {
    initial: { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -24 },
    transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] },
};
```

- [ ] **Step 2: Wrap `<Routes>` in the transition**

Replace:

```jsx
                <div className="flex flex-1 flex-col">
                    <Routes>
                        <Route path="/" element={<Home />} />
```

with:

```jsx
                <div className="flex flex-1 flex-col">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={ROUTE_TRANSITION.initial}
                            animate={ROUTE_TRANSITION.animate}
                            exit={ROUTE_TRANSITION.exit}
                            transition={ROUTE_TRANSITION.transition}
                            className="flex flex-1 flex-col"
                        >
                    <Routes>
                        <Route path="/" element={<Home />} />
```

Replace the closing of that block:

```jsx
                    </Routes>
                </div>
                <Footer />
```

with:

```jsx
                    </Routes>
                        </motion.div>
                    </AnimatePresence>
                </div>
                <Footer />
```

- [ ] **Step 3: Pulse loading spinner**

Replace:

```jsx
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-navy"></div>
        </div>
    );
```

with:

```jsx
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pulse"></div>
        </div>
    );
```

- [ ] **Step 4: Manually verify routing still works**

Run: `cd frontend && npm run dev`, open the app in a browser, and click between at least three routes (Home → About → Login). Expected: each transition slides/fades instead of a hard cut, no console errors, and `Routes`/`Route` still resolve correctly (`AnimatePresence` re-keying on `location.pathname` must not break `ProtectedRoute` redirects - confirm `/profile` still redirects to `/login` when logged out).

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add directional route transitions and pulse loading spinner"
```

---

### Task 7: Auth pages — Login, Register

**Files:**
- Modify: `frontend/src/pages/Login/Login.jsx`
- Modify: `frontend/src/pages/Register/Register.jsx`

- [ ] **Step 1: Login.jsx**

In `frontend/src/pages/Login/Login.jsx`, replace:

```jsx
                    <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-card bg-navy">
```

with:

```jsx
                    <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-card bg-ignition">
```

Replace:

```jsx
                        <Link to="/register" className="ml-2 font-medium text-navy hover:underline">Create an account</Link>
```

with:

```jsx
                        <Link to="/register" className="ml-2 font-medium text-ignition hover:underline">Create an account</Link>
```

- [ ] **Step 2: Register.jsx**

In `frontend/src/pages/Register/Register.jsx`, replace:

```jsx
                    <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-card bg-navy">
```

with:

```jsx
                    <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-card bg-ignition">
```

Replace both role-selector buttons' class strings:

```jsx
                                    className={`flex flex-col items-center gap-2 rounded-2xl border py-5 transition-colors ${
                                        formData.role === 'customer'
                                            ? 'border-navy bg-navy text-white'
                                            : 'border-hairline bg-surface text-ink-soft hover:border-navy'
                                    }`}
```

with:

```jsx
                                    className={`flex flex-col items-center gap-2 rounded-2xl border py-5 transition-colors ${
                                        formData.role === 'customer'
                                            ? 'border-ignition bg-ignition text-white'
                                            : 'border-hairline bg-surface text-ink-soft hover:border-ignition'
                                    }`}
```

and:

```jsx
                                    className={`flex flex-col items-center gap-2 rounded-2xl border py-5 transition-colors ${
                                        formData.role === 'business'
                                            ? 'border-navy bg-navy text-white'
                                            : 'border-hairline bg-surface text-ink-soft hover:border-navy'
                                    }`}
```

with:

```jsx
                                    className={`flex flex-col items-center gap-2 rounded-2xl border py-5 transition-colors ${
                                        formData.role === 'business'
                                            ? 'border-ignition bg-ignition text-white'
                                            : 'border-hairline bg-surface text-ink-soft hover:border-ignition'
                                    }`}
```

Replace:

```jsx
                        <Link to="/login" className="ml-2 font-medium text-navy hover:underline">Sign in</Link>
```

with:

```jsx
                        <Link to="/login" className="ml-2 font-medium text-ignition hover:underline">Sign in</Link>
```

- [ ] **Step 3: Grep check**

Run: `cd frontend && grep -n "navy\|harbor" src/pages/Login/Login.jsx src/pages/Register/Register.jsx`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Login/Login.jsx src/pages/Register/Register.jsx
git commit -m "feat: retheme Login and Register onto the Midnight Garage palette"
```

---

### Task 8: BusinessDetails.jsx — palette + glow-pulse on real-time slot availability

**Files:**
- Modify: `frontend/src/pages/Home/BusinessDetails.jsx`

**Interfaces:**
- Consumes: `animate-glow-pulse` from Task 1.
- Produces: slot buttons that just flipped to `available` via the `slotsUpdated` socket event briefly glow cyan.

- [ ] **Step 1: Loading spinners → pulse**

There are two identical page/button-loading spinners. Replace both occurrences of:

```
border-2 border-navy/30 border-t-navy
```

with:

```
border-2 border-pulse/30 border-t-pulse
```

- [ ] **Step 2: Hero image overlay + booking summary panel → asphalt**

Replace:

```jsx
                <div className="relative h-80 w-full overflow-hidden bg-navy-deep">
```

with:

```jsx
                <div className="relative h-80 w-full overflow-hidden bg-asphalt">
```

Replace:

```jsx
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-navy-deep/20 to-transparent" />
```

with:

```jsx
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-asphalt/20 to-transparent" />
```

Replace:

```jsx
                            <div className="rounded-card-lg bg-navy-deep p-8 text-white">
```

with:

```jsx
                            <div className="rounded-card-lg bg-asphalt p-8 text-white">
```

- [ ] **Step 3: Badge variant rename**

Replace:

```jsx
                        <Badge variant="navy">Verified location</Badge>
```

with:

```jsx
                        <Badge variant="ignition">Verified location</Badge>
```

- [ ] **Step 4: Feature icons + Info icon → ignition (light-surface)**

There are three identical-pattern `text-navy` icon colors on light `bg-surface` circles (Clock, ShieldCheck, and the Info icon in the cancellation notice). Replace all three occurrences of `text-navy` in those `<Icon className="h-5 w-5 text-navy" ...>`/`<Info ... text-navy ...>` lines with `text-ignition`. Concretely:

```
<Clock className="h-5 w-5 text-navy" aria-hidden="true" />
```
→
```
<Clock className="h-5 w-5 text-ignition" aria-hidden="true" />
```

```
<ShieldCheck className="h-5 w-5 text-navy" aria-hidden="true" />
```
→
```
<ShieldCheck className="h-5 w-5 text-ignition" aria-hidden="true" />
```

```
<Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-navy" aria-hidden="true" />
```
→
```
<Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-ignition" aria-hidden="true" />
```

- [ ] **Step 5: Booking summary panel inputs → ignition-light (dark-surface panel)**

There are two identical `focus:border-navy-light` occurrences on the arrival-time input and duration select, both inside the dark `bg-asphalt` booking summary panel from Step 2. Replace both occurrences of:

```
focus:border-navy-light focus:outline-none
```

with:

```
focus:border-ignition-light focus:outline-none
```

- [ ] **Step 6: Track which slots just became available, for the glow-pulse**

Add state to track newly-available slot ids. Replace:

```jsx
    const [duration, setDuration] = useState(60);
    const [arrivalTime, setArrivalTime] = useState('');
    const [pendingPayment, setPendingPayment] = useState(null); // { booking, order } while awaiting payment
    const { user } = useAuth();
    const { pay, isProcessing, error: paymentError } = usePayment();
```

with:

```jsx
    const [duration, setDuration] = useState(60);
    const [arrivalTime, setArrivalTime] = useState('');
    const [pendingPayment, setPendingPayment] = useState(null); // { booking, order } while awaiting payment
    const [justAvailableIds, setJustAvailableIds] = useState(new Set());
    const { user } = useAuth();
    const { pay, isProcessing, error: paymentError } = usePayment();
```

- [ ] **Step 7: Diff old vs. new slot statuses inside `fetchSlots`**

Replace:

```jsx
    const fetchSlots = async () => {
        try {
            const slotsRes = await api.get(`/slots/${id}`);
            setSlots(slotsRes.data.data);

            setSelectedSlot(prev => {
                const refreshed = slotsRes.data.data.find(s => s.id === prev?.id);
                return refreshed?.status === 'available' ? refreshed : null;
            });
        } catch (error) {
            console.error('Error fetching slots', error);
        }
    };
```

with:

```jsx
    const fetchSlots = async () => {
        try {
            const slotsRes = await api.get(`/slots/${id}`);
            const freshSlots = slotsRes.data.data;

            setSlots(prevSlots => {
                const newlyAvailable = freshSlots
                    .filter(fresh => {
                        const prev = prevSlots.find(s => s.id === fresh.id);
                        return fresh.status === 'available' && prev && prev.status !== 'available';
                    })
                    .map(s => s.id);

                if (newlyAvailable.length > 0) {
                    setJustAvailableIds(new Set(newlyAvailable));
                    window.setTimeout(() => setJustAvailableIds(new Set()), 2400);
                }

                return freshSlots;
            });

            setSelectedSlot(prev => {
                const refreshed = freshSlots.find(s => s.id === prev?.id);
                return refreshed?.status === 'available' ? refreshed : null;
            });
        } catch (error) {
            console.error('Error fetching slots', error);
        }
    };
```

- [ ] **Step 8: Apply the glow to newly-available slot buttons + fix `Badge`/slot-grid tokens**

Replace:

```jsx
                                {slots.map((slot) => {
                                    const isAvailable = slot.status === 'available';
                                    return (
                                        <button
                                            key={slot.id}
                                            disabled={!isAvailable}
                                            onClick={() => setSelectedSlot(slot)}
                                            className={`relative flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl transition-colors ${
                                                isAvailable
                                                    ? selectedSlot?.id === slot.id
                                                        ? 'bg-navy text-white'
                                                        : 'border border-hairline bg-surface text-ink-soft hover:border-navy'
                                                    : 'cursor-not-allowed bg-ghost/40 text-ink-soft/50'
                                            }`}
                                        >
```

with:

```jsx
                                {slots.map((slot) => {
                                    const isAvailable = slot.status === 'available';
                                    const justBecameAvailable = justAvailableIds.has(slot.id);
                                    return (
                                        <button
                                            key={slot.id}
                                            disabled={!isAvailable}
                                            onClick={() => setSelectedSlot(slot)}
                                            className={`relative flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl transition-colors ${
                                                justBecameAvailable ? 'animate-glow-pulse' : ''
                                            } ${
                                                isAvailable
                                                    ? selectedSlot?.id === slot.id
                                                        ? 'bg-ignition text-white'
                                                        : 'border border-hairline bg-surface text-ink-soft hover:border-ignition'
                                                    : 'cursor-not-allowed bg-ghost/40 text-ink-soft/50'
                                            }`}
                                        >
```

- [ ] **Step 9: Grep check**

Run: `cd frontend && grep -n "navy" src/pages/Home/BusinessDetails.jsx`
Expected: no output.

- [ ] **Step 10: Manually verify the glow**

With both dev servers running (`Backend/npm run dev`, `frontend/npm run dev`), open a business details page in two browser tabs logged in as the same customer. In tab A, create a booking (or have another client mark a slot available again via cancel). In tab B, watch the slot grid: the slot that just flipped to `available` should briefly show a cyan glow ring. Expected: no console errors, glow fades out after ~2.4s.

- [ ] **Step 11: Commit**

```bash
git add src/pages/Home/BusinessDetails.jsx
git commit -m "feat: retheme BusinessDetails and add glow-pulse for real-time slot availability"
```

---

### Task 9: Profile, CheckoutSummary, BookingSuccess

**Files:**
- Modify: `frontend/src/pages/Profile/Profile.jsx`
- Modify: `frontend/src/pages/CheckoutSummary.jsx`
- Modify: `frontend/src/pages/BookingSuccess/BookingSuccess.jsx`

- [ ] **Step 1: Profile.jsx — pulse spinner + ignition buttons**

Replace:

```jsx
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-navy/30 border-t-navy" />
```

with:

```jsx
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-pulse/30 border-t-pulse" />
```

Replace the "Check out" button's classes:

```jsx
                                                        className="flex items-center gap-2 rounded-pill bg-navy px-4 py-2 text-xs font-medium uppercase tracking-wide text-white hover:bg-navy-deep"
```

with:

```jsx
                                                        className="flex items-center gap-2 rounded-pill bg-ignition px-4 py-2 text-xs font-medium uppercase tracking-wide text-white hover:bg-ignition-dark"
```

Replace the "Complete payment" button's classes:

```jsx
                                                    className="flex items-center gap-2 rounded-pill bg-navy px-4 py-2 text-xs font-medium uppercase tracking-wide text-white hover:bg-navy-deep disabled:opacity-50"
```

with:

```jsx
                                                    className="flex items-center gap-2 rounded-pill bg-ignition px-4 py-2 text-xs font-medium uppercase tracking-wide text-white hover:bg-ignition-dark disabled:opacity-50"
```

- [ ] **Step 2: CheckoutSummary.jsx**

Replace:

```jsx
                            <div className="relative bg-navy-deep p-8 text-white">
```

with:

```jsx
                            <div className="relative bg-asphalt p-8 text-white">
```

Replace:

```jsx
                                <Badge variant="navy" className="mb-4">Parking receipt</Badge>
```

with:

```jsx
                                <Badge variant="ignition" className="mb-4">Parking receipt</Badge>
```

- [ ] **Step 3: BookingSuccess.jsx**

Replace:

```jsx
                            className="relative z-10 grid h-24 w-24 place-items-center rounded-card bg-navy"
```

with:

```jsx
                            className="relative z-10 grid h-24 w-24 place-items-center rounded-card bg-ignition"
```

- [ ] **Step 4: Grep check**

Run: `cd frontend && grep -n "navy\|harbor" src/pages/Profile/Profile.jsx src/pages/CheckoutSummary.jsx src/pages/BookingSuccess/BookingSuccess.jsx`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Profile/Profile.jsx src/pages/CheckoutSummary.jsx src/pages/BookingSuccess/BookingSuccess.jsx
git commit -m "feat: retheme Profile, CheckoutSummary, BookingSuccess onto the Midnight Garage palette"
```

---

### Task 10: AdminDashboard.jsx

**Files:**
- Modify: `frontend/src/pages/Admin/AdminDashboard.jsx`

- [ ] **Step 1: Spinner + sidebar + logo icon**

Replace:

```jsx
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-navy/30 border-t-navy" />
```

with:

```jsx
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-pulse/30 border-t-pulse" />
```

Replace:

```jsx
                activeTab === id ? 'bg-navy text-white' : 'text-ink-soft hover:bg-surface hover:text-ink'
```

with:

```jsx
                activeTab === id ? 'bg-ignition text-white' : 'text-ink-soft hover:bg-surface hover:text-ink'
```

Replace:

```jsx
                        <div className="grid h-10 w-10 place-items-center rounded-card bg-navy text-white">
```

with:

```jsx
                        <div className="grid h-10 w-10 place-items-center rounded-card bg-ignition text-white">
```

- [ ] **Step 2: Bell button hover + search focus (light-surface)**

Replace:

```jsx
                            <button className="grid h-11 w-11 place-items-center rounded-card border border-hairline bg-white text-ink-soft hover:text-navy">
```

with:

```jsx
                            <button className="grid h-11 w-11 place-items-center rounded-card border border-hairline bg-white text-ink-soft hover:text-ignition">
```

Replace:

```jsx
                                <input placeholder="Search records…" className="rounded-pill border border-hairline bg-surface py-2.5 pl-10 pr-5 text-xs text-ink focus:border-navy-light focus:outline-none" />
```

with:

```jsx
                                <input placeholder="Search records…" className="rounded-pill border border-hairline bg-surface py-2.5 pl-10 pr-5 text-xs text-ink focus:border-ignition focus:outline-none" />
```

- [ ] **Step 3: Badge variant renames**

Replace:

```jsx
                                                <Badge variant={
                                                    biz.status === 'approved' ? 'success' :
                                                    biz.status === 'rejected' ? 'danger' :
                                                    'navy'
                                                }>
```

with:

```jsx
                                                <Badge variant={
                                                    biz.status === 'approved' ? 'success' :
                                                    biz.status === 'rejected' ? 'danger' :
                                                    'ignition'
                                                }>
```

Replace:

```jsx
                                                <Badge variant={
                                                    u.role === 'admin' ? 'navy' :
                                                    u.role === 'business' ? 'accent' :
                                                    'slate'
                                                }>
```

with:

```jsx
                                                <Badge variant={
                                                    u.role === 'admin' ? 'ignition' :
                                                    u.role === 'business' ? 'accent' :
                                                    'slate'
                                                }>
```

- [ ] **Step 4: Grep check**

Run: `cd frontend && grep -n "navy\|harbor" src/pages/Admin/AdminDashboard.jsx`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Admin/AdminDashboard.jsx
git commit -m "feat: retheme AdminDashboard onto the Midnight Garage palette"
```

---

### Task 11: BusinessDashboard.jsx — palette + fix the `slot.isAvailable` display bug

**Files:**
- Modify: `frontend/src/pages/Dashboard/BusinessDashboard.jsx`

**Interfaces:** Bonus fix found while reading this file for the retheme: the slot-management table still reads `slot.isAvailable`, a field the backend renamed to `slot.status` a while ago (fixed for the customer-facing `BusinessDetails.jsx` page in the frontend-sync plan, but this business-owner-facing table was missed). Since `isAvailable` is `undefined` on real API responses, every slot currently renders as "Occupied" regardless of its real status - this fixes it in the same pass as the color tokens since it's the exact same lines.

- [ ] **Step 1: Spinner + sidebar/modal accents**

Replace:

```jsx
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-navy/30 border-t-navy" />
```

with:

```jsx
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-pulse/30 border-t-pulse" />
```

Replace:

```jsx
                activeTab === id ? 'bg-navy text-white' : 'text-ink-soft hover:bg-surface hover:text-ink'
```

with:

```jsx
                activeTab === id ? 'bg-ignition text-white' : 'text-ink-soft hover:bg-surface hover:text-ink'
```

There are three identical modal-overlay occurrences. Replace all three occurrences of:

```
bg-navy-deep/60 p-6 backdrop-blur-sm
```

with:

```
bg-asphalt/60 p-6 backdrop-blur-sm
```

- [ ] **Step 2: Badge variant renames**

There are two identical-pattern occurrences. Replace both:

```jsx
                            <Badge variant="navy" className="mb-6">Action required</Badge>
```

with:

```jsx
                            <Badge variant="ignition" className="mb-6">Action required</Badge>
```

and:

```jsx
                            <Badge variant="navy" className="mb-6">Scale your facility</Badge>
```

with:

```jsx
                            <Badge variant="ignition" className="mb-6">Scale your facility</Badge>
```

- [ ] **Step 3: Photo dropzone borders (light-surface rule) - two identical occurrences**

Replace both occurrences of:

```
border-2 border-dashed border-hairline hover:border-navy-light
```

with:

```
border-2 border-dashed border-hairline hover:border-ignition
```

- [ ] **Step 4: Settings icon, sidebar logo, Bell/MoreHorizontal hovers, search focus**

Replace:

```jsx
                                <Settings className="text-navy" size={26} aria-hidden="true" />
```

with:

```jsx
                                <Settings className="text-ignition" size={26} aria-hidden="true" />
```

Replace:

```jsx
                        <div className="grid h-10 w-10 place-items-center rounded-card bg-navy text-white">
```

with:

```jsx
                        <div className="grid h-10 w-10 place-items-center rounded-card bg-ignition text-white">
```

Replace:

```jsx
                        <button className="grid h-11 w-11 place-items-center rounded-card border border-hairline bg-white text-ink-soft hover:text-navy">
```

with:

```jsx
                        <button className="grid h-11 w-11 place-items-center rounded-card border border-hairline bg-white text-ink-soft hover:text-ignition">
```

There are two identical-pattern `focus:border-navy-light` search inputs. Replace both occurrences of:

```
focus:border-navy-light focus:outline-none
```

with:

```
focus:border-ignition focus:outline-none
```

Replace:

```jsx
                                                    <button className="p-2 text-ink-soft hover:text-navy">
```

with:

```jsx
                                                    <button className="p-2 text-ink-soft hover:text-ignition">
```

- [ ] **Step 5: `text-navy` on the "Booked for X" label**

Replace:

```jsx
                                                            <span className="mt-1 text-xs text-navy">{active.status === 'overdue' ? 'Overdue' : `Booked for ${durationLabel}`}</span>
```

with:

```jsx
                                                            <span className="mt-1 text-xs text-ignition">{active.status === 'overdue' ? 'Overdue' : `Booked for ${durationLabel}`}</span>
```

- [ ] **Step 6: Fix `slot.isAvailable` → `slot.status === 'available'`**

Replace:

```jsx
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2">
                                                    <span className={`h-2 w-2 rounded-full ${slot.isAvailable ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                    <span className={`text-xs font-medium uppercase tracking-wide ${slot.isAvailable ? 'text-emerald-600' : 'text-red-500'}`}>
                                                        {slot.isAvailable ? 'Available' : 'Occupied'}
                                                    </span>
                                                </div>
                                            </td>
```

with:

```jsx
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2">
                                                    <span className={`h-2 w-2 rounded-full ${slot.status === 'available' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                    <span className={`text-xs font-medium uppercase tracking-wide ${slot.status === 'available' ? 'text-emerald-600' : 'text-red-500'}`}>
                                                        {slot.status === 'available' ? 'Available' : 'Occupied'}
                                                    </span>
                                                </div>
                                            </td>
```

Replace:

```jsx
                                                    <button
                                                        onClick={() => handleDeleteSlot(slot.id)}
                                                        disabled={!slot.isAvailable}
                                                        className={`p-2 ${slot.isAvailable ? 'text-ink-soft hover:text-red-500' : 'cursor-not-allowed text-ghost'}`}
                                                        title={slot.isAvailable ? 'Delete slot' : 'Cannot delete an occupied slot'}
                                                    >
```

with:

```jsx
                                                    <button
                                                        onClick={() => handleDeleteSlot(slot.id)}
                                                        disabled={slot.status !== 'available'}
                                                        className={`p-2 ${slot.status === 'available' ? 'text-ink-soft hover:text-red-500' : 'cursor-not-allowed text-ghost'}`}
                                                        title={slot.status === 'available' ? 'Delete slot' : 'Cannot delete an occupied slot'}
                                                    >
```

- [ ] **Step 7: Grep check**

Run: `cd frontend && grep -n "navy\|harbor\|isAvailable" src/pages/Dashboard/BusinessDashboard.jsx`
Expected: no output.

- [ ] **Step 8: Manually verify the slot status fix**

With the backend dev server running and at least one real business/slot in the dev DB, log in as that business owner and open the dashboard's slot table. Expected: slots actually marked `occupied`/`held`/`maintenance` in the DB now show red "Occupied" (previously always red regardless of real status); a slot with `status: 'available'` shows green "Available" and its delete button is enabled.

- [ ] **Step 9: Commit**

```bash
git add src/pages/Dashboard/BusinessDashboard.jsx
git commit -m "feat: retheme BusinessDashboard and fix slot.isAvailable display bug"
```

---

### Task 12: About.jsx

**Files:**
- Modify: `frontend/src/pages/About/About.jsx`

- [ ] **Step 1: Dark section surface**

Replace:

```jsx
            <section className="mx-6 mb-24 overflow-hidden rounded-card-lg bg-navy-deep py-24 text-white">
```

with:

```jsx
            <section className="mx-6 mb-24 overflow-hidden rounded-card-lg bg-asphalt py-24 text-white">
```

- [ ] **Step 2: Stat icons + "List your lot" icon (light-surface)**

Replace:

```jsx
                                        <stat.icon className="h-5 w-5 text-navy" aria-hidden="true" />
```

with:

```jsx
                                        <stat.icon className="h-5 w-5 text-ignition" aria-hidden="true" />
```

Replace:

```jsx
                            <div className="mb-6 grid h-20 w-20 place-items-center rounded-full bg-navy/10">
                                <Car className="h-10 w-10 text-navy" aria-hidden="true" />
                            </div>
```

with:

```jsx
                            <div className="mb-6 grid h-20 w-20 place-items-center rounded-full bg-ignition/10">
                                <Car className="h-10 w-10 text-ignition" aria-hidden="true" />
                            </div>
```

- [ ] **Step 3: Grep check**

Run: `cd frontend && grep -n "navy\|harbor" src/pages/About/About.jsx`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/pages/About/About.jsx
git commit -m "feat: retheme About onto the Midnight Garage palette"
```

---

### Task 13: Full sweep verification + progress log

**Files:**
- Modify: `Backend/CLAUDE.md`

**Interfaces:** None - final verification and documentation only.

- [ ] **Step 1: Sitewide grep - confirm zero remaining references**

Run: `cd frontend && grep -rn "navy\|harbor" src --include="*.jsx" --include="*.js"`
Expected: no output. If anything remains, it was missed by this plan - resolve it using the same remap rule from the Global Constraints section before proceeding.

- [ ] **Step 2: Run the full frontend test suite**

Run: `cd frontend && npm test -- --run` (or `npx vitest run`)
Expected: all existing suites pass (Home, Hero, Facilities, Listings, Services, Stats, Testimonials, TrustCarousel, Badge, Button, StatCard, tailwindTokens).

- [ ] **Step 3: Lint check**

Run: `cd frontend && npx eslint src`
Expected: no new errors (pre-existing `react-hooks/exhaustive-deps` warnings on `BusinessDetails.jsx` are expected and unrelated to this plan).

- [ ] **Step 4: Full build**

Run: `cd frontend && npm run build`
Expected: builds cleanly with no errors (a broken Tailwind class or unclosed JSX from a find-replace would surface here).

- [ ] **Step 5: Visual browser walkthrough**

Boot both dev servers and walk through, in a browser: Home (hero, trust carousel, listings, facilities, stats, testimonials), Login, Register, a business details page (slot grid, booking summary panel), Profile (with at least one booking in each status if possible), a business dashboard, and the admin dashboard. Expected: no leftover blue anywhere, dark panels read as near-black asphalt (not navy-tinted), buttons/badges/accents read as ignition-orange, loading spinners are cyan, and the route transitions slide/fade between pages.

- [ ] **Step 6: Append a session note to `Backend/CLAUDE.md`**

Add a new dated entry under "Session notes" summarizing: the third and final plan in the 2026-08-08 sequence is complete; every navy/harbor token replaced with the Midnight Garage palette (ignition/asphalt/pulse) across all ~20 affected files; the glow-pulse real-time slot animation, directional route transitions, and tabular-nums stat ticks were added per the design spec's motion language; a second `slot.isAvailable` vs. `slot.status` sync bug was found and fixed in `BusinessDashboard.jsx` (the customer-facing page was already fixed in the frontend-sync plan, this business-owner-facing one was missed).

- [ ] **Step 7: Commit**

```bash
cd Backend
git add CLAUDE.md
git commit -m "docs: note Midnight Garage visual overhaul completion - all three plans done"
```
