import axios from "axios";
import toast from "react-hot-toast";
import type { Reservation, PublicTable, ReservationPayload, EventReservationPayload, MenuItem, MenuItemPayload, RestaurantSettings, SiteImage, SiteImagesGrouped, Restaurant } from "./types";

export const API_BASE_URL = import.meta.env.VITE_API_URL || window.location.origin;

// Static "vitrine" mode — set at build time by GH Actions (see .github/workflows/deploy-vitrine.yml
// and CLAUDE.md §10b). When set, /api/public/* GETs are served from frozen JSON under
// `${BASE_URL}static-tenant/<slug>/*.json` and all mutations are stubbed with a friendly toast.
export const STATIC_TENANT: string | null = (import.meta.env.VITE_STATIC_TENANT as string) || null;
const STATIC_BASE = import.meta.env.BASE_URL.replace(/\/$/, ''); // '' in dev, '/restau-saas' in prod build

/**
 * Resolves a stored logo/image URL to a usable src.
 * - Absolute URL (http/https) → passthrough
 * - Backend-uploaded asset (starts with /storage) → prefix with API_BASE_URL
 * - Already-prefixed static asset (starts with STATIC_BASE/) → passthrough (idempotent)
 * - Any other absolute path (e.g. /logo.png) → prefix with Vite BASE_URL for sub-path hosting
 */
export function resolveLogoUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/storage')) return `${API_BASE_URL}${url}`;
  if (STATIC_BASE && url.startsWith(`${STATIC_BASE}/`)) return url;
  if (url.startsWith('/')) return `${STATIC_BASE}${url}`;
  return url;
}

// Tenant slug for public API calls — read from URL path /r/:slug or ?tenant= query param
export function getTenantSlug(): string | null {
  // 1. Try URL path: /r/:slug/...
  const match = window.location.pathname.match(/^\/r\/([^/]+)/);
  if (match) return match[1];
  // 2. Fallback: ?tenant= query param (widget demo, external use)
  return new URLSearchParams(window.location.search).get('tenant');
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // super important (cookies)
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Intercepteur pour ajouter le token XSRF et le tenant slug
api.interceptors.request.use((config) => {
  // Static vitrine mode — rewrite public GETs to frozen JSON, stub everything else
  if (STATIC_TENANT) {
    const url = config.url ?? '';
    const method = (config.method ?? 'get').toLowerCase();

    if (method === 'get' && url.includes('/api/public/')) {
      const endpoint = url.replace(/^.*\/api\/public\//, '').replace(/\?.*$/, '');
      config.url = `${STATIC_BASE}/static-tenant/${STATIC_TENANT}/${endpoint}.json`;
      config.baseURL = window.location.origin;
      config.params = undefined;
      config.withCredentials = false;
      return config;
    }

    // /sanctum/csrf-cookie — no-op in static mode
    if (url.includes('/sanctum/csrf-cookie')) {
      throw new axios.Cancel('static-mode: csrf skipped');
    }

    // Any other backend call — reject with a friendly toast
    toast('Site vitrine — cette action nécessite le vrai site.', { icon: 'ℹ️' });
    return Promise.reject(new axios.Cancel('static-mode: backend disabled'));
  }

  // XSRF token from cookies
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("XSRF-TOKEN="))
    ?.split("=")[1];

  if (token) {
    config.headers["X-XSRF-TOKEN"] = decodeURIComponent(token);
  }

  // Inject tenant slug for public API routes
  const tenant = getTenantSlug();
  if (tenant && config.url?.includes('/api/public/')) {
    config.params = { ...config.params, tenant };
  }

  return config;
});

// Intercepteur pour gérer les sessions expirées (401)
let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(callback: () => void) {
  onUnauthorized = callback;
}

// In static-mode, deep-prefix every absolute path in the JSON with the Vite BASE_URL,
// so image_url values like "/rr-ice2.webp" work under the GH Pages sub-path even when
// the component renders them directly without going through resolveLogoUrl.
function prefixStaticBase<T>(node: T): T {
  if (Array.isArray(node)) return node.map(prefixStaticBase) as unknown as T;
  if (node && typeof node === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node)) out[k] = prefixStaticBase(v);
    return out as T;
  }
  if (
    typeof node === 'string' &&
    node.startsWith('/') &&
    !node.startsWith('//') &&
    !node.startsWith(`${STATIC_BASE}/`)
  ) {
    return `${STATIC_BASE}${node}` as unknown as T;
  }
  return node;
}

