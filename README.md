# Restau SaaS — NA Innovations

Multi-tenant SaaS platform that gives independent restaurants a full digital presence: public website, online reservations, menu, contact, gallery, event bookings, self-serve cancellation, per-tenant SEO, and an admin dashboard. Each restaurant lives at `/r/:slug` with its own branding, opening hours, theme, and modules; the SaaS is validated tenant-by-tenant from a superadmin console.

Built with **Laravel 12** + **React 19 (TypeScript)**. Runs against SQLite in dev.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Laravel 12, PHP 8.2+, Sanctum 4, PHPUnit |
| **Frontend** | React 19, TypeScript 5.9, Vite 7, React Router 7, React Helmet Async |
| **Database** | SQLite (file-based) |
| **Styling** | Tailwind CSS 3.4 with semantic tokens + custom `coffee` / `cream` / `noir` / `sable` themes |
| **i18n** | react-i18next (FR default, EN, AR with RTL + Tajawal font) |
| **Charts** | Recharts (admin analytics) |
| **Animations** | GSAP + ScrollTrigger (cinematic layout only), IntersectionObserver reveals elsewhere |
| **Icons** | Heroicons 2 |
| **HTTP** | Axios 1.13 |
| **Notifications** | React Hot Toast |

---

## Feature Matrix

### Public restaurant sites (`/r/:slug/*`)
Each tenant gets its own site under `/r/:slug`. Every page shown here is gated by a per-tenant module flag — the superadmin decides which sections a given restaurant sees. Direct URL access to a disabled module redirects to the tenant homepage; the backend also refuses the underlying API with 403.

- **Home** — hero + about + menu preview + reservation CTA (Classic layout) OR immersive scroll storytelling (Cinematic layout)
- **Menu** — categorised, searchable, halal flag, availability toggle, optional PDF download
- **Gallery** — lightbox navigation, admin-managed images
- **Contact** — contact form + recruitment form (tabbed), rate-limited backend
- **Reservation** — 5-step modal with real-time availability, table auto-optimize or manual pick, event mode, alternative time slot suggestions
- **Cancel** — self-serve cancellation via code + email at `/r/:slug/cancel`, works from the deep-link in the confirmation email
- **Privacy / Terms** — always available, generated per tenant

### Reservation engine
- Real-time availability with configurable service duration + buffer time
- Conflict detection across chair-level bookings
- Auto-optimize picks the smallest table that fits the party
- Manual table selection with mini floor-plan preview
- Event bookings for large groups (no fixed chair assignment)
- Alternative time slot suggestions (±30/60 min) when the requested slot is full
- Opening hours + closure dates enforcement
- 8-character cancellation code issued per booking (whole party cancelled at once via `/r/:slug/cancel`)
- Confirmation, pending, and cancellation emails (queued, opt-in per tenant)

### Admin dashboard (`/dashboard`)
Sidebar items are hidden when the corresponding module is off.

- **Reservations** — filter by status/date/search, edit inline, confirm/cancel/no-show/restore, create manually, floor-plan overlay
- **Floor plan editor** — drag-and-drop tables/chairs/walls, multi-floor, capacity derived from adjacent-chair count
- **Menu** — full CRUD with image uploads, category, halal flag, availability toggle, reorder
- **Images** — hero, restaurant photos, gallery, menu preview categories with drag-reorder
- **Analytics** — headline KPIs, status breakdown, day-of-week and hour histograms, recent activity
- **SEO checklist** — 5 categories (Sur votre site auto-tracked, Google Business, Third-party listings, Reviews, Content) with progress bar and next-action prompt
- **Settings** — restaurant name, logo, hours, closure dates, social links, theme, layout, Moroccan decorations toggle, SEO meta (description/keywords/og), address/phone/cuisine/price range
- **Superadmin (role=admin)** — moderate pending signups, toggle 7 modules per tenant (reservations / menu / website / contact / gallery / events / cancellation), impose theme+layout, activate/suspend, receive-side email on `pending → active`

