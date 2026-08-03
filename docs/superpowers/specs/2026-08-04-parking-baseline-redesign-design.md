# Design: Reskin ParkEase frontend using "Baseline" as visual/motion reference

**Date:** 2026-08-04
**Status:** Approved
**Scope:** `frontend/` (React app only)

## 1. Goal

Recreate the layout, visual language, and motion of the "Baseline" tennis-club
single-file HTML reference site inside the existing ParkEase React app, with
all content and imagery swapped for a car-parking marketplace. This is a
reskin of an existing, working product (real auth, real business/listing API,
real booking flow) — not a from-scratch marketing site build. Existing page
logic (Login, Register, Profile, Dashboard, Admin, About, Checkout,
BookingSuccess, BusinessDetails) is preserved as-is; only the visual shell
(Header/Footer) and the Home landing page are rebuilt.

## 2. Non-goals

- No backend/API changes. The contact/"List Your Lot" modal is a UI-only
  stub, same as the reference's contact modal.
- No change to auth, booking, dashboard, or admin business logic.
- Not a pixel-perfect port of the reference's global viewport-relative
  root-font-size scaling engine (see §5.4 for why, and what replaces it).

## 3. Decisions already confirmed with the user

1. **Palette:** full navy/blue reskin, adopting Baseline's tokens directly.
2. **Section scope:** full replica — hero, trust carousel, services list,
   facility cards, stats band, testimonials, footer, contact modal, mobile
   menu overlay, intro loader.
3. **Live data placement:** the real search form stays in the hero; the real
   API-driven business-listings grid gets its own dedicated section (new,
   not present in the reference).
4. **Header/Footer scope:** site-wide. Replaces the current `Navbar`
   (currently used on every route with no footer at all).
5. **Imagery:** 4K stock car/parking photography (Unsplash), verified at
   implementation time rather than guessed.

## 4. Palette & tokens

```css
--background:   #ffffff;
--foreground:   #0a0a0a;
--brand:        #2563c9;
--brand-deep:   #0f2f63;
--brand-light:  #5790e6;
--accent-teal:  #0b6e97;
--surface:      #f4f4f4;
--surface-card: #ffffff;
--ink:          #0a0a0a;
--ink-soft:     #717784;
--ghost:        #d7dae1;
--hairline:     #e6e8ec;
--on-brand:     #ffffff;

--radius-card:    1.5rem;
--radius-card-lg: 2rem;
--radius-pill:    62.5rem;
```

These become Tailwind theme extensions (`brand`, `brand-deep`, `brand-light`,
`accent-teal`, `surface`, `surface-card`, `ink`, `ink-soft`, `ghost`,
`hairline`), added alongside (not replacing) the existing `brand.yellow` /
`brand.black` tokens. Existing pages that still use the yellow/black tokens
(About, dashboards) are untouched and keep compiling.

Font: Google **Onest** (400/500), replacing the current `Inter`/`Outfit`
combo for the redesigned shell and Home page. Loaded via `<link>` in
`index.html`. `About`/dashboards keep whatever font they currently render in
(no forced change) since they're out of scope — but since `body` sets the
font-family, they'll inherit Onest too, which is fine (it's a normal system
sans, no visual regression expected).

**Dark mode:** kept. `ThemeContext` stays. The new `Header` gets a restyled
theme-toggle button (glass pill icon, matching the burger button's visual
treatment) instead of dropping the feature.

## 5. Technical approach

### 5.1 Motion: Framer Motion, not a hand-rolled spring engine

The reference implements its own rAF spring helper and CDN-imported Lenis
because it's plain JS/HTML with no framework. This app already depends on
`framer-motion` (^12) and gets the same spring-physics feel from
`whileInView` / `whileHover` / `animate` with a `type: "spring"` transition —
duplicating that in hand-rolled JS would be pure overhead.

Every `{tension, friction}` value in the reference is translated to a named
Framer Motion spring preset (feel-matched, not numerically identical —
react-spring and Framer Motion use different physics models):

