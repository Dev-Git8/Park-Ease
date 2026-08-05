# Sitewide Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reskin every page (auth, dashboards, booking flow, about) onto the landing page's navy/ink/surface editorial design language, drop dark mode, and simplify the navbar — no feature/flow/route/API changes.

**Architecture:** Retheme the three shared UI atoms (`Button`, `Badge`, `Input`) and add one new atom (`StatCard`) on the existing token set, then rewrite each page's JSX on top of those atoms, one page per task. Theme removal (`ThemeContext`) and the navbar restructure are their own tasks since they touch shared infrastructure other tasks don't depend on.

**Tech Stack:** React 19, Tailwind CSS (existing `navy`/`ink`/`surface`/`hairline` tokens in `tailwind.config.js`), `lucide-react` icons, `framer-motion`, Vitest + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-05-sitewide-redesign-design.md`

## Global Constraints

- No feature, flow, route, or API change anywhere in this plan — every step is a JSX/className/copy change only. Do not touch any `api.*` call, `useEffect` data-fetching logic, prop contract, or route definition.
- Dark mode is being removed, not extended: delete `src/context/ThemeContext.jsx`, remove `ThemeProvider` from `App.jsx`, remove the theme toggle from `Header.jsx`, and remove every Tailwind `dark:*` className in the files this plan touches.
- **Exception:** `src/components/ui/Eyebrow.jsx` contains a `TEXT_TONES = { dark: 'text-ink-soft', light: ... }` object — that `dark:` is a JS object key for a `tone` prop, not a Tailwind dark-mode class. Do not touch `Eyebrow.jsx`, it is not part of this redesign.
- Use only the existing design tokens already defined in `tailwind.config.js`: colors `navy` / `navy-deep` / `navy-light`, `harbor`, `surface` / `surface-card`, `ink` / `ink-soft`, `ghost`, `hairline`, `background`; radii `card`, `card-lg`, `pill`. Do not invent new colors.
- Radii: prefer `rounded-card`, `rounded-card-lg`, `rounded-pill` over one-off values like `rounded-[3rem]` used by the legacy pages.
- Typography: no `font-black`; use `font-medium` (default landing-page weight) or `font-outfit` for numeric/heading emphasis. Copy is sentence case ("Welcome back"), not ALL-CAPS paragraphs — small tracked uppercase labels (`text-xs uppercase tracking-widest`) are fine, that's the landing page's existing eyebrow/caption convention.
- Pages with no pre-existing unit test (`Login`, `Register`, `Profile`, `BusinessDetails`, `CheckoutSummary`, `BookingSuccess`, `About`, `AdminDashboard`, `BusinessDashboard`) keep that convention — their tasks end with a manual dev-server check, not a fabricated RTL test, matching how this repo already treats those files.
- Every task's final steps are: run `npm run test`, confirm no regression, then commit.

---

### Task 1: Remove the dark-mode theme system

**Files:**
- Delete: `src/context/ThemeContext.jsx`
- Modify: `src/App.jsx`
- Modify: `src/components/layout/Header.jsx`
- Modify: `src/components/layout/Header.test.jsx`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `Header.jsx` no longer imports `useTheme`, `Moon`, or `Sun`. No other task depends on the theme system existing.

- [ ] **Step 1: Delete the theme context file**

```bash
git rm src/context/ThemeContext.jsx
```

- [ ] **Step 2: Remove `ThemeProvider` from `App.jsx`**

In `src/App.jsx`, remove the import line:

```js
import { ThemeProvider } from './context/ThemeContext';
```

Replace the `App` function body:

```jsx
function App() {
    return (
        <AuthProvider>
            <SocketProvider>
                <SiteUIProvider>
                    <Router>
                        <AppContent />
                    </Router>
                </SiteUIProvider>
            </SocketProvider>
        </AuthProvider>
    );
}
```

- [ ] **Step 3: Remove the theme toggle from `Header.jsx`**

In `src/components/layout/Header.jsx`, change the icon import line from:

```js
import { Car, LogOut, Menu, Moon, Sun, User } from 'lucide-react';
```

to:

```js
import { Car, LogOut, Menu, User } from 'lucide-react';
```

Remove the line:

```js
import { useTheme } from '../../context/ThemeContext';
```

Remove the line inside the `Header` component:

```js
const { theme, toggleTheme } = useTheme();
```

Remove this entire button block (it sits right before the "List Your Lot" button):

```jsx
<button
    type="button"
    onClick={toggleTheme}
    aria-label="Toggle theme"
    className="hidden h-10 w-10 place-items-center rounded-pill bg-white/15 backdrop-blur transition-colors hover:bg-white/25 sm:grid"
>
    {theme === 'light' ? <Moon className="h-4 w-4" aria-hidden="true" /> : <Sun className="h-4 w-4" aria-hidden="true" />}
</button>
```

- [ ] **Step 4: Remove the dead theme mock from `Header.test.jsx`**

In `src/components/layout/Header.test.jsx`, remove:

```js
const mockTheme = { theme: 'light', toggleTheme: vi.fn() };
```

and:

```js
vi.mock('../../context/ThemeContext', () => ({ useTheme: () => mockTheme }));
```

- [ ] **Step 5: Run the test suite**

Run: `npm run test`
Expected: all suites pass (Header's existing 5 tests still pass — none of them assert on the toggle).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: remove dark-mode theme system"
```

---

### Task 2: Retheme the `Button` atom

**Files:**
- Modify: `src/components/ui/Button.jsx`
- Create: `src/components/ui/Button.test.jsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `Button` variants `primary | secondary | accent | ghost | danger`, sizes `sm | md | lg | xl` — same prop names as before, new class values. Every later page task that renders `<Button variant="...">` must use one of these five variant names.

- [ ] **Step 1: Write the failing test**

Create `src/components/ui/Button.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';