### Public website features (per tenant)
- **Two selectable layouts** — Classic (sections stack) or Cinematic (immersive scroll, GSAP pinning, vignette)
- **Three themes** — coffee, noir, sable (CSS variables + Tailwind semantic tokens)
- **Moroccan decoration toggle** — tenant-controlled visual layer (Morocco country outline on the Contact page). ON by default, off for tenants that prefer a neutral rendering.
- **Full trilingual** — FR / EN / AR with proper RTL flip and Tajawal Arabic font
- **Reserve widget** — embeddable via `public/widget.js` in any external site
- **PWA-installable** for the SaaS brand

### Multi-tenancy
- Row-level isolation via `restaurant_id` FK on `users`, `restaurant_settings`, `restaurant_floor_plans`, `menu_items`, `site_images`, `restaurant_modules`
- `TenantContext` singleton set by middleware:
  - `ResolveTenant` — public routes read `/r/:slug`, `?tenant=…`, `X-Tenant` header, or Host fallback
  - `ResolveAuthTenant` — dashboard routes read `user.restaurant_id`
- `EnsureRestaurantActive` — blocks dashboard + public API when `status != active`
- `EnsureModule:<name>` — 403 when the module flag is off (menu / reservations / contact / …)
- Per-tenant caches keyed as `public_settings:{rid}`, `public_menu_items:{rid}`, `public_site_images:{rid}`

