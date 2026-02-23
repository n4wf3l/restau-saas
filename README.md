# Restau SaaS

A full-stack restaurant management platform built with **Laravel 12** and **React 19**. Designed for single-restaurant operations, it provides an interactive floor plan editor, a real-time reservation engine, menu management, and a polished public-facing website — all wrapped in an elegant brown/beige design system.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Laravel 12, PHP 8.2+, Sanctum 4 |
| **Frontend** | React 19, TypeScript 5.9, Vite 7 |
| **Database** | SQLite (file-based) |
| **Styling** | Tailwind CSS 3.4 (custom `coffee`/`cream` palettes) |
| **Icons** | Heroicons React 2 |
| **HTTP** | Axios 1.13 |
| **Routing** | React Router DOM 7 |
| **Notifications** | React Hot Toast |

---

## Features

### Reservation System
- **Real-time availability** — conflict detection based on service duration + buffer time
- **Auto-optimize** — automatically picks the smallest table that fits the party size
- **Manual table selection** — customers can choose a specific table
- **Event bookings** — special occasion requests without chair assignment
- **Alternative suggestions** — proposes nearby time slots when the requested one is full
- **Admin dashboard** — confirm, cancel, complete, or mark reservations as no-show with soft-delete support

### Floor Plan Editor
- **Interactive grid editor** — drag-and-drop placement of tables, chairs, and walls
- **Multi-floor support** — configure multiple floors with custom names
- **Spatial logic** — adjacent chairs are automatically detected (grid-based ±1 proximity)
- **Table capacity** — derived from the count of adjacent chairs (no explicit capacity field)

### Menu Management
- **Full CRUD** — create, edit, reorder, and delete menu items
- **Image uploads** — stored in `storage/public/menu-images/`
- **Categories & search** — organized by category with real-time search on the public page
- **Halal flag** — per-item halal indicator
- **Availability toggle** — hide items from the public menu without deleting them

### Restaurant Settings
- Enable/disable reservations globally
- Service duration (15–480 min) and buffer time (0–120 min)
- Max occupancy percentage (10–100%)
- Auto-confirm and auto-optimize toggles
- Confirmation email toggle

### Public Website
- **Home** — hero with image carousel, gallery preview, menu preview, reservation CTA
- **Menu** — browse available dishes by category with search and detail drawer
- **Reservation** — book a table with date/time/party-size picker and live availability
- **Gallery** — image gallery with lightbox navigation
- **Contact** — contact form + recruitment form with tab navigation
- **Privacy Policy** and **Terms of Service** — full legal pages in French
- **Shared footer** — address, hours, social links, legal links, NA Innovations credit
- **Scroll animations** — IntersectionObserver-powered reveal effects on all pages
- **Dark mode** — full dark mode support persisted to localStorage

### Authentication
- Laravel Sanctum (CSRF + token-based SPA auth)
- Auto-provisioning — registering creates a floor plan and default settings via `UserObserver`
- Protected admin routes (dashboard, menu editor, settings)
- Guest-only routes (login, register redirect if already authenticated)

---

## Project Structure

```
restau-saas/
├── backend/                          # Laravel 12 API
│   ├── app/
│   │   ├── Http/Controllers/Api/
│   │   │   ├── FloorPlanController.php
│   │   │   ├── FloorPlanItemController.php
│   │   │   ├── MenuItemController.php
│   │   │   ├── PublicTableController.php    # Core availability engine
│   │   │   ├── ReservationController.php
│   │   │   └── SettingsController.php
│   │   ├── Models/
│   │   │   ├── User.php
│   │   │   ├── RestaurantFloorPlan.php
│   │   │   ├── RestaurantFloorPlanItem.php
│   │   │   ├── Reservation.php              # SoftDeletes enabled
│   │   │   ├── MenuItem.php
│   │   │   └── RestaurantSetting.php
│   │   └── Observers/
│   │       └── UserObserver.php             # Auto-creates floor plan + settings
│   ├── database/
│   │   ├── migrations/                      # 18 migration files
│   │   └── database.sqlite
│   └── routes/
│       └── api.php                          # Public + protected API routes
│
├── frontend/                         # React 19 + TypeScript SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── public/
│   │   │   │   ├── Navbar.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   ├── CTAButton.tsx
│   │   │   │   └── ReservationModal.tsx
│   │   │   ├── editor/
│   │   │   │   └── FloorPlanEditor.tsx
│   │   │   ├── ui/
│   │   │   │   └── Spinner.tsx
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── GuestRoute.tsx
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── hooks/
│   │   │   └── useAvailabilityCheck.ts
│   │   ├── lib/
│   │   │   ├── api.ts                       # Axios instance + all endpoints
│   │   │   └── types.ts                     # TypeScript interfaces
│   │   ├── pages/
│   │   │   ├── Home.tsx                     # Landing page
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx                # Admin reservations
│   │   │   ├── MenuPage.tsx                 # Admin menu CRUD
│   │   │   ├── SettingsPage.tsx             # Admin settings
│   │   │   ├── GalleryPage.tsx              # Public gallery
│   │   │   ├── PublicMenuPage.tsx            # Public menu
│   │   │   ├── PublicReservation.tsx         # Public reservation
│   │   │   ├── ContactPage.tsx              # Public contact
│   │   │   ├── PrivacyPage.tsx              # Privacy policy
│   │   │   └── TermsPage.tsx                # Terms of service
│   │   ├── App.tsx                          # Routes + ScrollToTop
│   │   └── App.css                          # Custom scrollbar + globals
│   ├── tailwind.config.js                   # coffee/cream palettes, animations
│   ├── vite.config.ts
│   └── package.json
│
└── DOCUMENTATION.md
```