describe('Button', () => {
    it('renders children and fires onClick', async () => {
        const onClick = vi.fn();
        render(<Button onClick={onClick}>Confirm</Button>);
        await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('applies the navy primary variant by default', () => {
        render(<Button>Confirm</Button>);
        expect(screen.getByRole('button', { name: 'Confirm' })).toHaveClass('bg-navy');
    });

    it('applies the secondary variant classes', () => {
        render(<Button variant="secondary">Cancel</Button>);
        expect(screen.getByRole('button', { name: 'Cancel' })).toHaveClass('border-hairline');
    });

    it('disables the button when disabled is true', () => {
        render(<Button disabled>Wait</Button>);
        expect(screen.getByRole('button', { name: 'Wait' })).toBeDisabled();
    });
});
```

- [ ] **Step 2: Run the test to see it fail**

Run: `npm run test -- Button.test`
Expected: FAIL on the `bg-navy` and `border-hairline` assertions (current `Button.jsx` uses `bg-brand-yellow` / `border-slate-100`).

- [ ] **Step 3: Rewrite `Button.jsx`**

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
    const baseStyles = "inline-flex items-center justify-center font-medium uppercase tracking-wide transition-colors duration-300 active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-navy text-white hover:bg-navy-deep",
        secondary: "bg-white text-ink border border-hairline hover:border-navy",
        accent: "bg-ink text-white hover:bg-navy-deep",
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

- [ ] **Step 4: Run the test to see it pass**

Run: `npm run test -- Button.test`
Expected: PASS (4/4).

- [ ] **Step 5: Run the full suite**

Run: `npm run test`
Expected: all suites pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/Button.jsx src/components/ui/Button.test.jsx
git commit -m "feat: retheme Button atom onto navy/ink tokens"
```

---

### Task 3: Retheme the `Badge` atom

**Files:**
- Modify: `src/components/ui/Badge.jsx`
- Create: `src/components/ui/Badge.test.jsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `Badge` variants `success | warning | danger | navy | accent | slate` (renamed from `brand` → `navy`). Every later page task that renders `<Badge variant="brand">` must be updated to `<Badge variant="navy">`.

- [ ] **Step 1: Write the failing test**

Create `src/components/ui/Badge.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from './Badge';

describe('Badge', () => {
    it('renders its label', () => {
        render(<Badge>Active</Badge>);
        expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('applies the navy variant classes', () => {
        render(<Badge variant="navy">Featured</Badge>);
        expect(screen.getByText('Featured')).toHaveClass('bg-navy');
    });

    it('defaults to the slate variant', () => {
        render(<Badge>Pending</Badge>);
        expect(screen.getByText('Pending')).toHaveClass('bg-surface');
    });
});
```

- [ ] **Step 2: Run the test to see it fail**

Run: `npm run test -- Badge.test`
Expected: FAIL (`variant="navy"` doesn't exist yet; default `slate` renders `bg-slate-100`, not `bg-surface`).

- [ ] **Step 3: Rewrite `Badge.jsx`**

```jsx
import React from 'react';

const Badge = ({ children, variant = 'slate', className = '' }) => {
    const variants = {
        success: "bg-emerald-50 text-emerald-600",
        warning: "bg-amber-50 text-amber-600",
        danger: "bg-red-50 text-red-600",
        navy: "bg-navy text-white",
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

- [ ] **Step 4: Run the test to see it pass**

Run: `npm run test -- Badge.test`
Expected: PASS (3/3).

- [ ] **Step 5: Run the full suite**

Run: `npm run test`
Expected: all suites pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/Badge.jsx src/components/ui/Badge.test.jsx
git commit -m "feat: retheme Badge atom onto navy/ink tokens"
```

---

### Task 4: Retheme the `Input` atom

**Files:**
- Modify: `src/components/ui/Input.jsx`
- Create: `src/components/ui/Input.test.jsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `Input` keeps the exact same props (`label`, `icon`, `error`, `className`, and passthrough `...props`) — no caller needs to change how it invokes `Input`.

- [ ] **Step 1: Write the failing test**

Create `src/components/ui/Input.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Mail } from 'lucide-react';
import Input from './Input';

describe('Input', () => {
    it('renders a label and forwards props to the input', () => {
        render(<Input label="Email" name="email" placeholder="you@email.com" icon={Mail} />);
        expect(screen.getByText('Email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('you@email.com')).toBeInTheDocument();
    });

    it('shows an error message when error is set', () => {
        render(<Input label="Email" error="Email is required" />);
        expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    it('applies the hairline border by default', () => {
        render(<Input label="Email" name="email" placeholder="you@email.com" />);
        expect(screen.getByPlaceholderText('you@email.com')).toHaveClass('border-hairline');
    });
});
```

- [ ] **Step 2: Run the test to see it fail**

Run: `npm run test -- Input.test`
Expected: FAIL on the `border-hairline` assertion (current `Input.jsx` uses `border-slate-50`).

- [ ] **Step 3: Rewrite `Input.jsx`**

```jsx
import React from 'react';

const Input = ({ label, icon: Icon, error, className = '', ...props }) => {
    return (
        <div className={`space-y-2 ${className}`}>
            {label && (
                <label className="block px-1 text-xs font-medium uppercase tracking-[0.18em] text-ink-soft">
                    {label}
                </label>
            )}
            <div className="relative group">
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
            </div>
            {error && (
                <p className="mt-2 px-1 text-xs font-medium text-red-500">{error}</p>
            )}
        </div>
    );
};

export default Input;
```

- [ ] **Step 4: Run the test to see it pass**

Run: `npm run test -- Input.test`
Expected: PASS (3/3).

- [ ] **Step 5: Run the full suite**

Run: `npm run test`
Expected: all suites pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/Input.jsx src/components/ui/Input.test.jsx
git commit -m "feat: retheme Input atom onto navy/ink tokens"
```

---

### Task 5: Add the `StatCard` atom

**Files:**
- Create: `src/components/ui/StatCard.jsx`
- Create: `src/components/ui/StatCard.test.jsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `StatCard({ label, value, icon?, tone = 'light' | 'dark', className? })`. Tasks 9 (Profile), 14 (AdminDashboard), and 15 (BusinessDashboard) render this instead of their hand-rolled stat tiles.

- [ ] **Step 1: Write the failing test**

Create `src/components/ui/StatCard.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Users } from 'lucide-react';
import StatCard from './StatCard';

describe('StatCard', () => {
    it('renders the label and value', () => {
        render(<StatCard label="Total bookings" value="42" />);
        expect(screen.getByText('Total bookings')).toBeInTheDocument();
        expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders an optional icon', () => {
        render(<StatCard label="Users" value="10" icon={Users} />);
        expect(document.querySelector('svg')).toBeInTheDocument();
    });

    it('applies the dark tone background', () => {
        render(<StatCard label="Users" value="10" tone="dark" />);
        expect(screen.getByText('Users').closest('div.rounded-card')).toHaveClass('bg-navy-deep');
    });
});
```

- [ ] **Step 2: Run the test to see it fail**

Run: `npm run test -- StatCard.test`
Expected: FAIL — `src/components/ui/StatCard.jsx` doesn't exist yet.

- [ ] **Step 3: Create `StatCard.jsx`**

```jsx
import React from 'react';

const StatCard = ({ label, value, icon: Icon, tone = 'light', className = '' }) => {
    const tones = {
        light: 'bg-white border border-hairline text-ink',
        dark: 'bg-navy-deep text-white',
    };

    return (
        <div className={`rounded-card p-6 ${tones[tone]} ${className}`}>
            {Icon && (
                <div className={`mb-4 grid h-10 w-10 place-items-center rounded-pill ${tone === 'dark' ? 'bg-white/10' : 'bg-surface'}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
            )}
            <p className={`text-xs font-medium uppercase tracking-[0.18em] ${tone === 'dark' ? 'text-white/60' : 'text-ink-soft'}`}>{label}</p>
            <p className="mt-1 font-outfit text-3xl font-medium tracking-tight">{value}</p>
        </div>
    );
};

export default StatCard;
```

- [ ] **Step 4: Run the test to see it pass**

Run: `npm run test -- StatCard.test`
Expected: PASS (3/3).

- [ ] **Step 5: Run the full suite**

Run: `npm run test`
Expected: all suites pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/StatCard.jsx src/components/ui/StatCard.test.jsx
git commit -m "feat: add StatCard atom for dashboard/profile stats"
```

---

### Task 6: Simplify the navbar (`Header.jsx`)

**Files:**
- Modify: `src/components/layout/Header.jsx`
- Modify: `src/components/layout/Header.test.jsx`

**Interfaces:**
- Consumes: `useAuth().user.role` (values `'admin' | 'business' | 'customer'`, unchanged from `AuthContext.jsx`).
- Produces: nothing new consumed elsewhere.

- [ ] **Step 1: Write the failing tests**

In `src/components/layout/Header.test.jsx`, add these three tests inside the existing `describe('Header', ...)` block:

```jsx
it('shows a role-based dashboard label for a business owner', () => {
    mockAuth.user = { name: 'Jamie Fox', role: 'business' };
    renderHeader();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    mockAuth.user = null;
});

it('shows My Bookings for a customer', () => {
    mockAuth.user = { name: 'Jamie Fox', role: 'customer' };
    renderHeader();
    expect(screen.getByText('My Bookings')).toBeInTheDocument();
    mockAuth.user = null;
});

it('shows a labeled Log out button when logged in', () => {
    mockAuth.user = { name: 'Jamie Fox', role: 'customer' };
    renderHeader();
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
    mockAuth.user = null;
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `npm run test -- Header.test`
Expected: FAIL on the three new tests (`Dashboard` / `My Bookings` text and a named "Log out" button don't exist yet).

- [ ] **Step 3: Rewrite `Header.jsx`**

Replace the whole file with:

```jsx
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Car, LogOut, Menu, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSiteUI } from '../../context/SiteUIContext';
import { NAV_LINKS } from '../../data/homeContent';

const DASHBOARD_LABEL = { admin: 'Dashboard', business: 'Dashboard', customer: 'My Bookings' };
const DASHBOARD_PATH = { admin: '/admin', business: '/dashboard', customer: '/profile' };

const Header = () => {
    const { user, logout } = useAuth();
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
            <nav className="hidden flex-1 items-center gap-8 md:flex">
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
                    onClick={openContact}
                    className="hidden text-[11px] font-medium uppercase tracking-widest underline-offset-4 hover:underline md:inline"
                >
                    List Your Lot
                </button>

                {user ? (
                    <Link to={DASHBOARD_PATH[user.role] ?? '/profile'} className="hidden items-center gap-2 md:flex">
                        <User className="h-4 w-4" aria-hidden="true" />
                        <span className="flex flex-col text-left leading-tight">
                            <span className="text-[11px] font-medium uppercase tracking-widest">{user.name}</span>
                            <span className="text-[9px] uppercase tracking-widest text-white/60">{DASHBOARD_LABEL[user.role] ?? 'My Bookings'}</span>
                        </span>
                    </Link>
                ) : (
                    <Link to="/login" className="hidden text-[11px] font-medium uppercase tracking-widest underline-offset-4 hover:underline md:inline">
                        Sign In
                    </Link>
                )}

                {user && (
                    <button
                        type="button"
                        onClick={logout}
                        className="hidden items-center gap-2 text-[11px] font-medium uppercase tracking-widest hover:text-white/80 md:inline-flex"
                    >
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                        Log out
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

- [ ] **Step 4: Run the tests to see them pass**

Run: `npm run test -- Header.test`
Expected: PASS (8/8 — 5 existing + 3 new).

- [ ] **Step 5: Run the full suite**

Run: `npm run test`
Expected: all suites pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/Header.jsx src/components/layout/Header.test.jsx
git commit -m "feat: simplify navbar with labeled account/dashboard link and unified breakpoint"
```

---

### Task 7: Rebuild the Login page

**Files:**
- Modify: `src/pages/Login/Login.jsx`

**Interfaces:**
- Consumes: `Button` (Task 2), `Input` (Task 4), `useAuth().login(email, password)` (unchanged, returns the user object).
- Produces: nothing consumed elsewhere.

- [ ] **Step 1: Replace `Login.jsx`**

```jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, ArrowRight, Car } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await login(formData.email, formData.password);
            if (user.role === 'admin') navigate('/admin');
            else if (user.role === 'business') navigate('/dashboard');
            else navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || "We couldn't sign you in. Check your email and password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-surface p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="mb-10 text-center">
                    <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-card bg-navy">
                        <Car className="h-8 w-8 text-white" aria-hidden="true" />
                    </div>
                    <h1 className="font-outfit text-4xl font-medium tracking-tight text-ink">Welcome back</h1>
                    <p className="mt-2 text-sm text-ink-soft">Sign in to manage your bookings</p>
                </div>

                <div className="rounded-card-lg border border-hairline bg-white p-8 shadow-sm sm:p-10">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-3 text-center text-sm text-red-600"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="Email"
                            name="email"
                            type="email"
                            required
                            icon={Mail}
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@email.com"
                        />

                        <Input
                            label="Password"
                            name="password"
                            type="password"
                            required
                            icon={Lock}
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                        />

                        <Button type="submit" disabled={loading} className="w-full" size="lg">
                            {loading ? (
                                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            ) : (
                                <>
                                    <span>Sign in</span>
                                    <ArrowRight className="ml-3 h-4 w-4" aria-hidden="true" />
                                </>
                            )}
                        </Button>
                    </form>

                    <p className="mt-8 text-center text-sm text-ink-soft">
                        New to ParkEase?
                        <Link to="/register" className="ml-2 font-medium text-navy hover:underline">Create an account</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
```

- [ ] **Step 2: Run the full suite**

Run: `npm run test`
Expected: all suites pass (no test file covers `Login.jsx` directly).

- [ ] **Step 3: Manually verify in the dev server**

Run: `npm run dev`, open `/login`. Confirm: navy Car mark, "Welcome back" heading, form submits (try a known-bad credential to see the red error state), "Create an account" link goes to `/register`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Login/Login.jsx
git commit -m "feat: rebuild Login page onto landing-page design language"
```

---

### Task 8: Rebuild the Register page

**Files:**
- Modify: `src/pages/Register/Register.jsx`

**Interfaces:**
- Consumes: `Button` (Task 2), `Input` (Task 4), `useAuth().register(name, email, password, role)` (unchanged).
- Produces: nothing consumed elsewhere.

- [ ] **Step 1: Replace `Register.jsx`**

```jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Lock, ArrowRight, Car } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'customer'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(formData.name, formData.email, formData.password, formData.role);
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || "We couldn't create your account. Check your details and try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-surface p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl"
            >
                <div className="mb-10 text-center">
                    <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-card bg-navy">
                        <Car className="h-8 w-8 text-white" aria-hidden="true" />
                    </div>
                    <h1 className="font-outfit text-4xl font-medium tracking-tight text-ink">Create your account</h1>
                    <p className="mt-2 text-sm text-ink-soft">Join ParkEase to book or list parking</p>
                </div>

                <div className="rounded-card-lg border border-hairline bg-white p-8 shadow-sm sm:p-12">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mb-8 rounded-2xl border border-red-100 bg-red-50 px-5 py-3 text-center text-sm text-red-600"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <Input
                                label="Full name"
                                name="name"
                                type="text"
                                required
                                icon={User}
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Jamie Fox"
                            />

                            <Input
                                label="Email"
                                name="email"
                                type="email"
                                required
                                icon={Mail}
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="you@email.com"
                            />
                        </div>

                        <Input
                            label="Password"
                            name="password"
                            type="password"
                            required
                            icon={Lock}
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                        />

                        <div className="space-y-3">
                            <label className="block px-1 text-xs font-medium uppercase tracking-[0.18em] text-ink-soft">
                                I&apos;m signing up as a
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'customer' })}
                                    className={`flex flex-col items-center gap-2 rounded-2xl border py-5 transition-colors ${
                                        formData.role === 'customer'
                                            ? 'border-navy bg-navy text-white'
                                            : 'border-hairline bg-surface text-ink-soft hover:border-navy'
                                    }`}
                                >
                                    <User className="h-5 w-5" aria-hidden="true" />
                                    <span className="text-xs font-medium uppercase tracking-wide">Driver</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'business' })}
                                    className={`flex flex-col items-center gap-2 rounded-2xl border py-5 transition-colors ${
                                        formData.role === 'business'
                                            ? 'border-navy bg-navy text-white'
                                            : 'border-hairline bg-surface text-ink-soft hover:border-navy'
                                    }`}
                                >
                                    <Car className="h-5 w-5" aria-hidden="true" />
                                    <span className="text-xs font-medium uppercase tracking-wide">Lot owner</span>
                                </button>
                            </div>
                        </div>

                        <Button type="submit" disabled={loading} className="w-full" size="lg">
                            {loading ? (
                                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            ) : (
                                <>
                                    <span>Create account</span>
                                    <ArrowRight className="ml-3 h-4 w-4" aria-hidden="true" />
                                </>
                            )}
                        </Button>
                    </form>

                    <p className="mt-10 text-center text-sm text-ink-soft">
                        Already have an account?
                        <Link to="/login" className="ml-2 font-medium text-navy hover:underline">Sign in</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
```

- [ ] **Step 2: Run the full suite**

Run: `npm run test`
Expected: all suites pass.

- [ ] **Step 3: Manually verify in the dev server**

Run: `npm run dev`, open `/register`. Confirm: role picker toggles the navy selected state, form submits and redirects to `/login`, "Sign in" link works.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Register/Register.jsx
git commit -m "feat: rebuild Register page onto landing-page design language"
```

---

### Task 9: Rebuild the Profile page

**Files:**
- Modify: `src/pages/Profile/Profile.jsx`

**Interfaces:**
- Consumes: `Badge` (Task 3, note `variant="navy"` not `"brand"`), `StatCard` (Task 5).
- Produces: nothing consumed elsewhere.

- [ ] **Step 1: Replace `Profile.jsx`**

```jsx
import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { Calendar, MapPin, Car, Trash2, LogOut, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Badge from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const { data } = await api.get('/bookings/my');
                setBookings(data.data);
            } catch (error) {
                console.error('Error fetching bookings', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

    const handleCancel = async (bookingId) => {
        if (!window.confirm('Cancel this reservation? This can only be done before the start time.')) return;
        try {
            await api.put(`/bookings/${bookingId}/cancel`);
            setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
        } catch (error) {
            alert(error.response?.data?.message || 'Cancellation failed');
        }
    };

    const handleCheckout = async (bookingId) => {
        try {
            const { data } = await api.put(`/bookings/${bookingId}/terminate`);
            navigate('/checkout-summary', { state: { booking: data.data } });
        } catch (error) {
            console.error('Termination failed', error);
            alert(error.response?.data?.message || 'Checkout failed');
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'booked': return <Badge variant="success">Active booking</Badge>;
            case 'overdue': return <Badge variant="danger" className="animate-pulse">Overstay</Badge>;
            case 'completed': return <Badge variant="success">Completed</Badge>;
            case 'cancelled': return <Badge variant="slate">Cancelled</Badge>;
            default: return <Badge variant="slate">{status}</Badge>;
        }
    };

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-surface">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-navy/30 border-t-navy" />
        </div>
    );

    return (
        <div className="min-h-screen bg-surface px-6 py-16">
            <div className="mx-auto max-w-6xl space-y-12">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="text-xs font-medium uppercase tracking-[0.22em] text-ink-soft">Your account</p>
                    <h1 className="mt-2 font-outfit text-4xl font-medium tracking-tight text-ink sm:text-5xl">{user?.name}</h1>
                    <p className="mt-2 text-sm text-ink-soft">{user?.email}</p>
                </motion.div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
                    <div className="lg:col-span-1">
                        <StatCard label="Total bookings" value={bookings.length} icon={Calendar} tone="dark" />
                    </div>

                    <div className="space-y-6 lg:col-span-3">
                        <h2 className="font-outfit text-2xl font-medium tracking-tight text-ink">Booking history</h2>

                        {bookings.length === 0 ? (
                            <div className="rounded-card border border-hairline bg-white py-16 text-center">
                                <Car className="mx-auto mb-4 h-10 w-10 text-ghost" aria-hidden="true" />
                                <p className="text-sm text-ink-soft">No bookings yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {bookings.map((booking) => (
                                    <motion.div
                                        key={booking.id}
                                        className="flex flex-col gap-6 rounded-card border border-hairline bg-white p-6 md:flex-row md:items-center"
                                    >
                                        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-surface">
                                            <Car size={28} className="text-ink-soft" aria-hidden="true" />
                                        </div>

                                        <div className="flex-1">
                                            <div className="mb-2 flex items-center gap-3">
                                                {getStatusBadge(booking.status)}
                                                <span className="text-xs text-ink-soft">Booking #{booking.id}</span>
                                            </div>
                                            <h4 className="font-outfit text-lg font-medium text-ink">{booking.business?.name || 'Unknown location'}</h4>
                                            <p className="flex items-center gap-2 text-sm text-ink-soft">
                                                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                                                Slot {booking.slot?.slotNumber || '—'} · {new Date(booking.startTime).toLocaleString()}
                                            </p>
                                        </div>

                                        <div className="flex flex-row items-center gap-4 md:flex-col md:items-end">
                                            <div className="text-right">
                                                <p className="font-outfit text-xl font-medium text-ink">${booking.totalPrice}</p>
                                                {booking.penaltyAmount > 0 && <p className="text-xs text-red-500">+ ${booking.penaltyAmount} penalty</p>}
                                            </div>

                                            {(booking.status === 'booked' || booking.status === 'overdue') && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleCheckout(booking.id)}
                                                        className="flex items-center gap-2 rounded-pill bg-navy px-4 py-2 text-xs font-medium uppercase tracking-wide text-white hover:bg-navy-deep"
                                                    >
                                                        <LogOut size={14} aria-hidden="true" /> Check out
                                                    </button>
                                                    <button
                                                        onClick={() => handleCancel(booking.id)}
                                                        className="rounded-pill bg-surface p-2 text-ink-soft hover:bg-red-500 hover:text-white"
                                                        aria-label="Cancel booking"
                                                    >
                                                        <Trash2 size={16} aria-hidden="true" />
                                                    </button>
                                                </div>
                                            )}
                                            {booking.status === 'completed' && (
                                                <div className="flex items-center gap-2 text-emerald-600">
                                                    <CheckCircle2 size={16} aria-hidden="true" />
                                                    <span className="text-xs font-medium uppercase tracking-wide">Settled</span>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
```

- [ ] **Step 2: Run the full suite**

Run: `npm run test`
Expected: all suites pass.

- [ ] **Step 3: Manually verify in the dev server**

Run: `npm run dev`, log in as a customer, open `/profile`. Confirm: navy stat card, booking rows show correct status badges, "Check out" and cancel actions still call the API (check network tab / existing backend behavior is unchanged).

- [ ] **Step 4: Commit**

```bash
git add src/pages/Profile/Profile.jsx
git commit -m "feat: rebuild Profile page onto landing-page design language"
```

---

### Task 10: Rebuild the BusinessDetails page

**Files:**
- Modify: `src/pages/Home/BusinessDetails.jsx`

**Interfaces:**
- Consumes: `Button` (Task 2), `Badge` (Task 3, `variant="navy"`).
- Produces: nothing consumed elsewhere.

- [ ] **Step 1: Replace `BusinessDetails.jsx`**

```jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { useSocket } from '../../context/SocketContext';
import { MapPin, Clock, ShieldCheck, Car, ArrowLeft, CheckCircle2, Info, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

const BusinessDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [business, setBusiness] = useState(null);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [bookingLoading, setBookingLoading] = useState(false);
    const socket = useSocket();

    const [duration, setDuration] = useState(60);
    const [arrivalTime, setArrivalTime] = useState('');

    const fetchSlots = async () => {
        try {
            const slotsRes = await api.get(`/slots/${id}`);
            setSlots(slotsRes.data.data);

            setSelectedSlot(prev => {
                const refreshed = slotsRes.data.data.find(s => s.id === prev?.id);
                return refreshed?.isAvailable ? refreshed : null;
            });
        } catch (error) {
            console.error('Error fetching slots', error);
        }
    };

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const bizRes = await api.get(`/business/${id}`);
                setBusiness(bizRes.data.data);

                await fetchSlots();

                const now = new Date();
                const offset = now.getTimezoneOffset() * 60000;
                const localISOTime = (new Date(now - offset)).toISOString().slice(0, 16);
                setArrivalTime(localISOTime);

            } catch (error) {
                console.error('Error fetching details', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    useEffect(() => {
        if (!socket) return;

        socket.emit('joinBusinessRoom', id);

        socket.on('slotsUpdated', (data) => {
            if (data.businessId.toString() === id.toString()) {
                fetchSlots();
            }
        });

        return () => {
            socket.emit('leaveBusinessRoom', id);
            socket.off('slotsUpdated');
        };
    }, [socket, id]);

    const handleBooking = async () => {
        if (!selectedSlot || !arrivalTime) return alert('Please choose an arrival time and a slot.');
        setBookingLoading(true);
        try {
            const startStr = new Date(arrivalTime);
            const startTime = startStr.toISOString();

            const endStr = new Date(startStr);
            endStr.setMinutes(endStr.getMinutes() + parseInt(duration));
            const endTime = endStr.toISOString();

            const totalPrice = (business.pricePerHour / 60) * parseInt(duration);

            await api.post('/bookings', {
                businessId: business.id,
                slotId: selectedSlot.id,
                startTime,
                endTime,
                totalPrice: parseFloat(totalPrice.toFixed(2))
            });
            navigate('/profile');
        } catch (error) {
            alert(error.response?.data?.message || 'Booking failed');
        } finally {
            setBookingLoading(false);
        }
    };

    if (loading || !business) return (
        <div className="flex min-h-screen items-center justify-center bg-surface">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-navy/30 border-t-navy" />
        </div>
    );

    return (
        <div className="min-h-screen bg-surface pb-20">
            <div className="relative h-80 w-full overflow-hidden bg-navy-deep">
                {business.imageUrl && (
                    <img src={business.imageUrl} alt={business.name} className="absolute inset-0 h-full w-full object-cover opacity-50" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-navy-deep/20 to-transparent" />
            </div>

            <div className="mx-auto max-w-6xl px-6">
                <div className="-mt-24 space-y-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="grid h-11 w-11 place-items-center rounded-pill bg-white text-ink shadow-sm hover:bg-surface"
                        aria-label="Go back"
                    >
                        <ArrowLeft size={20} aria-hidden="true" />
                    </button>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                        <Badge variant="navy">Verified location</Badge>
                        <h1 className="font-outfit text-4xl font-medium tracking-tight text-ink sm:text-5xl">{business.name}</h1>
                        <p className="flex items-center gap-2 text-sm text-ink-soft">
                            <MapPin size={16} aria-hidden="true" />
                            {business.address}
                        </p>
                    </motion.div>
                </div>

                <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-3">
                    <div className="space-y-8 lg:col-span-2">
                        <div className="rounded-card-lg border border-hairline bg-white p-8">
                            <div className="mb-8 flex items-center justify-between">
                                <div>
                                    <h3 className="font-outfit text-2xl font-medium tracking-tight text-ink">Choose a slot</h3>
                                    <p className="mt-1 text-sm text-ink-soft">Pick any available space</p>
                                </div>
                                <div className="flex gap-4 text-xs text-ink-soft">
                                    <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full border border-hairline bg-surface" /> Free</span>
                                    <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-ink" /> Occupied</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5">
                                {slots.map((slot) => (
                                    <button
                                        key={slot.id}
                                        disabled={!slot.isAvailable}
                                        onClick={() => setSelectedSlot(slot)}
                                        className={`relative flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl transition-colors ${
                                            slot.isAvailable
                                                ? selectedSlot?.id === slot.id
                                                    ? 'bg-navy text-white'
                                                    : 'border border-hairline bg-surface text-ink-soft hover:border-navy'
                                                : 'cursor-not-allowed bg-ghost/40 text-ink-soft/50'
                                        }`}
                                    >
                                        <Car size={22} aria-hidden="true" />
                                        <span className="font-outfit text-sm font-medium uppercase">{slot.slotNumber}</span>
                                        {!slot.isAvailable && <XCircle size={12} className="absolute right-2 top-2" aria-hidden="true" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="rounded-card border border-hairline bg-white p-6">
                                <div className="mb-4 grid h-10 w-10 place-items-center rounded-pill bg-surface">
                                    <Clock className="h-5 w-5 text-navy" aria-hidden="true" />
                                </div>
                                <h4 className="font-outfit text-lg font-medium text-ink">Open 24/7</h4>
                                <p className="mt-1 text-sm text-ink-soft">Slots are available for booking at any time.</p>
                            </div>
                            <div className="rounded-card border border-hairline bg-white p-6">
                                <div className="mb-4 grid h-10 w-10 place-items-center rounded-pill bg-surface">
                                    <ShieldCheck className="h-5 w-5 text-navy" aria-hidden="true" />
                                </div>
                                <h4 className="font-outfit text-lg font-medium text-ink">Secure booking</h4>
                                <p className="mt-1 text-sm text-ink-soft">Payments are processed securely and monitored in real time.</p>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="sticky top-28 space-y-6">
                            <div className="rounded-card-lg bg-navy-deep p-8 text-white">
                                <h3 className="font-outfit text-xl font-medium tracking-tight">Booking summary</h3>

                                <div className="mt-6 space-y-4 border-b border-white/10 pb-6">
                                    <label className="block">
                                        <span className="text-xs uppercase tracking-widest text-white/60">Arrival time</span>
                                        <input
                                            type="datetime-local"
                                            value={arrivalTime}
                                            onChange={(e) => setArrivalTime(e.target.value)}
                                            className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white focus:border-navy-light focus:outline-none"
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="text-xs uppercase tracking-widest text-white/60">Stay duration</span>
                                        <select
                                            value={duration}
                                            onChange={(e) => setDuration(parseInt(e.target.value))}
                                            className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white focus:border-navy-light focus:outline-none"
                                        >
                                            <option value={5}>5 minutes</option>
                                            <option value={10}>10 minutes</option>
                                            <option value={15}>15 minutes</option>
                                            <option value={30}>30 minutes</option>
                                            <option value={45}>45 minutes</option>
                                            <option value={60}>1 hour</option>
                                            <option value={120}>2 hours</option>
                                            <option value={240}>4 hours</option>
                                            <option value={480}>8 hours</option>
                                            <option value={1440}>24 hours</option>
                                        </select>
                                    </label>
                                </div>

                                <div className="space-y-4 py-6">
                                    <div className="flex items-center justify-between text-sm text-white/70">
                                        <span>Hourly rate</span>
                                        <span className="font-outfit text-lg text-white">${business.pricePerHour}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-white/70">
                                        <span>Selected slot</span>
                                        <span className="font-outfit text-lg text-white">{selectedSlot ? selectedSlot.slotNumber : '—'}</span>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-white/10 pt-4 text-sm text-white/70">
                                        <span>Total</span>
                                        <span className="font-outfit text-3xl text-white">
                                            ${selectedSlot ? ((business.pricePerHour / 60) * duration).toFixed(2) : '0.00'}
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleBooking}
                                    disabled={!selectedSlot || bookingLoading}
                                    variant="secondary"
                                    size="lg"
                                    className="w-full"
                                >
                                    {bookingLoading ? (
                                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-navy/30 border-t-navy" />
                                    ) : (
                                        <>
                                            Confirm booking
                                            <CheckCircle2 size={18} className="ml-3" aria-hidden="true" />
                                        </>
                                    )}
                                </Button>
                            </div>

                            <div className="flex items-start gap-3 rounded-card border border-hairline bg-white p-5">
                                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-navy" aria-hidden="true" />
                                <p className="text-xs text-ink-soft">
                                    Booking is final. Cancellation is subject to the location&apos;s policy and space availability.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BusinessDetails;
```

- [ ] **Step 2: Run the full suite**

Run: `npm run test`
Expected: all suites pass.

- [ ] **Step 3: Manually verify in the dev server**

Run: `npm run dev`, open a business detail page from the Home listings. Confirm: slot grid selection turns navy, arrival time/duration inputs work, total price updates live, "Confirm booking" navigates to `/profile` after a successful booking.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Home/BusinessDetails.jsx
git commit -m "feat: rebuild BusinessDetails page onto landing-page design language"
```

---

### Task 11: Rebuild the CheckoutSummary page

**Files:**
- Modify: `src/pages/CheckoutSummary.jsx`

**Interfaces:**
- Consumes: `Button` (Task 2), `Badge` (Task 3, `variant="navy"`).
- Produces: nothing consumed elsewhere.

- [ ] **Step 1: Replace `CheckoutSummary.jsx`**

```jsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, AlertTriangle, CheckCircle, ArrowRight, Home } from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

const CheckoutSummary = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { booking } = location.state || {};
    const [isPaying, setIsPaying] = useState(false);
    const [paid, setPaid] = useState(false);

    if (!booking) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-surface">
                <div className="text-center">
                    <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-amber-500" aria-hidden="true" />
                    <h2 className="font-outfit text-2xl font-medium text-ink">No booking data found</h2>
                    <Button onClick={() => navigate('/profile')} className="mt-6">Return to profile</Button>
                </div>
            </div>
        );
    }

    const {
        id,
        start_time,
        end_time,
        actual_end_time,
        total_price,
        penalty_amount,
        business_name
    } = booking;

    const basePrice = parseFloat(total_price);
    const penalty = parseFloat(penalty_amount || 0);
    const finalTotal = basePrice + penalty;

    const scheduledEnd = new Date(end_time);
    const actualEnd = new Date(actual_end_time || new Date());
    const isOverdue = actualEnd > scheduledEnd;

    const handlePay = () => {
        setIsPaying(true);
        setTimeout(() => {
            setPaid(true);
            setIsPaying(false);
        }, 3000);
    };

    return (
        <div className="min-h-screen bg-surface px-6 py-20">
            <div className="mx-auto max-w-3xl">
                <AnimatePresence mode="wait">
                    {!paid ? (
                        <motion.div
                            key="billing"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="overflow-hidden rounded-card-lg border border-hairline bg-white"
                        >
                            <div className="relative bg-navy-deep p-8 text-white">
                                <Receipt className="absolute right-8 top-8 h-16 w-16 text-white/10" aria-hidden="true" />
                                <Badge variant="navy" className="mb-4">Parking receipt</Badge>
                                <h1 className="font-outfit text-3xl font-medium tracking-tight sm:text-4xl">Booking summary</h1>
                                <p className="mt-2 text-sm text-white/60">Booking #{id} · {business_name}</p>
                            </div>

                            <div className="space-y-10 p-8 sm:p-12">
                                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs uppercase tracking-widest text-ink-soft">Entry time</p>
                                            <p className="mt-1 font-outfit text-lg text-ink">
                                                {new Date(start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-widest text-ink-soft">Scheduled exit</p>
                                            <p className="mt-1 font-outfit text-lg text-ink">
                                                {new Date(end_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs uppercase tracking-widest text-ink-soft">Actual exit</p>
                                            <p className="mt-1 font-outfit text-lg text-emerald-600">
                                                {new Date(actual_end_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                            </p>
                                        </div>
                                        {isOverdue && (
                                            <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
                                                <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-red-500" aria-hidden="true" />
                                                <div>
                                                    <p className="text-sm font-medium text-red-600">Overstay detected</p>
                                                    <p className="text-xs text-red-500/80">A penalty has been applied to this booking.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4 border-t border-dashed border-hairline pt-8">
                                    <div className="flex items-center justify-between text-sm text-ink-soft">
                                        <span>Base parking fee</span>
                                        <span className="font-outfit text-lg text-ink">${basePrice.toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-red-500">Overstay penalty</span>
                                        <span className="font-outfit text-lg text-red-500">${penalty.toFixed(2)}</span>
                                    </div>
                                    <div className="mt-6 flex items-end justify-between rounded-card bg-surface p-6">
                                        <div>
                                            <p className="text-xs uppercase tracking-widest text-ink-soft">Total due</p>
                                            <p className="font-outfit text-3xl text-ink">${finalTotal.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <Button className="w-full" size="lg" onClick={handlePay} disabled={isPaying}>
                                        {isPaying ? (
                                            <span className="flex items-center justify-center gap-3">
                                                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                                Processing payment…
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center gap-2">
                                                Pay now <ArrowRight size={18} aria-hidden="true" />
                                            </span>
                                        )}
                                    </Button>
                                    <p className="mt-4 text-center text-xs text-ink-soft">Secure transaction managed by ParkEase</p>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="rounded-card-lg border border-hairline bg-white p-16 text-center"
                        >
                            <div className="mx-auto mb-8 grid h-20 w-20 place-items-center rounded-card bg-emerald-500">
                                <CheckCircle size={40} className="text-white" aria-hidden="true" />
                            </div>
                            <Badge variant="success" className="mb-6">Payment received</Badge>
                            <h2 className="font-outfit text-4xl font-medium tracking-tight text-ink">Thank you</h2>
                            <p className="mx-auto mt-4 max-w-sm text-sm text-ink-soft">
                                Your booking is now complete. The parking spot has been released for the next driver.
                            </p>

                            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                                <Button variant="secondary" onClick={() => navigate('/')} className="w-full sm:w-auto">
                                    <Home className="mr-2" size={18} aria-hidden="true" /> Back to home
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default CheckoutSummary;
```

- [ ] **Step 2: Run the full suite**

Run: `npm run test`
Expected: all suites pass.

- [ ] **Step 3: Manually verify in the dev server**

Complete a checkout from `/profile` to reach this page with real booking state. Confirm the billing view and the post-payment success view both render correctly.

- [ ] **Step 4: Commit**

```bash
git add src/pages/CheckoutSummary.jsx
git commit -m "feat: rebuild CheckoutSummary page onto landing-page design language"
```

---

### Task 12: Rebuild the BookingSuccess page

**Files:**
- Modify: `src/pages/BookingSuccess/BookingSuccess.jsx`

**Interfaces:**
- Consumes: `Button` (Task 2).
- Produces: nothing consumed elsewhere.

- [ ] **Step 1: Replace `BookingSuccess.jsx`**

```jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import Button from '../../components/ui/Button';

const BookingSuccess = () => {
    return (
        <div className="flex min-h-screen items-center justify-center bg-surface p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="rounded-card-lg border border-hairline bg-white p-12 text-center">
                    <div className="relative mb-10 flex justify-center">
                        <motion.div
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
                            className="relative z-10 grid h-24 w-24 place-items-center rounded-card bg-navy"
                        >
                            <Check className="h-12 w-12 text-white" strokeWidth={3} aria-hidden="true" />
                        </motion.div>
                    </div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-4">
                        <h1 className="font-outfit text-4xl font-medium tracking-tight text-ink">You&apos;re booked</h1>
                        <p className="text-sm text-ink-soft">Your reservation is confirmed</p>

                        <div className="rounded-card border border-hairline bg-surface p-6">
                            <p className="text-sm text-ink-soft">
                                Your spot is reserved and ready. You can review the details any time from your account.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 pt-2">
                            <Link to="/profile">
                                <Button className="w-full" size="lg">
                                    <span>View my bookings</span>
                                    <ArrowRight className="ml-3 h-4 w-4" aria-hidden="true" />
                                </Button>
                            </Link>
                            <Link to="/">
                                <Button variant="ghost" className="w-full">Back to home</Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default BookingSuccess;
```

- [ ] **Step 2: Run the full suite**

Run: `npm run test`
Expected: all suites pass.

- [ ] **Step 3: Manually verify in the dev server**

Navigate to `/booking-success` directly (or via a real flow that routes here). Confirm the navy check mark and both links work.

- [ ] **Step 4: Commit**

```bash
git add src/pages/BookingSuccess/BookingSuccess.jsx
git commit -m "feat: rebuild BookingSuccess page onto landing-page design language"
```

---

### Task 13: Rebuild the About page

**Files:**
- Modify: `src/pages/About/About.jsx`

**Interfaces:**
- Consumes: `Button` (Task 2), `Eyebrow` (existing, unchanged).
- Produces: nothing consumed elsewhere.

- [ ] **Step 1: Replace `About.jsx`**

```jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Users, Car, MapPin } from 'lucide-react';
import Button from '../../components/ui/Button';
import Eyebrow from '../../components/ui/Eyebrow';

const About = () => {
    return (
        <div className="min-h-screen bg-white">
            <section className="mx-auto max-w-6xl px-6 py-24 md:py-32">
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
                    <Eyebrow>Our mission</Eyebrow>
                    <h1 className="mt-4 font-outfit text-6xl font-medium tracking-tight text-ink md:text-7xl">
                        Making city parking simple
                    </h1>
                    <p className="mt-8 max-w-2xl text-lg text-ink-soft">
                        We&apos;re building a smarter way to find, book, and manage parking — connecting drivers with
                        trusted locations through a fast, dependable network.
                    </p>
                    <div className="mt-10 flex flex-wrap gap-4">
                        <Button size="lg">Our vision</Button>
                        <Button variant="secondary" size="lg">Contact us</Button>
                    </div>
                </motion.div>
            </section>

            <section className="mx-6 mb-24 overflow-hidden rounded-card-lg bg-navy-deep py-24 text-white">
                <div className="mx-auto max-w-6xl px-10">
                    <div className="grid grid-cols-1 gap-16 md:grid-cols-3">
                        {[
                            { icon: Zap, title: 'Speed', desc: 'Real-time availability across the network, so bookings never lag behind reality.' },
                            { icon: Shield, title: 'Trust', desc: 'Every location is verified, and every transaction is protected.' },
                            { icon: Users, title: 'Community', desc: 'A growing network of drivers and lot owners, connected through one simple app.' }
                        ].map((item, i) => (
                            <motion.div
                                key={item.title}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <div className="mb-6 grid h-14 w-14 place-items-center rounded-card border border-white/15 bg-white/10">
                                    <item.icon className="h-6 w-6" aria-hidden="true" />
                                </div>
                                <h3 className="font-outfit text-2xl font-medium tracking-tight">{item.title}</h3>
                                <p className="mt-3 text-white/70">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="mx-auto mb-32 max-w-6xl px-6 py-24">
                <div className="flex flex-col items-center gap-16 md:flex-row">
                    <div className="flex-1">
                        <h2 className="font-outfit text-4xl font-medium tracking-tight text-ink">Where we operate</h2>
                        <div className="mt-8 space-y-6">
                            {[
                                { label: 'Cities covered', value: '40+', icon: MapPin },
                                { label: 'Verified locations', value: '1,200+', icon: Users },
                                { label: 'Successful bookings', value: '2.4M+', icon: Shield }
                            ].map((stat) => (
                                <div key={stat.label} className="flex items-center gap-5">
                                    <div className="grid h-11 w-11 place-items-center rounded-card border border-hairline bg-surface">
                                        <stat.icon className="h-5 w-5 text-navy" aria-hidden="true" />
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-widest text-ink-soft">{stat.label}</p>
                                        <p className="font-outfit text-2xl font-medium text-ink">{stat.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 rounded-card-lg border border-hairline bg-surface p-10">
                        <div className="flex aspect-square flex-col items-center justify-center rounded-card bg-white p-10 text-center">
                            <div className="mb-6 grid h-20 w-20 place-items-center rounded-full bg-navy/10">
                                <Car className="h-10 w-10 text-navy" aria-hidden="true" />
                            </div>
                            <h4 className="font-outfit text-lg font-medium text-ink">List your lot</h4>
                            <p className="mt-2 text-sm text-ink-soft">Join the ParkEase network and start earning.</p>
                            <Button className="mt-6 w-full">Get started</Button>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="border-t border-hairline py-10 text-center">
                <p className="text-xs uppercase tracking-[0.3em] text-ink-soft">ParkEase © 2026</p>
            </footer>
        </div>
    );
};

export default About;
```

- [ ] **Step 2: Run the full suite**

Run: `npm run test`
Expected: all suites pass.

- [ ] **Step 3: Manually verify in the dev server**

Open `/about`. Confirm the navy values panel and stats/CTA section render correctly at desktop and mobile widths.

- [ ] **Step 4: Commit**

```bash
git add src/pages/About/About.jsx
git commit -m "feat: rebuild About page onto landing-page design language"
```

---

### Task 14: Rebuild the AdminDashboard page

**Files:**
- Modify: `src/pages/Admin/AdminDashboard.jsx`

**Interfaces:**
- Consumes: `Badge` (Task 3, `variant="navy"`), `Button` (Task 2), `StatCard` (Task 5).
- Produces: nothing consumed elsewhere.

- [ ] **Step 1: Replace `AdminDashboard.jsx`**

```jsx
import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import {
    ShieldCheck,
    Users,
    Building2,
    CheckCircle,
    XCircle,
    Clock,
    MoreHorizontal,
    LogOut,
    Bell,
    Search as SearchIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import StatCard from '../../components/ui/StatCard';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const [stats, setStats] = useState({ users: 0, businesses: 0, pending: 0 });
    const [businesses, setBusinesses] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('businesses');

    const fetchData = async () => {
        try {
            const [bizRes, usersRes] = await Promise.all([
                api.get('/admin/businesses'),
                api.get('/admin/users')
            ]);
            setBusinesses(bizRes.data.data);
            setUsers(usersRes.data.data);

            setStats({
                users: usersRes.data.data.length,
                businesses: bizRes.data.data.length,
                pending: bizRes.data.data.filter(b => b.status === 'pending').length
            });
        } catch (error) {
            console.error('Error fetching admin data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleStatusUpdate = async (id, status) => {
        try {
            await api.put(`/admin/businesses/${id}/status`, { status });
            fetchData();
        } catch {
            alert('Failed to update status');
        }
    };

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-surface">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-navy/30 border-t-navy" />
        </div>
    );

    const SidebarItem = ({ icon: Icon, label, id }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex w-full items-center gap-4 rounded-2xl px-6 py-4 transition-colors ${
                activeTab === id ? 'bg-navy text-white' : 'text-ink-soft hover:bg-surface hover:text-ink'
            }`}
        >
            <Icon size={20} aria-hidden="true" />
            <span className="text-xs font-medium uppercase tracking-[0.18em]">{label}</span>
        </button>
    );

    return (
        <div className="flex min-h-screen bg-surface">
            <aside className="sticky top-0 flex h-screen w-72 flex-col justify-between border-r border-hairline bg-white p-8">
                <div className="space-y-10">
                    <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-card bg-navy text-white">
                            <ShieldCheck size={22} aria-hidden="true" />
                        </div>
                        <span className="font-outfit text-lg font-medium tracking-tight text-ink">Admin</span>
                    </div>

                    <div className="space-y-2">
                        <SidebarItem icon={Building2} label="Parking locations" id="businesses" />
                        <SidebarItem icon={Users} label="User accounts" id="users" />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="rounded-card border border-hairline bg-surface p-5">
                        <div className="flex items-center gap-3">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-xs font-medium uppercase tracking-wide text-ink-soft">All systems normal</span>
                        </div>
                    </div>
                    <button onClick={logout} className="flex w-full items-center gap-3 px-2 py-3 text-ink-soft hover:text-red-500">
                        <LogOut size={18} aria-hidden="true" />
                        <span className="text-xs font-medium uppercase tracking-wide">Log out</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto p-10">
                <header className="mb-12 flex items-center justify-between">
                    <div>
                        <h1 className="font-outfit text-3xl font-medium tracking-tight text-ink">Admin dashboard</h1>
                        <p className="mt-1 text-sm text-ink-soft">Manage locations and accounts</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <button className="grid h-11 w-11 place-items-center rounded-card border border-hairline bg-white text-ink-soft hover:text-navy">
                                <Bell size={18} aria-hidden="true" />
                            </button>
                            {stats.pending > 0 && <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" />}
                        </div>
                        <div className="grid h-11 w-11 place-items-center rounded-card border border-hairline bg-white font-outfit font-medium text-ink">
                            {user.name.charAt(0)}
                        </div>
                    </div>
                </header>

                <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
                    <StatCard label="Total users" value={stats.users} icon={Users} />
                    <StatCard label="Registered businesses" value={stats.businesses} icon={Building2} />
                    <StatCard label="Pending approvals" value={stats.pending} icon={Clock} />
                </div>

                <div className="overflow-hidden rounded-card-lg border border-hairline bg-white">
                    <div className="flex items-center justify-between border-b border-hairline p-6">
                        <h3 className="font-outfit text-xl font-medium capitalize tracking-tight text-ink">{activeTab}</h3>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <SearchIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
                                <input placeholder="Search records…" className="rounded-pill border border-hairline bg-surface py-2.5 pl-10 pr-5 text-xs text-ink focus:border-navy-light focus:outline-none" />
                            </div>
                            <Button variant="secondary" size="sm">Export</Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {activeTab === 'businesses' ? (
                            <table className="w-full text-left">
                                <thead className="bg-surface">
                                    <tr>
                                        <th className="px-8 py-4 text-xs font-medium uppercase tracking-wide text-ink-soft">Location</th>
                                        <th className="px-8 py-4 text-xs font-medium uppercase tracking-wide text-ink-soft">Rate</th>
                                        <th className="px-8 py-4 text-center text-xs font-medium uppercase tracking-wide text-ink-soft">Status</th>
                                        <th className="px-8 py-4 text-right text-xs font-medium uppercase tracking-wide text-ink-soft">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-hairline">
                                    {businesses.map((biz) => (
                                        <tr key={biz.id} className="hover:bg-surface/60">
                                            <td className="px-8 py-6">
                                                <div className="font-outfit text-lg font-medium text-ink">{biz.name}</div>
                                                <div className="mt-1 flex items-center gap-1 text-xs text-ink-soft">
                                                    <Building2 className="h-3 w-3" aria-hidden="true" />
                                                    {biz.address}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="font-outfit text-base text-ink">${biz.pricePerHour}<span className="ml-1 text-xs text-ink-soft">/hr</span></div>
                                                <div className="mt-1 text-xs text-ink-soft">Owner: {biz.owner?.name || 'Unknown'}</div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <Badge variant={
                                                    biz.status === 'approved' ? 'success' :
                                                    biz.status === 'rejected' ? 'danger' :
                                                    'navy'
                                                }>
                                                    {biz.status}
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                {biz.status === 'pending' ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleStatusUpdate(biz.id, 'approved')}
                                                            className="grid h-9 w-9 place-items-center rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white"
                                                        >
                                                            <CheckCircle size={16} aria-hidden="true" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(biz.id, 'rejected')}
                                                            className="grid h-9 w-9 place-items-center rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white"
                                                        >
                                                            <XCircle size={16} aria-hidden="true" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button className="p-2 text-ink-soft hover:text-ink">
                                                        <MoreHorizontal size={18} aria-hidden="true" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-surface">
                                    <tr>
                                        <th className="px-8 py-4 text-xs font-medium uppercase tracking-wide text-ink-soft">User</th>
                                        <th className="px-8 py-4 text-xs font-medium uppercase tracking-wide text-ink-soft">Role</th>
                                        <th className="px-8 py-4 text-right text-xs font-medium uppercase tracking-wide text-ink-soft">Joined</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-hairline">
                                    {users.map((u) => (
                                        <tr key={u.id} className="hover:bg-surface/60">
                                            <td className="px-8 py-6">
                                                <div className="font-outfit text-lg font-medium text-ink">{u.name}</div>
                                                <div className="mt-1 text-xs text-ink-soft">{u.email}</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <Badge variant={
                                                    u.role === 'admin' ? 'navy' :
                                                    u.role === 'business' ? 'accent' :
                                                    'slate'
                                                }>
                                                    {u.role}
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-6 text-right text-sm text-ink-soft">
                                                {new Date(u.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
```

- [ ] **Step 2: Run the full suite**

Run: `npm run test`
Expected: all suites pass.

- [ ] **Step 3: Manually verify in the dev server**

Log in as an admin, open `/admin`. Confirm: sidebar tab switching works, stat cards render, approve/reject buttons on a pending business call the API and refresh the table, switching to the Users tab shows role badges.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Admin/AdminDashboard.jsx
git commit -m "feat: rebuild AdminDashboard page onto landing-page design language"
```

---

### Task 15: Rebuild the BusinessDashboard page

**Files:**
- Modify: `src/pages/Dashboard/BusinessDashboard.jsx`

**Interfaces:**
- Consumes: `Badge` (Task 3, `variant="navy"`), `Button` (Task 2), `Input` (Task 4), `StatCard` (Task 5).
- Produces: nothing consumed elsewhere.

- [ ] **Step 1: Replace `BusinessDashboard.jsx`**

```jsx
import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import {
    LayoutDashboard,
    Plus,
    Activity,
    Settings,
    LogOut,
    Car,
    ShieldCheck,
    MoreHorizontal,
    Search,
    Bell,
    X,
    Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import StatCard from '../../components/ui/StatCard';
import { motion, AnimatePresence } from 'framer-motion';

const BusinessDashboard = () => {
    const { logout } = useAuth();
    const [stats, setStats] = useState({ totalSlots: 0, activeBookings: 0, totalRevenue: 0 });
    const [slots, setSlots] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [business, setBusiness] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const socket = useSocket();

    const [showBusinessSetup, setShowBusinessSetup] = useState(false);
    const [showAddSlots, setShowAddSlots] = useState(false);

    const [bizForm, setBizForm] = useState({ name: '', address: '', totalSlots: 10, price: 5, image: null });
    const [slotForm, setSlotForm] = useState({ prefix: 'A', count: 5 });
    const [showEditBusiness, setShowEditBusiness] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', address: '', price: 0, image: null });
    const [actionLoading, setActionLoading] = useState(false);

    const fetchSlotsAndBookings = async (bizId) => {
        try {
            const [slotsRes, bookingsRes] = await Promise.all([
                api.get(`/slots/${bizId}`),
                api.get(`/bookings/business/${bizId}`)
            ]);

            const fetchedSlots = slotsRes.data.data || [];
            const fetchedBookings = bookingsRes.data.data || [];

            setSlots(fetchedSlots);
            setBookings(fetchedBookings);

            setStats({
                totalSlots: fetchedSlots.length,
                activeBookings: fetchedBookings.filter(b => b.status === 'booked' || b.status === 'active').length,
                totalRevenue: fetchedBookings.reduce((acc, curr) => acc + (parseFloat(curr.totalPrice) || 0), 0)
            });
        } catch (error) {
            console.error('Error fetching slots and bookings', error);
        }
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const bizRes = await api.get('/business/my');
                const bizArray = bizRes.data.data;

                if (!bizArray || bizArray.length === 0) {
                    setShowBusinessSetup(true);
                    setLoading(false);
                    return;
                }

                const biz = bizArray[0];
                setBusiness(biz);

                await fetchSlotsAndBookings(biz.id);

            } catch (error) {
                console.error('Error fetching dashboard data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    useEffect(() => {
        if (!socket || !business) return;

        socket.emit('joinBusinessRoom', business.id);

        socket.on('slotsUpdated', (data) => {
            if (data.businessId.toString() === business.id.toString()) {
                fetchSlotsAndBookings(business.id);
            }
        });

        return () => {
            socket.emit('leaveBusinessRoom', business.id);
            socket.off('slotsUpdated');
        };
    }, [socket, business]);

    const handleRegisterBusiness = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', bizForm.name);
            formData.append('address', bizForm.address);
            formData.append('totalSlots', bizForm.totalSlots);
            formData.append('price', bizForm.price);
            if (bizForm.image) {
                formData.append('image', bizForm.image);
            }

            await api.post('/business/register', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setShowBusinessSetup(false);
            window.location.reload();
        } catch (err) {
            alert(err.response?.data?.message || 'Error registering business');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateBusiness = async (e) => {
        e.preventDefault();
        if (!business) return;
        setActionLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', editForm.name);
            formData.append('address', editForm.address);
            formData.append('price', editForm.price);
            if (editForm.image) {
                formData.append('image', editForm.image);
            }

            await api.put(`/business/${business.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setShowEditBusiness(false);
            window.location.reload();
        } catch (err) {
            alert(err.response?.data?.message || 'Error updating profile');
        } finally {
            setActionLoading(false);
        }
    };

    const openEditModal = () => {
        setEditForm({
            name: business.name,
            address: business.address,
            price: business.pricePerHour,
            image: null
        });
        setShowEditBusiness(true);
    };

    const handleAddSlots = async (e) => {
        e.preventDefault();
        if (!business) return;
        setActionLoading(true);
        try {
            const slotNumbers = [];
            for (let i = 1; i <= slotForm.count; i++) {
                slotNumbers.push(`${slotForm.prefix}${i}`);
            }

            await api.post('/slots', { businessId: business.id, slotNumbers });
            setShowAddSlots(false);
            window.location.reload();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add slots');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteSlot = async (slotId) => {
        if (!window.confirm('Are you sure you want to remove this parking slot? This action cannot be undone.')) return;

        try {
            await api.delete(`/slots/${slotId}`);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to remove slot');
        }
    };

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-surface">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-navy/30 border-t-navy" />
        </div>
    );

    const SidebarItem = ({ icon: Icon, label, id }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex w-full items-center gap-4 rounded-2xl px-6 py-4 transition-colors ${
                activeTab === id ? 'bg-navy text-white' : 'text-ink-soft hover:bg-surface hover:text-ink'
            }`}
        >
            <Icon size={20} aria-hidden="true" />
            <span className="text-xs font-medium uppercase tracking-[0.18em]">{label}</span>
        </button>
    );

    return (
        <div className="relative flex min-h-screen bg-surface">

            <AnimatePresence>
                {showBusinessSetup && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/60 p-6 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-xl rounded-card-lg bg-white p-10 sm:p-12"
                        >
                            <Badge variant="navy" className="mb-6">Action required</Badge>
                            <h2 className="font-outfit text-3xl font-medium tracking-tight text-ink">Set up your parking location</h2>
                            <p className="mt-3 text-sm text-ink-soft">
                                Before you can access the dashboard, tell us about your facility.
                            </p>

                            <form onSubmit={handleRegisterBusiness} className="mt-8 space-y-6">
                                <Input
                                    label="Facility name"
                                    name="name"
                                    required
                                    value={bizForm.name}
                                    onChange={(e) => setBizForm({...bizForm, name: e.target.value})}
                                    placeholder="Alpha Parking Center"
                                />
                                <Input
                                    label="Street address"
                                    name="address"
                                    required
                                    value={bizForm.address}
                                    onChange={(e) => setBizForm({...bizForm, address: e.target.value})}
                                    placeholder="123 Tech Blvd, Silicon City"
                                />
                                <div className="grid grid-cols-2 gap-6">
                                    <Input
                                        label="Total slots"
                                        name="totalSlots"
                                        type="number"
                                        required
                                        value={bizForm.totalSlots}
                                        onChange={(e) => setBizForm({...bizForm, totalSlots: parseInt(e.target.value)})}
                                    />
                                    <Input
                                        label="Hourly rate ($)"
                                        name="price"
                                        type="number"
                                        required
                                        value={bizForm.price}
                                        onChange={(e) => setBizForm({...bizForm, price: parseFloat(e.target.value)})}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block px-1 text-xs font-medium uppercase tracking-[0.18em] text-ink-soft">Photo</label>
                                    <div className="relative flex h-32 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-hairline hover:border-navy-light">
                                        {bizForm.image ? (
                                            <img src={URL.createObjectURL(bizForm.image)} className="h-full w-full object-cover" alt="Preview" />
                                        ) : (
                                            <>
                                                <Plus className="mb-2 text-ink-soft" size={22} aria-hidden="true" />
                                                <span className="text-xs text-ink-soft">Select a facility photo</span>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            className="absolute inset-0 cursor-pointer opacity-0"
                                            onChange={(e) => setBizForm({...bizForm, image: e.target.files[0]})}
                                            accept="image/*"
                                        />
                                    </div>
                                </div>

                                <Button type="submit" disabled={actionLoading} className="w-full">
                                    {actionLoading ? 'Saving…' : 'Create location'}
                                </Button>
                            </form>
                        </motion.div>
                    </div>
                )}

                {showAddSlots && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/60 p-6 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative w-full max-w-md rounded-card-lg bg-white p-10"
                        >
                            <button
                                onClick={() => setShowAddSlots(false)}
                                className="absolute right-8 top-8 text-ink-soft hover:text-ink"
                                aria-label="Close"
                            >
                                <X size={22} aria-hidden="true" />
                            </button>
                            <Badge variant="navy" className="mb-6">Scale your facility</Badge>
                            <h2 className="font-outfit text-2xl font-medium tracking-tight text-ink">Add new slots</h2>
                            <p className="mt-2 text-sm text-ink-soft">Generate a sequence of parking slot numbers.</p>

                            <form onSubmit={handleAddSlots} className="mt-8 space-y-6">
                                <Input
                                    label="Slot prefix"
                                    name="prefix"
                                    required
                                    value={slotForm.prefix}
                                    onChange={(e) => setSlotForm({...slotForm, prefix: e.target.value.toUpperCase()})}
                                    placeholder="A"
                                    maxLength={3}
                                />
                                <Input
                                    label="Number of slots"
                                    name="count"
                                    type="number"
                                    required
                                    min="1"
                                    max="50"
                                    value={slotForm.count}
                                    onChange={(e) => setSlotForm({...slotForm, count: parseInt(e.target.value)})}
                                />
                                <div className="rounded-card border border-hairline bg-surface p-4">
                                    <p className="text-xs uppercase tracking-widest text-ink-soft">Preview</p>
                                    <p className="mt-1 truncate font-outfit text-base text-ink">
                                        {slotForm.prefix}1, {slotForm.prefix}2 … {slotForm.prefix}{slotForm.count}
                                    </p>
                                </div>
                                <Button type="submit" disabled={actionLoading} className="w-full">
                                    {actionLoading ? 'Adding…' : 'Add slots'}
                                </Button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showEditBusiness && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/60 p-6 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="relative w-full max-w-xl rounded-card-lg bg-white p-10"
                        >
                            <button onClick={() => setShowEditBusiness(false)} className="absolute right-8 top-8 text-ink-soft hover:text-ink" aria-label="Close">
                                <X size={22} aria-hidden="true" />
                            </button>

                            <div className="mb-6 grid h-14 w-14 place-items-center rounded-card bg-surface">
                                <Settings className="text-navy" size={26} aria-hidden="true" />
                            </div>
                            <h2 className="font-outfit text-3xl font-medium tracking-tight text-ink">Manage profile</h2>
                            <p className="mt-2 text-sm text-ink-soft">Update your display info and parking rates</p>

                            <form onSubmit={handleUpdateBusiness} className="mt-8 space-y-6">
                                <Input
                                    label="Business name"
                                    name="name"
                                    required
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                />
                                <Input
                                    label="Street address"
                                    name="address"
                                    required
                                    value={editForm.address}
                                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                                />
                                <Input
                                    label="Hourly rate ($)"
                                    name="price"
                                    type="number"
                                    required
                                    value={editForm.price}
                                    onChange={(e) => setEditForm({...editForm, price: parseFloat(e.target.value)})}
                                />

                                <div className="space-y-2">
                                    <label className="block px-1 text-xs font-medium uppercase tracking-[0.18em] text-ink-soft">Photo</label>
                                    <div className="relative flex h-32 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-hairline hover:border-navy-light">
                                        {editForm.image ? (
                                            <img src={URL.createObjectURL(editForm.image)} className="h-full w-full object-cover" alt="Preview" />
                                        ) : business?.imageUrl ? (
                                            <img src={business.imageUrl} className="h-full w-full object-cover opacity-70" alt="Current" />
                                        ) : (
                                            <>
                                                <Plus className="mb-2 text-ink-soft" size={22} aria-hidden="true" />
                                                <span className="text-xs text-ink-soft">Replace current image</span>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            className="absolute inset-0 cursor-pointer opacity-0"
                                            onChange={(e) => setEditForm({...editForm, image: e.target.files[0]})}
                                            accept="image/*"
                                        />
                                    </div>
                                </div>

                                <Button type="submit" disabled={actionLoading} className="w-full">
                                    {actionLoading ? 'Saving…' : 'Save changes'}
                                </Button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <aside className="sticky top-0 flex h-screen w-72 flex-col justify-between border-r border-hairline bg-white p-8">
                <div className="space-y-10">
                    <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-card bg-navy text-white">
                            <Car size={22} aria-hidden="true" />
                        </div>
                        <span className="font-outfit text-lg font-medium tracking-tight text-ink">ParkEase</span>
                    </div>

                    <div className="space-y-2">
                        <SidebarItem icon={LayoutDashboard} label="Overview" id="overview" />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="rounded-card border border-hairline bg-surface p-5">
                        <div className="flex items-center gap-3">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-xs font-medium uppercase tracking-wide text-ink-soft">System online</span>
                        </div>
                    </div>
                    <button onClick={logout} className="flex w-full items-center gap-3 px-2 py-3 text-ink-soft hover:text-red-500">
                        <LogOut size={18} aria-hidden="true" />
                        <span className="text-xs font-medium uppercase tracking-wide">Log out</span>
                    </button>
                </div>
            </aside>

            <main className="z-0 flex-1 overflow-y-auto p-10">
                <header className="mb-12 flex items-center justify-between">
                    <div>
                        <h1 className="font-outfit text-3xl font-medium tracking-tight text-ink">Management console</h1>
                        <p className="mt-1 text-sm text-ink-soft">Business ID: {business?.id || 'Pending'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="grid h-11 w-11 place-items-center rounded-card border border-hairline bg-white text-ink-soft hover:text-navy">
                            <Bell size={18} aria-hidden="true" />
                        </button>
                        <Button variant="secondary" size="md" onClick={openEditModal}>
                            <Settings size={16} className="mr-2" aria-hidden="true" />
                            Manage profile
                        </Button>
                        <Button size="md" onClick={() => setShowAddSlots(true)}>
                            <Plus size={16} className="mr-2" aria-hidden="true" />
                            Add slots
                        </Button>
                    </div>
                </header>

                <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
                    <StatCard label="Total slots" value={stats.totalSlots} icon={Activity} />
                    <StatCard label="Active sessions" value={stats.activeBookings} icon={Activity} />
                    <StatCard label="Total earnings" value={`$${stats.totalRevenue.toFixed(2)}`} icon={ShieldCheck} tone="dark" />
                </div>

                <div className="overflow-hidden rounded-card-lg border border-hairline bg-white">
                    <div className="flex items-center justify-between border-b border-hairline p-6">
                        <div>
                            <h3 className="font-outfit text-xl font-medium tracking-tight text-ink">Slot management</h3>
                            <p className="mt-1 text-xs text-ink-soft">Live availability tracking</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
                                <input placeholder="Search slot #…" className="rounded-pill border border-hairline bg-surface py-2.5 pl-10 pr-5 text-xs text-ink focus:border-navy-light focus:outline-none" />
                            </div>
                            <Button variant="secondary" size="sm">Export data</Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-surface">
                                <tr>
                                    <th className="px-8 py-4 text-xs font-medium uppercase tracking-wide text-ink-soft">Slot #</th>
                                    <th className="px-8 py-4 text-xs font-medium uppercase tracking-wide text-ink-soft">Type</th>
                                    <th className="px-8 py-4 text-xs font-medium uppercase tracking-wide text-ink-soft">Status</th>
                                    <th className="px-8 py-4 text-xs font-medium uppercase tracking-wide text-ink-soft">Active booking</th>
                                    <th className="px-8 py-4 text-right text-xs font-medium uppercase tracking-wide text-ink-soft">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-hairline">
                                {slots.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-20 text-center">
                                            <Car size={28} className="mx-auto mb-4 text-ghost" aria-hidden="true" />
                                            <p className="text-sm text-ink-soft">No slots added yet. Click Add Slots.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    slots.map((slot) => (
                                        <tr key={slot.id} className="hover:bg-surface/60">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-surface">
                                                        <Car size={16} className="text-ink-soft" aria-hidden="true" />
                                                    </div>
                                                    <span className="font-outfit text-sm font-medium text-ink">#{slot.slotNumber}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <Badge variant="slate">Standard</Badge>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2">
                                                    <span className={`h-2 w-2 rounded-full ${slot.isAvailable ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                    <span className={`text-xs font-medium uppercase tracking-wide ${slot.isAvailable ? 'text-emerald-600' : 'text-red-500'}`}>
                                                        {slot.isAvailable ? 'Available' : 'Occupied'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                {(() => {
                                                    const active = bookings.find(b => b.slotId === slot.id && (b.status === 'booked' || b.status === 'overdue'));
                                                    if (!active) return <span className="text-sm text-ink-soft">—</span>;
                                                    const sTime = new Date(active.startTime);
                                                    const eTime = new Date(active.endTime);
                                                    const durationMs = eTime - sTime;
                                                    const durationMins = Math.round(durationMs / 60000);
                                                    const durationLabel = durationMins >= 60
                                                        ? `${(durationMins / 60).toFixed(durationMins % 60 === 0 ? 0 : 1)} hr${durationMins >= 120 ? 's' : ''}`
                                                        : `${durationMins} min${durationMins !== 1 ? 's' : ''}`;
                                                    return (
                                                        <div className="flex flex-col">
                                                            <span className="text-sm text-ink">
                                                                {sTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} – {eTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                            </span>
                                                            <span className="mt-1 text-xs text-navy">{active.status === 'overdue' ? 'Overdue' : `Booked for ${durationLabel}`}</span>
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleDeleteSlot(slot.id)}
                                                        disabled={!slot.isAvailable}
                                                        className={`p-2 ${slot.isAvailable ? 'text-ink-soft hover:text-red-500' : 'cursor-not-allowed text-ghost'}`}
                                                        title={slot.isAvailable ? 'Delete slot' : 'Cannot delete an occupied slot'}
                                                    >
                                                        <Trash2 size={16} aria-hidden="true" />
                                                    </button>
                                                    <button className="p-2 text-ink-soft hover:text-navy">
                                                        <MoreHorizontal size={18} aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default BusinessDashboard;
```

- [ ] **Step 2: Run the full suite**

Run: `npm run test`
Expected: all suites pass.

- [ ] **Step 3: Manually verify in the dev server**

Log in as a business owner. If no business exists yet, confirm the "Set up your parking location" modal appears and creating one reloads into the dashboard. Confirm "Add slots", "Manage profile", and deleting an available (not occupied) slot all work.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Dashboard/BusinessDashboard.jsx
git commit -m "feat: rebuild BusinessDashboard page onto landing-page design language"
```

---

### Task 16: Clean up unused Tailwind tokens and do a final full-repo verification

**Files:**
- Modify: `tailwind.config.js`

**Interfaces:**
- Consumes: nothing — this is the final cleanup/verification task, run after every other task is done.

- [ ] **Step 1: Confirm no dark-mode classes remain**

Run: `git grep -n "dark:" -- src`
Expected: the only match is `src/components/ui/Eyebrow.jsx`'s `TEXT_TONES = { dark: 'text-ink-soft', ... }` object key (not a Tailwind class — see Global Constraints). If any other file matches, that page's task was not fully applied; go back and fix it before continuing.

- [ ] **Step 2: Confirm no legacy brand/black classes remain**

Run: `git grep -n "brand-yellow\|brand-black\|brand-dark\|font-black" -- src`
Expected: no matches.

- [ ] **Step 3: Remove the unused `brand`/`primary` colors and `boxShadow` block from `tailwind.config.js`**

In `src/../tailwind.config.js` (repo root `tailwind.config.js`), remove the `brand` and `primary` entries from `theme.extend.colors`, and remove the whole `boxShadow` block — nothing in the app references `shadow-premium`, `shadow-premium-hover`, `shadow-yellow`, or the `brand`/`primary` colors anymore. The file should read:

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

Note: `darkMode: 'class'` is left as-is — it's a no-op now that nothing renders `dark:` classes, and removing it is out of scope for this cleanup (it doesn't affect anything since no component references it).

- [ ] **Step 4: Run the full suite**

Run: `npm run test`
Expected: all suites pass, including `tailwindTokens.test.js` (it only asserts on the `navy`/`surface`/`ink`/`ghost`/`hairline`/`background`/radii tokens kept in Step 3).

- [ ] **Step 5: Run lint**

Run: `npm run lint`
Expected: no errors. Fix any unused-import warnings introduced by earlier tasks before proceeding.

- [ ] **Step 6: Run a production build**

Run: `npm run build`
Expected: build succeeds with no errors.

- [ ] **Step 7: Full manual pass in the dev server**

Run: `npm run dev` and click through: Home → Register → Login → search/browse on Home → open a BusinessDetails page → book a slot → Profile → check out a booking → CheckoutSummary → pay → back to Home. Then log in as a business owner and walk `/dashboard`, and as an admin and walk `/admin`. Confirm every page uses the navy/ink/surface palette consistently and no yellow/black/dark-mode styling remains anywhere.

- [ ] **Step 8: Commit**

```bash
git add tailwind.config.js
git commit -m "chore: remove unused brand/primary tailwind tokens after sitewide redesign"
```

---
