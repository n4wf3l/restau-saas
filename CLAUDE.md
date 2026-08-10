# CLAUDE.md — Rules for AI agents working on this repo

Read this file before doing anything. It captures the non-obvious conventions and traps that this codebase has accumulated. Anything not covered here, follow what the surrounding code does.

The `README.md` in this same folder is the human-facing description of what the product does. Keep it in sync (see the **Documentation contract** below).

---

## 1. Documentation contract (non-negotiable)

**Every feature you add, change, or remove must be reflected in `README.md` before the PR is opened / branch is merged.**

Concretely:
- **New user-visible feature** → update the relevant list under `## Feature Matrix` in the README.
- **New API route** → add a row to the `## API Overview` table.
- **New DB table or column that isn't a private detail** → update `## Database Schema`.
- **New top-level page or component category** → update the `## Project Structure` tree.
- **New architectural rule** → add a numbered line under `## Key Architecture Rules`.
- **Removed / renamed feature** → also remove or rename it in the README, don't leave zombie mentions.

Why this matters: multiple humans and long-lived AI agents work on this repo. If it isn't in the README, the next contributor won't know it exists, will build over it, and produce broken assumptions.

**If you can't update the README in the same commit as the feature (edge case: rebasing an old branch), leave a `TODO(readme):` line in the commit message pointing at the paragraph that will need updating.**

---

## 2. Tech baseline

- Backend: **Laravel 12** / **PHP 8.2+** / **Sanctum 4** / **PHPUnit**
- Frontend: **React 19** / **TypeScript 5.9** / **Vite 7** / **React Router 7** / **react-helmet-async**
- Database: **SQLite** in dev (file-based). This is not MySQL — see rule below.
- Styling: **Tailwind 3.4** with semantic tokens (`bg-page`, `text-primary`, `border-subtle`, `bg-tint`, `text-accent`, `bg-brand`, …). Themes switched via `data-theme` on `<html>`.
- Auth: **Sanctum SPA** (CSRF cookie + session).

---

## 3. Multi-tenancy — the highest-priority rule

Every tenant table has a `restaurant_id` FK. **Never write a query that scopes by `user_id` alone.** Always resolve through `App\Services\TenantContext`:

- Public routes are wrapped in the `tenant` middleware → `TenantContext` is populated from `?tenant=<slug>`, `X-Tenant` header, Host header, or dev fallback.
- Dashboard routes use `auth.tenant` → `TenantContext` is populated from `$user->restaurant`.
- In controllers: `$this->tc()->id()` for the current `restaurant_id`, `$this->tc()->require()` when the tenant must exist.

Cross-tenant writes have caused real production bugs on this project. There's a dedicated `MultiTenancyIsolationTest` that must stay green. Any new controller method that mutates or exposes tenant-owned data needs its own isolation assertion.

---

## 4. Superadmin validation flow (as of 2026-08-10)

New signups land in `restaurants.status = 'pending'` with **every module OFF** (see `UserObserver`). Nothing is auto-enabled. The dashboard is blocked by the `restaurant.active` middleware until the superadmin flips the status.

Rules that follow from this:
- **Module OFF wins over any tenant setting.** `restaurant_settings.reservations_enabled = true` + `restaurant_modules.reservations_enabled = false` → reservations are OFF, period.
- **Superadmin theme/layout override wins.** If `restaurant_modules.theme` is set (not NULL), the tenant's own `SettingsPage` theme picker is disabled and shows a "Verrouillé par la plateforme" badge.
- **Superadmin (`user.role === 'admin'`) bypasses** both the `restaurant.active` gate and the `feature:<X>` gate. Their own restaurant status is irrelevant to them reaching admin routes.
- **Route middleware for features** is `feature:<name>` where `<name>` is the module key without `_enabled`. Whitelisted names live in `App\Models\RestaurantModule::FEATURE_FLAGS`. Adding a new module means: migration + model constant + middleware whitelist + `AdminController::updateModules` validation + AdminPage grid + `publicShow` response.

---

## 5. Test conventions

Feature tests use `RefreshDatabase`. Because `UserObserver` now provisions tenants as pending with modules OFF, every test that expects to reach a gated endpoint must call `$this->activateTenant($user)` in its `setUp` — the helper lives on `Tests\TestCase` and flips the freshly-created tenant to `active + all modules on`.

**When writing a new test:**
- If it hits any `/api/*` endpoint that isn't `/api/user`, add `activateTenant()` to setUp.
- If it tests cross-tenant behaviour, `activateTenant()` **both** tenants (otherwise a 403 for the wrong reason will make the test pass by accident).
- Rate-limited endpoints (`throttle:X,1`) can be tested by hitting them X+1 times in a loop and asserting the last one is 429. See `ContactControllerTest` and `PublicReservationCancelTest` for the pattern.

Run: `cd backend && php artisan test`. Frontend: `cd frontend && npx tsc --noEmit` (no jest yet).

---

## 6. Database constraints (SQLite)