| Preset | `{stiffness, damping}` | Used for |
|---|---|---|
| `springReveal` | `{120, 20}` | In-view rise/fade-ins (cards, stats, testimonials, badges) — covers reference configs in the `{170–220, 20–30}` range |
| `springSnappy` | `{260, 22}` | Hover micro-interactions: arrow nudge, icon rotate/scale, card lift/scale — covers `{260–320, 18–24}` |
| `springPanel` | `{90, 18}` | Modal / menu-overlay panel entrances — covers `{220–240, 26–28}` |

Text reveals (word/line clip-mask slide-ups) are **not** springs in the
reference — they're timed CSS/JS tweens with named easings. Those are kept
**exactly** as specified (durations, stagger, easing curves) since they're
cheap, deterministic CSS transitions:

- `easeOutExpo` `cubic-bezier(0.16, 1, 0.3, 1)` — word/line clip-mask reveals
- `easeOutQuart` `cubic-bezier(0.25, 1, 0.5, 1)` — facilities body word fade
- `easeInOutCubic` `cubic-bezier(0.65, 0, 0.35, 1)` — loader fill + curtain

Scroll-tied parallax (hero background plate, trust ghost-word X-drift) uses
Framer Motion's `useScroll` + `useTransform` against a ref, which composes
cleanly with Lenis (Lenis drives native scroll events; Framer's scroll
tracking doesn't care who's driving them).

`prefers-reduced-motion: reduce` is respected via Framer Motion's
`useReducedMotion()`: entrance animations skip to their end state instantly,
and the loader's minimum-visible time drops to ~200ms with an instant exit.

### 5.2 Smooth scroll: Lenis as a real dependency

Add `lenis` to `package.json` (normal npm import, not the reference's CDN
importmap — irrelevant here since this is a bundled Vite app). A
`useLenis` hook initializes it once at the app root and drives it with
`requestAnimationFrame`, exposing `start()`/`stop()` through `SiteUIContext`
(see §6) so the intro loader, mobile menu, and contact modal can lock/unlock
scroll the same way the reference does.

### 5.3 Reveal primitives

Three small building blocks in `components/ui/`, replacing the reference's
`TextEngine` / `Inview` / `Hover` JS classes with React equivalents:

- **`TextReveal`** — wraps text in per-word or per-line clip-mask spans
  (`overflow:hidden` box, inner span `translateY(115%) opacity:0` →
  `translateY(0) opacity:1`), staggered, using the exact easings/durations
  above. Supports a `key` prop so carousels can force a re-play when their
  active slide's text changes (React remounts the subtree on key change,
  which re-triggers the CSS transition — no manual "re-fire" logic needed).
- **`Reveal`** — thin wrapper around `motion.div` with `whileInView`,
  `viewport={{ once: true }}`, taking `from`/`to`/`delay`/preset props. This
  is the direct equivalent of the reference's `Inview`.