api.interceptors.response.use(
  (response) => {
    if (STATIC_TENANT && STATIC_BASE && response.data) {
      response.data = prefixStaticBase(response.data);
    }
    return response;
  },
  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes("/login") &&
      !error.config?.url?.includes("/register") &&
      !error.config?.url?.includes("/api/user")
    ) {
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

export async function csrf() {
  // obligatoire avant login/register (CSRF cookie) — skipped in static vitrine mode
  if (STATIC_TENANT) return;
  await api.get("/sanctum/csrf-cookie");
}

// === RESERVATIONS API ===

// Public API - Get all tables with their reservations
export async function getPublicTables(): Promise<PublicTable[]> {
  const response = await api.get("/api/public/tables");
  return response.data;
}

// Public API - Create a reservation
export async function createReservation(payload: ReservationPayload): Promise<{ message: string; cancellation_code?: string; reservation?: Reservation }> {
  await csrf(); // CSRF protection
  const response = await api.post("/api/public/reservations", payload);
  return response.data;
}

// Public API - Create an event reservation request
export async function createEventReservation(payload: EventReservationPayload): Promise<{ message: string; cancellation_code?: string; reservation?: Reservation }> {
  await csrf();
  const response = await api.post("/api/public/events", payload);
  return response.data;
}

// Admin API - Get all reservations
export async function getReservations(includeNoShow = false): Promise<Reservation[]> {
  const params = includeNoShow ? { include_no_show: 1 } : {};
  const response = await api.get("/api/reservations", { params });
  return response.data;
}

// Admin API - Update reservation (status and/or other fields)
export async function updateReservationStatus(id: number, status: string): Promise<{ message: string; reservation: Reservation }> {
  const response = await api.put(`/api/reservations/${id}`, { status });
  return response.data;
}

export async function updateReservation(id: number, payload: {
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string | null;
  arrival_time?: string;
  party_size?: number;
  notes?: string | null;
}): Promise<{ message: string; reservation: Reservation }> {
  const response = await api.put(`/api/reservations/${id}`, payload);
  return response.data;
}

// Admin API - Create reservation (always confirmed)
export async function createAdminReservation(payload: {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  arrival_time: string;
  party_size: number;
  table_id: number;
  notes?: string;
}): Promise<{ message: string; reservation: Reservation }> {
  const response = await api.post("/api/reservations", payload);
  return response.data;
}

// Admin API - Delete reservation
export async function deleteReservation(id: number): Promise<void> {
  await api.delete(`/api/reservations/${id}`);
}

// === MENU ITEMS API ===

// Get all menu items (admin - auth required)
export async function getMenuItems(): Promise<MenuItem[]> {
  const response = await api.get("/api/menu-items");
  return response.data;
}

// Get all menu items (public - no auth)
export async function getPublicMenuItems(): Promise<MenuItem[]> {
  const response = await api.get("/api/public/menu-items");
  return response.data;
}

// Build FormData from menu item payload
function buildMenuFormData(payload: Partial<MenuItemPayload>): FormData {
  const fd = new FormData();
  if (payload.name !== undefined) fd.append('name', payload.name);
  if (payload.ingredients !== undefined) fd.append('ingredients', payload.ingredients || '');
  if (payload.price !== undefined) fd.append('price', String(payload.price));
  if (payload.is_halal !== undefined) fd.append('is_halal', payload.is_halal ? '1' : '0');
  if (payload.category !== undefined) fd.append('category', payload.category || '');
  if (payload.is_available !== undefined) fd.append('is_available', payload.is_available ? '1' : '0');
  if (payload.order !== undefined) fd.append('order', String(payload.order));
  if (payload.image) fd.append('image', payload.image);
  return fd;
}

// Create menu item
export async function createMenuItem(payload: MenuItemPayload): Promise<MenuItem> {
  const fd = buildMenuFormData(payload);
  const response = await api.post("/api/menu-items", fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

// Update menu item (POST + _method=PUT for file upload support)
export async function updateMenuItem(id: number, payload: Partial<MenuItemPayload>): Promise<MenuItem> {
  const fd = buildMenuFormData(payload);
  fd.append('_method', 'PUT');
  const response = await api.post(`/api/menu-items/${id}`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

// Delete menu item
export async function deleteMenuItem(id: number): Promise<void> {
  await api.delete(`/api/menu-items/${id}`);
}

// === SETTINGS API ===

// Get restaurant settings
export async function getSettings(): Promise<RestaurantSettings> {
  const response = await api.get("/api/settings");
  return response.data;
}

// Update restaurant settings
export async function updateSettings(
  payload: Partial<Omit<RestaurantSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<RestaurantSettings> {
  const response = await api.put("/api/settings", payload);
  return response.data;
}

// SEO checklist — dedicated helper on top of updateSettings so the checklist
// page doesn't have to reload the whole settings object just to toggle one item.
export async function updateSeoChecklist(items: string[]): Promise<RestaurantSettings> {
  const response = await api.put("/api/settings", { seo_checklist: items });
  return response.data;
}

// Restore a no-show reservation
export async function restoreReservation(id: number): Promise<{ message: string; reservation: Reservation }> {
  const response = await api.post(`/api/reservations/${id}/restore`);
  return response.data;
}

// === MENU PDF API ===

// Upload menu PDF
export async function uploadMenuPdf(file: File): Promise<RestaurantSettings> {
  const fd = new FormData();
  fd.append('pdf', file);
  const response = await api.post("/api/settings/menu-pdf", fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

// Delete menu PDF
export async function deleteMenuPdf(): Promise<void> {
  await api.delete("/api/settings/menu-pdf");
}

// === SITE IMAGES API ===

export async function getSiteImages(category?: string): Promise<SiteImage[]> {
  const params = category ? { category } : {};
  const response = await api.get("/api/site-images", { params });
  return response.data;
}

export async function createSiteImage(payload: { category: string; image: File; alt?: string }): Promise<SiteImage> {
  const fd = new FormData();
  fd.append('category', payload.category);
  fd.append('image', payload.image);
  if (payload.alt) fd.append('alt', payload.alt);
  const response = await api.post("/api/site-images", fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function updateSiteImage(id: number, payload: { alt?: string; sort_order?: number }): Promise<SiteImage> {
  const response = await api.put(`/api/site-images/${id}`, payload);
  return response.data;
}

export async function deleteSiteImage(id: number): Promise<void> {
  await api.delete(`/api/site-images/${id}`);
}

export async function reorderSiteImages(category: string, ids: number[]): Promise<void> {
  await api.post("/api/site-images/reorder", { category, ids });
}

export async function getPublicSiteImages(): Promise<SiteImagesGrouped> {
  const response = await api.get("/api/public/site-images");
  return response.data;
}

// Analytics
export interface AnalyticsSummary {
  has_data: boolean;
  message?: string;
  headline?: {
    total_this_month: number;
    total_last_month: number;
    pct_change: number | null;
    avg_party_size: number;
    confirmed_rate: number;
  };
  status_breakdown?: {
    pending: number;
    confirmed: number;
    cancelled: number;
    no_show: number;
  };
  by_day_of_week?: { label: string; count: number }[];
  by_hour?: { label: string; count: number }[];
  recent_activity?: {
    id: number;
    customer_name: string;
    party_size: number;
    arrival_time: string;
    status: string;
    is_event: boolean;
    created_at: string;
  }[];
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const response = await api.get("/api/analytics/summary");
  return response.data;
}

// Public: customer self-serve reservation cancel
export interface CancelReservationResponse {
  message: string;
  arrival_time?: string;
  party_size?: number;
}

export async function cancelPublicReservation(code: string, email: string): Promise<CancelReservationResponse> {
  const response = await api.post("/api/public/reservations/cancel", { code, email });
  return response.data;
}

// Contact / Recruitment (public, rate limited)
export async function submitContact(data: {
  name: string; email: string; phone?: string; subject: string; message: string;
}): Promise<void> {
  await api.post("/api/public/contact", data);
}

export async function submitRecruitment(data: {
  name: string; email: string; phone?: string; position: string; experience: string; message?: string;
}): Promise<void> {
  await api.post("/api/public/recruit", data);
}

// Logo upload/delete
export async function uploadLogo(file: File) {
  const formData = new FormData();
  formData.append("logo", file);
  const response = await api.post("/api/settings/logo", formData);
  return response.data;
}

export async function deleteLogo() {
  const response = await api.delete("/api/settings/logo");
  return response.data;
}

// === ADMIN (platform) API ===

export async function getAdminRestaurants(): Promise<Restaurant[]> {
  const response = await api.get("/api/admin/restaurants");
  return response.data;
}

export async function updateAdminRestaurant(id: number, payload: { status?: string; name?: string }): Promise<Restaurant> {
  const response = await api.put(`/api/admin/restaurants/${id}`, payload);
  return response.data;
}

export async function updateAdminRestaurantModules(id: number, payload: {
  reservations_enabled?: boolean;
  menu_enabled?: boolean;
  website_enabled?: boolean;
  contact_enabled?: boolean;
  gallery_enabled?: boolean;
  events_enabled?: boolean;
  cancellation_enabled?: boolean;
  theme?: 'coffee' | 'noir' | 'sable' | null;
  layout?: 'classic' | 'cinematic' | null;
}): Promise<Restaurant> {
  const response = await api.put(`/api/admin/restaurants/${id}/modules`, payload);
  return response.data;
}

// Public settings (no auth required) — includes module flags so the frontend
// knows which nav items / routes / CTAs to hide.
export async function getPublicSettings(): Promise<import("../contexts/PublicSettingsContext").PublicSettings> {
  const response = await api.get("/api/public/settings");
  return response.data;
}
