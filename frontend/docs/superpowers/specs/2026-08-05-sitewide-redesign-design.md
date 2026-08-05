# Sitewide redesign: unify every page on the landing-page design language

## Goal

The landing page (Home, Header, Footer, MobileMenu, home/* sections, and the `ui/`
marketing atoms) uses a calm, editorial navy/ink/surface design system. Every other
page — Login, Register, Profile, BusinessDetails, CheckoutSummary, BookingSuccess,
About, AdminDashboard, BusinessDashboard, and the shared `Button`/`Badge`/`Input`
atoms — is a leftover neo-brutalist yellow/black "cyberpunk SaaS" theme with
ALL-CAPS jargon copy ("Secure Access Protocol", "Execute Onboarding",
"ADMIN.CENTRAL") and dark-mode support the landing page never adopted.

This spec covers reskinning the whole site onto the landing page's design language,
plus simplifying the navbar. **Visual/UX only** — no feature, flow, route, or API
change. Every `useEffect`/`api.*` call, every route, every prop contract stays as-is;
only JSX markup, className strings, and copy text change.

## Non-goals

- No new features, no changed booking/auth/admin logic, no new routes.
- No dark mode. It is being removed, not extended (see below).
- No backend changes.

## Reference (left untouched)

`Hero`, `TrustCarousel`, `Services`, `Listings`, `Facilities`, `Stats`,
`Testimonials`, `Footer`, `ContactModal`, `IntroLoader`, and the marketing atoms
`Eyebrow`, `PillButton`, `ArrowButton`, `Reveal`, `TextReveal`, `CarouselDots`,
`homeContent.js`, `images.js`. These define the target look and should not change
except where explicitly noted under Navbar below.

Design tokens already exist in `tailwind.config.js` and are correct as-is:
`navy` / `navy-deep` / `navy-light`, `harbor`, `surface` / `surface-card`, `ink` /
`ink-soft`, `ghost`, `hairline`, `background`; radii `card`, `card-lg`, `pill`;
fonts `sans` (Onest, body) and `outfit` (headings).

## Drop dark mode

- Delete `src/context/ThemeContext.jsx`.
- Remove `ThemeProvider` from `src/App.jsx` (and the import).
- Remove the theme toggle button and `useTheme` usage from `Header.jsx`.
- Remove every `dark:*` className across the codebase (grep confirmed matches in:
  `Header.jsx`, `Badge.jsx`, `Button.jsx`, `Input.jsx`, `Profile.jsx`,
  `AdminDashboard.jsx`, `BusinessDetails.jsx`, `BusinessDashboard.jsx`,
  `CheckoutSummary.jsx`, `Register.jsx`, `Login.jsx`, `BookingSuccess.jsx`).
- `Header.test.jsx` mocks `ThemeContext` — once the import is removed from
  `Header.jsx` the mock becomes inert but harmless; no test changes required for
  this file specifically, but re-run the suite to confirm.

## Shared UI kit (`src/components/ui/`)

**`Button.jsx`** — replace the `brand-yellow`/`brand-black` variants with tokens
already used by `PillButton`/`Services`:
- `primary`: `bg-navy text-white hover:bg-navy-deep`
- `secondary`: `bg-white border border-hairline text-ink hover:border-navy`
- `accent`: `bg-ink text-white hover:bg-navy-deep` (mirrors `PillButton`'s `solid`)
- `ghost`: `text-ink-soft hover:text-ink`
- `danger`: unchanged red, restyled to match radii/weight of the others
Base style drops `font-black uppercase tracking-widest` in favor of
`font-medium uppercase tracking-wide` (matches `PillButton`), and radii move to
`rounded-pill` / `rounded-card` instead of the ad-hoc `rounded-xl`/`2xl`/etc scale.

**`Badge.jsx`** — swap `brand`/`accent` variants for `navy`-based tones; keep
`success`/`warning`/`danger` semantics but on `surface` backgrounds; same pill
shape, `font-medium uppercase tracking-wide` instead of `font-black`.

**`Input.jsx`** — `border-hairline`, `bg-background`, `focus:border-navy-light`,
drop the heavy `shadow-premium`; keep the icon-left layout, it's fine.

**New: `StatCard.jsx`** — small atom for a labeled metric: hairline border,
`rounded-card`, label in `ink-soft` uppercase caption + value in `font-outfit`.
Used by Profile stats, AdminDashboard stats, BusinessDashboard stats — replaces
three separate hand-rolled stat-tile implementations with one.

**Dashboard sidebar pattern** — no new file needed; `AdminDashboard` and
`BusinessDashboard` each keep their local `SidebarItem` helper, just restyle the
active state to `bg-navy text-white` (from `bg-brand-yellow text-brand-black`) and
inactive to `text-ink-soft hover:text-ink hover:bg-surface`.

## Navbar (`Header.jsx`)

Current gaps (per user): icon-only controls with no label, primary links mostly
hidden behind the hamburger even on desktop, unclear where a logged-in user's
account/dashboard link goes.

Changes:
- `NAV_LINKS` + About currently only appear inline at the `lg` breakpoint
  (`hidden ... lg:flex`), while `List Your Lot`/`Sign In` appear earlier, at `sm`.
  That gap is the "hidden on desktop" complaint on tablet-width screens: primary
  nav disappears well before the secondary actions do. Lower the nav-links
  breakpoint to `md` so the primary links and the secondary actions become
  visible at the same point, leaving the hamburger as the mobile-only fallback.
- Remove the theme-toggle icon button entirely (dark mode gone).
- Logged-in state: replace the bare name-only link with a labeled link whose text
  depends on role — `My Bookings` (customer) / `Dashboard` (business, admin) —
  keeping the existing `User` icon, so it reads as a destination, not just an
  account badge.
- "Log out" gets a visible text label next to the `LogOut` icon instead of an
  icon-only button.
- `List Your Lot` and `Sign In` already have text labels — unchanged.
- Hamburger menu (`MobileMenu`) keeps its current role: secondary/social links,
  full nav on small screens. No structural change needed there since it already
  uses labeled links throughout.

## Page-by-page

**Login / Register** (`pages/Login/Login.jsx`, `pages/Register/Register.jsx`):
rebuild the card visuals on the Hero/Footer language — `bg-surface` page
background, a `bg-navy-deep text-white` accent panel or just a plain
`bg-surface-card` card with `hairline` border (no glow blobs), Car mark in a
`rounded-card bg-navy` tile. Copy: "Welcome back" / "Sign in to manage your
bookings" (Login), "Create your account" / "Join ParkEase to book or list parking"
(Register). Role picker in Register keeps its two-button UI, restyled with
navy selected state instead of yellow. Drop the "Verified Infrastructure" /
"ShieldCheck" footer flourish — replace with a plain helper line or remove.

**Profile** (`pages/Profile/Profile.jsx`): keep the stats-panel + booking-list
two-column shape. Stats panel becomes a `bg-navy-deep text-white rounded-card-lg`
block (same treatment as Footer's CTA strip) using `StatCard`-style rows. Booking
rows: `hairline` border cards, `Badge` atom for status, `Button`/icon buttons
restyled. Remove all `dark:` variants.

**BusinessDetails** (`pages/Home/BusinessDetails.jsx`): keep the slot-grid +
sticky-summary structure. Slot buttons: selected state `bg-navy text-white`
instead of yellow; available/unavailable states use `surface`/`hairline` instead
of near-black. Summary panel keeps the dark accent treatment but as
`bg-navy-deep` (not `bg-brand-black`). Copy cleanup: "Select Your Slot" stays,
drop "Node" phrasing ("Please ensure an Arrival Time and Node are selected" →
"Please choose an arrival time and a slot").

**CheckoutSummary** (`pages/CheckoutSummary.jsx`) / **BookingSuccess**
(`pages/BookingSuccess/BookingSuccess.jsx`): same token swap — `bg-navy-deep`
header/accent panels instead of `bg-brand-black`, `Badge`/`Button` restyled. Copy:
"Your reservation node has been successfully deployed" → "Your booking is
confirmed — details are in your account." Drop "Park-Ease System" phrasing.

**About** (`pages/About/About.jsx`): token swap only (`brand-black`→`ink`,
`brand-accent`→`navy`), section structure and copy tone already reasonably close
to on-brand; trim remaining "Mission Intelligence" / "Redefining Urban Mobility"
over-the-top phrasing to plain copy consistent with Hero/Services tone.

**AdminDashboard** (`pages/Admin/AdminDashboard.jsx`) / **BusinessDashboard**
(`pages/Dashboard/BusinessDashboard.jsx`): sidebar active/inactive restyle (see
above), stat tiles → `StatCard`, tables restyled with `hairline` row borders
instead of heavy contrast, action icon-buttons restyled with navy hover states,
modals (business setup / add slots / edit profile) restyled with the updated
`Input`/`Button`. Copy: "ADMIN.CENTRAL" → "Admin", "PARK-EASE.MGR" → "ParkEase"
(matches the wordmark used in Header/Footer/MobileMenu), "System is healthy and
synchronized" → "All systems normal."

## Tailwind config

Once no page references `brand.*` / `primary.*` tokens, remove those unused color
entries from `tailwind.config.js` for cleanliness. Confirm with a repo-wide search
before removing — do this last, after all pages are converted.

## Testing / verification

- `npm run test` (vitest) — existing suites for Header, Footer, MobileMenu,
  Reveal, TextReveal, homeContent, tailwindTokens should keep passing unchanged;
  `tailwindTokens.test.js` only asserts on tokens we're keeping.
- `npm run lint`.
- Manual click-through in the dev server: Register → Login → Home search →
  BusinessDetails booking → Profile → checkout flow → BookingSuccess, plus both
  AdminDashboard and BusinessDashboard (business setup modal included).