### SEO
- **Per-tenant `TenantSEO`** on every `/r/:slug/*` page: dynamic `<title>`, description, canonical, OG, Twitter cards, favicon override, and `schema.org/Restaurant` JSON-LD on the homepage (address, phone, cuisine, price range, opening hours, `acceptsReservations`, `sameAs` from social links)
- **Per-tenant sitemap** at `/api/public/sitemap?tenant=<slug>`, discovered via `<link rel="sitemap">`, module-gated (a menu-only tenant doesn't advertise `/contact` in its sitemap)
- **`SaasSEO`** for the marketing surface (`/`, `/login`, `/register`, `/embed/reserve`) with `SoftwareApplication` + `Organization` JSON-LD on the landing, `noindex,nofollow` on auth + embed
- **Root `sitemap.xml`, `robots.txt`, `manifest.webmanifest`** for the SaaS brand
- **API host `robots.txt`** — `Disallow: /`

### Authentication + validation flow
- Sanctum SPA auth (CSRF cookie + session)
- Register form → `UserObserver` provisions `Restaurant` + `Domain` + `RestaurantFloorPlan` + `RestaurantSetting` + `RestaurantModule` (all modules OFF by default, status = `pending`)
- Owner logs in → `ProtectedRoute` detects `status ≠ active` → shows `PendingValidationPage` (with support email + logout)
- Superadmin opens `/dashboard/admin` → sees pending tenants first → picks modules + theme + layout → clicks **Valider** → status flips → `RestaurantActivated` email queued to owner
- Owner logs in again → dashboard renders, sidebar shows only enabled modules, `DashboardIndex` picks a sensible landing (Reservations if enabled, else Menu, else Images, else Settings)

### Testing
- 110+ PHPUnit feature tests with `RefreshDatabase`
- `Tests\TestCase::activateTenant()` helper flips a fresh tenant to `active + all modules on` for tests that predate the validation flow
- Dedicated coverage for tenant isolation, module gating, activation email, sitemap module-gating, SEO field validation, cancellation edge cases (rate limit, tenant leakage, past arrival, group cancellation)

---

## Getting Started

### Prerequisites
- PHP 8.2+, Composer
- Node.js 18+, npm

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate
php artisan storage:link
php artisan serve
```

API at `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App at `http://localhost:5174` (default Vite port for this project).

### Running tests

```bash
# Backend
cd backend && php artisan test

# Frontend type-check
cd frontend && npx tsc --noEmit
```

### Local dev shortcut — log in as any tenant owner

When `APP_ENV=local` (backend) and the frontend is served by Vite (`npm run dev`), the Login page shows an amber **DEV** panel that lets you impersonate any tenant's owner in one click — no password needed. The button appears:

- On `/r/:slug/login` → a single button "Se connecter en tant que propriétaire de {Name}"
- On plain `/login` → a dropdown listing every registered tenant with their status + owner email, and a "Se connecter" button

The endpoints backing this panel (`GET /api/dev/tenants`, `POST /api/dev/login-as-owner`) hard-fail with 404 when `APP_ENV != local`, and the button itself only renders when Vite's `import.meta.env.DEV` is true — so this never ships to prod.

---

## Project Structure

```
restau-saas/
├── backend/                                # Laravel 12 API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/
│   │   │   │   ├── AdminController.php               # superadmin: restaurants + modules
│   │   │   │   ├── AnalyticsController.php
│   │   │   │   ├── ContactController.php
│   │   │   │   ├── FloorPlanController.php
│   │   │   │   ├── FloorPlanItemController.php
│   │   │   │   ├── MenuItemController.php
│   │   │   │   ├── PublicTableController.php        # availability + reservation + cancel
│   │   │   │   ├── ReservationController.php
│   │   │   │   ├── SettingsController.php           # incl. publicShow (settings + modules + SEO)
│   │   │   │   ├── SiteImageController.php
│   │   │   │   └── SitemapController.php            # per-tenant XML sitemap
│   │   │   ├── Middleware/
│   │   │   │   ├── ResolveTenant.php                # public tenant resolution
│   │   │   │   ├── ResolveAuthTenant.php            # dashboard tenant resolution
│   │   │   │   ├── EnsureRestaurantActive.php       # 403 when status != active
│   │   │   │   ├── EnsureModule.php                 # feature:<name> gate
│   │   │   │   └── RequireAdmin.php
│   │   │   └── Requests/
│   │   │       └── UpdateSettingsRequest.php
│   │   ├── Mail/
│   │   │   ├── ContactMessage.php
│   │   │   ├── RecruitmentApplication.php
│   │   │   ├── ReservationConfirmed.php
│   │   │   ├── ReservationPending.php
│   │   │   ├── ReservationCancelled.php
│   │   │   └── RestaurantActivated.php
│   │   ├── Models/
│   │   │   ├── Restaurant.php
│   │   │   ├── Domain.php
│   │   │   ├── RestaurantModule.php                 # 7 feature flags + theme/layout
│   │   │   ├── RestaurantSetting.php                # incl. SEO fields
│   │   │   ├── RestaurantFloorPlan.php
│   │   │   ├── RestaurantFloorPlanItem.php
│   │   │   ├── Reservation.php                      # SoftDeletes, cancellation_code
│   │   │   ├── MenuItem.php
│   │   │   ├── SiteImage.php
│   │   │   └── User.php
│   │   ├── Observers/
│   │   │   └── UserObserver.php                     # bootstraps tenant, status=pending, modules OFF
│   │   └── Services/
│   │       ├── TenantContext.php                    # singleton (set/get/id/require)
│   │       └── ReservationMailService.php
│   ├── database/migrations/                         # SQLite-friendly (Schema::hasColumn guards)
│   ├── resources/views/emails/                      # Blade email templates
│   ├── routes/api.php
│   └── tests/
│       ├── TestCase.php                             # activateTenant() helper
│       └── Feature/
│           ├── AnalyticsControllerTest.php
│           ├── ContactControllerTest.php
│           ├── MenuItemControllerTest.php
│           ├── MultiTenancyIsolationTest.php
│           ├── PublicReservationCancelTest.php
│           ├── PublicTableControllerTest.php
│           ├── ReservationControllerTest.php
│           ├── SeoTest.php
│           ├── SettingsControllerTest.php
│           └── SuperadminModuleGatingTest.php
│
├── frontend/                               # React 19 + TypeScript SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── TenantSEO.tsx                        # per-tenant meta + JSON-LD Restaurant
│   │   │   ├── SaasSEO.tsx                          # SaaS marketing meta + SoftwareApplication LD
│   │   │   ├── RestaurantLayout.tsx                 # wraps /r/:slug/*
│   │   │   ├── DashboardLayout.tsx                  # module-filtered sidebar
│   │   │   ├── ProtectedRoute.tsx                   # includes pending/suspended gate
│   │   │   ├── GuestRoute.tsx
│   │   │   ├── cinematic/                           # CinematicNav, CinematicHero, SmoothScroll
│   │   │   ├── dashboard/                           # OnboardingWizard
│   │   │   ├── floorplan/                           # FloorPlanEditor
│   │   │   ├── public/
│   │   │   │   ├── Navbar.tsx                       # module-filtered nav
│   │   │   │   ├── Footer.tsx                       # cancel link module-gated
│   │   │   │   ├── ModuleGate.tsx                   # redirects when module off
│   │   │   │   ├── PublicNav.tsx                    # layout-picker wrapper
│   │   │   │   ├── ReservationModal.tsx             # 5 steps + success view with code
│   │   │   │   ├── CTAButton.tsx
│   │   │   │   └── PublicHero.tsx
│   │   │   └── ui/                                  # Toast, Spinner, ConfirmDialog, ToggleSwitch
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx
│   │   │   ├── ThemeContext.tsx
│   │   │   ├── PublicSettingsContext.tsx            # settings + modules + SEO
│   │   │   └── SiteImagesContext.tsx
│   │   ├── hooks/
│   │   │   ├── useAvailabilityCheck.ts
│   │   │   └── useRestaurantBasePath.ts
│   │   ├── i18n/
│   │   │   ├── index.ts
│   │   │   └── resources.ts                         # FR/EN/AR bundle
│   │   ├── lib/
│   │   │   ├── api.ts                               # axios + all endpoints
│   │   │   └── types.ts
│   │   └── pages/
│   │       ├── SaasLandingPage.tsx                  # /
│   │       ├── HomeSwitch.tsx                       # Classic vs Cinematic per tenant
│   │       ├── CinematicHome.tsx
│   │       ├── Home.tsx                             # Classic home
│   │       ├── GalleryPage.tsx
│   │       ├── PublicMenuPage.tsx
│   │       ├── ContactPage.tsx
│   │       ├── PublicReservation.tsx
│   │       ├── CancelReservation.tsx
│   │       ├── PrivacyPage.tsx
│   │       ├── TermsPage.tsx
│   │       ├── EmbedReservation.tsx                 # /embed/reserve (widget iframe)
│   │       ├── Login.tsx
│   │       ├── Register.tsx
│   │       ├── PendingValidationPage.tsx            # served when status != active
│   │       ├── DashboardIndex.tsx                   # smart /dashboard landing
│   │       ├── Dashboard.tsx                        # reservations
│   │       ├── MenuPage.tsx
│   │       ├── SiteImagesPage.tsx
│   │       ├── AnalyticsPage.tsx
│   │       ├── SeoChecklistPage.tsx                 # /dashboard/seo
│   │       ├── SettingsPage.tsx                     # incl. theme/layout locks + SEO section
│   │       ├── AdminPage.tsx                        # superadmin console
│   │       └── NotFound.tsx
│   ├── public/
│   │   ├── manifest.webmanifest                     # PWA
│   │   ├── robots.txt                               # SaaS crawl rules
│   │   ├── sitemap.xml                              # root SaaS sitemap
│   │   └── widget.js                                # embeddable reservation widget
│   ├── index.html                                   # SaaS-branded first paint
│   └── ...
│
└── playground/
    ├── widget-demo.html
    └── widget-embed-demo.html
```

---

## API Overview

Full route list in [`backend/routes/api.php`](backend/routes/api.php). Highlights:

### Public — tenant-resolved (`?tenant=<slug>` or `X-Tenant`)
| Route | Notes |
|-------|-------|
| `GET  /api/public/settings` | never module-gated (frontend needs it to know what to hide) |
| `GET  /api/public/sitemap` | XML, gated by modules |
| `GET  /api/public/tables` | `feature:reservations` |
| `GET  /api/public/menu-items` | `feature:menu` |
| `GET  /api/public/site-images` | `feature:website` |
| `POST /api/public/check-availability` | `feature:reservations`, throttle 30/min |
| `POST /api/public/reservations` | `feature:reservations`, throttle 10/min |
| `POST /api/public/events` | `feature:events`, throttle 10/min |
| `POST /api/public/reservations/cancel` | `feature:cancellation`, throttle 10/min |
| `POST /api/public/contact` | `feature:contact`, throttle 3/min |
| `POST /api/public/recruit` | `feature:contact`, throttle 3/min |

### Dashboard — Sanctum + `auth.tenant` + `restaurant.active`
Every route additionally requires `feature:<name>` matching the module it belongs to. See `backend/routes/api.php` for the full mapping.

### Superadmin — Sanctum + `admin`
| Route | Purpose |
|-------|---------|
| `GET  /api/admin/restaurants` | Pending-first list with modules + owners |
| `PUT  /api/admin/restaurants/{restaurant}` | Update status/name; `pending → active` triggers activation email |
| `PUT  /api/admin/restaurants/{restaurant}/modules` | Extended payload with 7 flags + theme + layout |

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `restaurants` | Central tenant (name, slug, logo, status) |
| `domains` | Optional custom domain per tenant |
| `restaurant_modules` | 7 boolean feature flags + optional theme/layout override |
| `restaurant_settings` | Per-tenant configuration + SEO fields + checklist state |
| `restaurant_floor_plans` | Floor layout config (width, height, floors JSON) |
| `restaurant_floor_plan_items` | Tables / chairs / walls with position + rotation |
| `reservations` | 1 row per occupied chair, grouped by `(email, arrival_time, party_size)`, SoftDeletes, `cancellation_code` |
| `menu_items` | Menu dishes with price, image, category, halal flag |
| `site_images` | Hero / restaurant / carte / gallery categories |
| `users` | Restaurant owner and superadmin accounts (`role` = user | admin) |

All tenant tables carry a `restaurant_id` FK for row-level isolation.

---

## Key Architecture Rules

1. **Multi-tenant, row-level isolation** — never trust `user_id` alone; scope by `restaurant_id` via `TenantContext`.
2. **Module OFF wins** over any per-tenant setting (superadmin's word is final).
3. **Superadmin theme/layout override wins** over the tenant's SettingsPage choice (SettingsPage shows a lock badge in that case).
4. **1 reservation row per chair** — dedup in the UI by `(email, arrival_time, party_size)`.
5. **SQLite constraints** — no `ALTER TABLE MODIFY COLUMN`, no `ENUM`; use controller-level validation and `Schema::hasColumn()` guards in migrations.
6. **Never hardcode a restaurant name** in a component, template, or meta tag. Read from `usePublicSettings()` on tenant routes, from a URL slug otherwise, or use the SaaS brand `NA Innovations`.
7. **First-paint defaults in `index.html`** carry the SaaS brand; Helmet overrides at runtime with tenant data.

---

## Design System

- **Themes**: `coffee`, `noir`, `sable` — CSS variables + Tailwind semantic tokens (`bg-page`, `text-primary`, `border-subtle`, `bg-tint`, `text-accent`, `bg-brand`, …). Dark-mode aware.
- **Layouts**: `classic` (sections stack, admin sees carousels + previews) or `cinematic` (GSAP scroll storytelling with vignette).
- **Type**: `Playfair Display` (display), `Lora` (body), `Cormorant Garamond` (noir), `Fraunces` (sable), `Tajawal` (Arabic).
- **Cards / inputs**: `bg-white dark:bg-[#1c1a17]`, `shadow-card dark:shadow-dark-card`, `border border-gray-200 dark:border-gray-600 rounded-lg`.

---

## Documentation contract

Every new feature added to this codebase **must** update this README (feature listed in the matrix, route added to the API overview if it exposes one, new page added to the project tree, new table added to the schema table).

Rationale: this repo has multiple simultaneous contributors and long-lived AI agents. If it isn't in the README, future contributors won't know it exists — and stale mental models produce broken PRs.

See [`CLAUDE.md`](CLAUDE.md) for the full contributor + agent rules.

---

## License

All rights reserved. © NA Innovations.