---

## API Routes

### Public (no authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/public/tables` | List tables with availability info |
| `POST` | `/api/public/check-availability` | Check time slot availability |
| `POST` | `/api/public/reservations` | Create a reservation |
| `POST` | `/api/public/events` | Submit an event booking request |
| `GET` | `/api/public/settings` | Get public restaurant settings |
| `GET` | `/api/public/menu-items` | Get available menu items |

### Protected (auth:sanctum)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/user` | Get authenticated user |
| `GET` | `/api/floor-plans/current` | Get floor plan with items |
| `PUT` | `/api/floor-plans/current` | Update floor plan dimensions/floors |
| `PUT` | `/api/floor-plans/current/items` | Bulk upsert all floor plan items |
| `POST` | `/api/floor-plans/current/items` | Add a single item |
| `DELETE` | `/api/floor-plans/current/items/{id}` | Delete an item |
| `GET` | `/api/reservations` | List all reservations |
| `PUT` | `/api/reservations/{id}` | Update reservation status |
| `DELETE` | `/api/reservations/{id}` | Delete a reservation |
| `POST` | `/api/reservations/{id}/restore` | Restore a soft-deleted reservation |
| `GET` | `/api/menu-items` | List menu items (owner's) |
| `POST` | `/api/menu-items` | Create a menu item |
| `PUT` | `/api/menu-items/{id}` | Update a menu item |
| `DELETE` | `/api/menu-items/{id}` | Delete a menu item |
| `GET` | `/api/settings` | Get restaurant settings |
| `PUT` | `/api/settings` | Update restaurant settings |

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `users` | Restaurant owner accounts |
| `restaurant_floor_plans` | Floor layout config (width, height, floors JSON) |
| `restaurant_floor_plan_items` | Individual items (table, chair, wall) with position and rotation |
| `reservations` | Bookings — 1 row per occupied chair, grouped by customer+time |
| `menu_items` | Menu dishes with price, image, category, halal flag |
| `restaurant_settings` | Per-restaurant configuration (duration, buffer, occupancy, toggles) |

---

## Getting Started

### Prerequisites
- PHP 8.2+
- Composer
- Node.js 18+
- npm or yarn

### Backend Setup

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

The API runs at `http://localhost:8000`.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

---

## Design System

The UI uses a custom **coffee/cream** color palette with two serif font families:

- **Display font**: Playfair Display — headings, prices, hero text
- **Body font**: Lora — paragraphs, labels, descriptions
- **Coffee palette** (`coffee-50` → `coffee-950`): dark browns for backgrounds and text
- **Cream palette** (`cream-50` → `cream-900`): warm beiges for accents and highlights
- **Custom shadows**: `card`, `card-hover`, `premium` with dark mode variants
- **Animations**: `fadeIn`, `slideUp`, `hero-fade-up`, `hero-scale`, `menu-reveal`
- **Custom scrollbar**: brown track with beige thumb across the entire site

---

## Key Architecture Decisions

1. **1 User = 1 Restaurant** — user-scoped, not multi-tenant
2. **SQLite** — lightweight, file-based; no MySQL `DATE_ADD` or `ENUM` types
3. **1 Reservation Row Per Chair** — grouped in the UI by `(customer_email, arrival_time, party_size)`
4. **Table Capacity = Adjacent Chair Count** — no explicit capacity field; derived from spatial proximity
5. **Sanctum SPA Auth** — CSRF cookies + token for same-origin requests
6. **UserObserver** — auto-provisions floor plan + settings on registration

---

## License

All rights reserved.