- Hover micro-interactions are just `whileHover` with `springSnappy` inline
  on the relevant element — no dedicated component needed. Disabled below
  768px via a `useMediaQuery` check (matches the reference's "hover disabled
  on mobile" rule) — achieved by only spreading the `whileHover` prop when
  the check is true.

### 5.4 Skipping the global adaptive-rem scaling engine

The reference recomputes `html { font-size }` from viewport width (media
queries below 1920px, JS above it) so a fixed 1920px design stays
proportional at any size. That's the correct tool when every dimension in a
hand-built page is hardcoded in `rem` against one fixed design width.

This app doesn't have that constraint — it already has working pages built
on a plain 16px root (Login, Register, Dashboard, Admin, Profile,
BookingSuccess, CheckoutSummary). Globally rescaling the root font-size would
silently rescale all of those too, and nothing about this task calls for
touching them. Instead:

- Normal Tailwind responsive prefixes (`sm:`/`md:`/`lg:`) for layout and
  most type sizes, same as the rest of the codebase already does.
- `clamp()` via Tailwind arbitrary values (`text-[clamp(2.5rem,12.5vw,9rem)]`
  etc.) only on the handful of genuinely fluid giant-type elements (hero
  title, trust-section ghost words) that need to scale continuously with
  viewport width rather than stepping at breakpoints.

### 5.5 Imagery

At implementation time: search Unsplash for car / parking-garage /
parking-lot / EV-charging photography, and for each candidate, issue a HEAD
request against the direct `images.unsplash.com` CDN URL (with
`?q=80&w=3840&auto=format&fit=crop` for ~4K width) to confirm it resolves
before hardcoding it into `data/images.js`. No image URL goes into the
codebase unverified. `loading="lazy"` everywhere except the hero background
plate (`loading="eager" fetchpriority="high"`).

## 6. Architecture

```
src/
  components/
    layout/
      Header.jsx        transparent-over-hero on Home, solid navy elsewhere/on scroll
      Footer.jsx
      MobileMenu.jsx     fullscreen overlay, portaled
    overlays/
      IntroLoader.jsx    once-per-session curtain (sessionStorage flag)
      ContactModal.jsx   "List Your Lot" partner-inquiry stub, portaled
    ui/
      Badge.jsx, Button.jsx, Input.jsx        (existing, unchanged)
      Eyebrow.jsx, PillButton.jsx, ArrowButton.jsx, CarouselDots.jsx  (new)
      TextReveal.jsx, Reveal.jsx                                     (new)
    home/
      Hero.jsx
      TrustCarousel.jsx
      Services.jsx
      Listings.jsx        the real API-driven grid, moved out of Home.jsx
      Facilities.jsx
      Stats.jsx
      Testimonials.jsx
    ErrorBoundary.jsx  (existing, unchanged)
  context/
    AuthContext.jsx, SocketContext.jsx, ThemeContext.jsx  (existing, unchanged)
    SiteUIContext.jsx   (new) — menu-open / contact-modal-open state,
                        Lenis start()/stop(), shared by Header, Footer,
                        MobileMenu, ContactModal, IntroLoader
  hooks/
    useLenis.js
    useMediaQuery.js
  data/
    homeContent.js      all hardcoded copy (hero lines, trust slides,
                        services rows, facility tiles, stats, testimonials,
                        footer nav/links, menu links)
    images.js           verified 4K image URL constants
  pages/
    Home/Home.jsx        now just composes the home/ section components
    (About, Admin, Dashboard, Login, Register, Profile, BookingSuccess,
     CheckoutSummary — unchanged)
  App.jsx               renders IntroLoader, Header, Routes, Footer, and the
                        portaled MobileMenu/ContactModal via SiteUIContext
```

`components/Navbar.jsx` is deleted; `Header`/`Footer` take over on every
route.

## 7. Content mapping (reference → parking)

| Reference section | Parking equivalent |
|---|---|
| Hero title "Own The Court" | "Find Your Perfect Spot" (kept from current copy), same giant clip-mask reveal treatment |
| Hero tagline "Show Up, Level Up" | "Park Smart, Drive More" |
| Hero background | Parallax 4K photo, cars in a lot / on a street |
| Hero collection slider (3 hardcoded slides) | **Live** — first 3 businesses from `GET /business`, cross-faded the same way; skeleton state while loading |
| Hero membership card | Kept as a live stat card: total spots/members figure pulled from existing data where available, otherwise a fixed "12K+ Drivers parked" constant, same glass-card visual |
| Hero search form | The existing destination / arrival-time / duration form from `Home.jsx`, restyled into the glass-card treatment, still wired to the existing `fetchBusinesses` search |
| Trust carousel ("Trusted by serious players") | "Trusted by drivers everywhere" — 3 slides: ghost words `Secure/Simple/Instant/Booking`, `Verified/Trusted/Local/Hosts`, `Smarter/City/Parking/Today`; rotating garage/lot photo + host name & role |
| Programs list | **Services**: 01 Hourly Parking · 02 Monthly Passes · 03 EV Charging Spots · 04 Valet & Event Parking |
| *(new — not in reference)* | **Listings**: the real API-driven business grid (existing card design from `Home.jsx`, restyled), anchor target for the hero search |
| Facilities ("Tour Our World-Class Courts") | "Tour Our Parking Facilities" — **Skyline Rooftop Lot** (open-air tone) / **Harbor Parking Garage** (covered tone) |
| Stats band | 40+ Cities Covered · 1,200+ Verified Locations · 2.4M+ Successful Bookings · 8 Years on the Road (aligned with the numbers already used on the existing About page) |
| Testimonials | Maya Chen (Daily Commuter), Tomás Ibarra (Downtown Resident, monthly pass), Renee Walsh (Lot Owner/Host) |
| Footer | Brand blurb, contact (`hello@parkease.com`, phone, address), 3 nav columns: **Services**, **Company**, **Legal & Support**; social placeholders |
| Contact modal | **"List Your Lot"** partner-inquiry stub form (name / email / message) — no network call, matching the reference's stub behavior |
| Intro loader | PARKEASE wordmark + car mark, navy curtain, same timings, shown once per browser session (`sessionStorage`), not on every in-app route change |
| Menu overlay | Home / Find Parking / Services / About links, auth-aware Login+Register or Profile/Dashboard/Admin+Logout, "List Your Lot" CTA, social row |

**Section order on Home:** Hero → Trust → Services → Listings → Facilities →
Stats → Testimonials → (Footer, global, rendered by `App.jsx` not `Home.jsx`).

## 8. Timings & constants kept verbatim from the reference

These are cheap, deterministic values with no reason to deviate:

- Loader: `MIN_VISIBLE_MS 1400`, `MAX_VISIBLE_MS 2600`, `EXIT_MS 850`,
  progress-fill delay `120ms` / duration `1280ms` / `easeInOutCubic`.
- Hero title: word stagger `140ms`, per-word duration `1100ms`,
  `easeOutExpo`.
- Tagline: base delay `350ms`, stagger `110ms`, duration `900ms`,
  `easeOutExpo`.
- Collection slider autoplay: `3800ms` interval, wrap-around.
- Trust ghost words: reveal duration `700ms`, `easeOutExpo`.
- Facilities body copy: word stagger `28ms`, delay `250ms`, duration
  `700ms`, `easeOutQuart`.
- Menu-overlay links: delay `120 + i×70ms`.

## 9. Accessibility

- `:focus-visible { outline: 2px solid var(--brand-light); outline-offset: 2px; }`
  as a global fallback, matching the reference.
- Loader, menu overlay, and contact modal all trap `Escape` to close (menu
  and modal) and restore Lenis scroll on close.
- Stat `<dt>` labels marked `sr-only` per the reference's semantics.
- Reduced motion respected as described in §5.1.

## 10. Testing

- Component-level smoke tests (Vitest + React Testing Library, added as a
  new devDependency since there's currently no test setup) for the new
  `home/` sections and `layout/` components: renders without crashing,
  correct copy from `data/homeContent.js`, search form submit still calls
  the existing `fetchBusinesses` path, contact modal never issues a network
  request on submit.
- Manual verification in a running dev server: golden path (load → loader
  plays once → hero reveals → scroll through all sections → search →
  listings update → open/close contact modal → open/close mobile menu →
  toggle dark mode) plus edge cases (reduced-motion, mobile viewport width,
  revisit within same session skips loader).

## 11. Open items for the implementation plan to resolve

- Exact verified Unsplash photo URLs (per §5.5).
- Whether the "live stat card" in the hero needs a small backend read (e.g.
  total business count) or stays a fixed constant — default to fixed
  constant unless a cheap existing endpoint already returns that count.