- **No `ALTER TABLE MODIFY COLUMN`** — SQLite doesn't support it. If you need to change a column, add a new migration that creates the new column, backfills, drops the old.
- **No `ENUM` types** — validate in the controller (`Rule::in([...])`) or as a model constant (`RestaurantSetting::AVAILABLE_THEMES`).
- **Wrap column adds in `Schema::hasColumn()` guards** — migrations must be idempotent because dev DBs get re-migrated often.
- **Datetime arithmetic** differs from MySQL. Check `PublicTableController::getBatchConflictingChairIds` for the SQLite / MySQL split pattern (`datetime(x, '+' || ? || ' minutes')` vs `DATE_ADD`).

---

## 7. SEO — two components, don't mix them

- **`TenantSEO`** is for `/r/:slug/*`. Reads from `usePublicSettings()`, emits per-tenant `<title>`, meta description, OG, canonical, favicon override, and `schema.org/Restaurant` JSON-LD on the homepage. Mounted once in `RestaurantLayout`.
- **`SaasSEO`** is for the SaaS marketing surface (`/`, `/login`, `/register`, `/embed/reserve`). Kept **strictly separate** — must never be mounted on tenant routes. Emits `SoftwareApplication` + `Organization` JSON-LD on the landing, `noindex,nofollow` on auth + embed.
- **`index.html`** carries SaaS-brand defaults for first paint (title `NA Innovations …`). Helmet overrides at runtime. **Never** put a restaurant name in `index.html`.

Sitemaps: each tenant has one at `/api/public/sitemap?tenant=<slug>` (served by `SitemapController`, gated by modules). The SaaS root has a minimal `frontend/public/sitemap.xml`.

---

## 8. Reservation dedup pattern

A party of N produces N rows in the `reservations` table (one per occupied chair) sharing:
- `customer_email`
- `arrival_time`
- `party_size`
- `cancellation_code` (8-char, alphanumeric uppercase, ambiguous chars removed)

The UI groups by that tuple. Do **not** invent a "reservation group id" column — the dedup is a UI-layer concern. Cancellation cancels all rows in the group at once.

---

## 9. i18n

- 3 languages: `fr` (default), `en`, `ar` (with RTL flip via `dir="rtl"` on `<html>` and Tajawal font).
- Everything user-facing on the tenant public site goes through `useTranslation()`. Add new keys to all 3 locales in `frontend/src/i18n/resources.ts` — parity is enforced by the fact that missing keys fall back to the key itself, which looks broken in prod.
- The **SaaS landing page is English-only intentionally** — targeted at agencies / power users. `SaasLandingPage.tsx` does not use i18n.

---

## 10. Payments

There is intentionally **no Stripe / payment integration**. Onboarding is manual (superadmin validation flow). If you're asked to add a payment gate, confirm with the user first — this decision was made deliberately.

---

## 11. Frontend patterns

- **Dashboard cards**: `bg-white dark:bg-[#1c1a17]` with `shadow-card dark:shadow-dark-card`.
- **Inputs**: `px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700`.
- **Semantic tokens on tenant public site** (respect the active theme): `bg-page`, `text-primary`, `border-subtle`, `bg-tint`, `text-accent`, `bg-brand`, `bg-brand-hover`.
- **File uploads**: multipart FormData with `POST` + hidden `_method=PUT` when Laravel needs `PUT` semantics on a file upload.
- **Icons**: Heroicons React 2 outline set (`@heroicons/react/24/outline`).
- **Toasts**: `react-hot-toast` (already wired via `<AppToaster />` in `App.tsx`).
- **Routes for tenant pages** live under `/r/:slug/*` and every module-scoped one must be wrapped in `<ModuleGate feature="X_enabled">…</ModuleGate>` in `App.tsx`.

---

## 12. What NOT to do

- Don't add a "reservation pause" toggle back into `restaurant_settings`. Superadmin module OFF is the pause. If a nuance is needed, discuss first.
- Don't add cross-tenant "admin" endpoints under `/api/` that skip `TenantContext`. Superadmin routes live under `/api/admin/*` behind the `admin` middleware.
- Don't hardcode `"RR Ice"`, `"Chez Chegrouni"`, or any specific restaurant name in a component, template, or meta tag. Read from context.
- Don't add `--force`, `--no-verify`, or `--no-gpg-sign` to git commands unless the user explicitly asks.
- Don't create documentation files (`.md`, `SUMMARY.md`, `AUDIT.md`, `CHANGES.md`) unless the user explicitly asks. Work from conversation / git history.

---

## 13. Branch + commit convention

Follow the pattern already visible in `git log --oneline`:
- Branch names: `feat/<kebab-case-scope>` for features, `fix/<scope>` for bugfixes, `chore/<scope>` otherwise.
- Commits merged via `--no-ff` so the merge commit shows in the graph.
- Commit messages: imperative present ("Add", "Fix", "Extend"), a short subject, and a body that explains **why** and any non-obvious side effects. See the recent history for the tone.
- When a commit ships something user-visible, the README update goes in the **same commit** unless there's a good reason not to.

---

_Last updated: 2026-08-10 — extend this file whenever a rule changes._
