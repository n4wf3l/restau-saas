import axios from "axios";
import type { Reservation, PublicTable, ReservationPayload, EventReservationPayload, MenuItem, MenuItemPayload, RestaurantSettings } from "./types";

export const api = axios.create({
  baseURL: "http://localhost:8000",
  withCredentials: true, // super important (cookies)
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Intercepteur pour ajouter le token XSRF depuis les cookies
api.interceptors.request.use((config) => {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("XSRF-TOKEN="))
    ?.split("=")[1];

  if (token) {
    config.headers["X-XSRF-TOKEN"] = decodeURIComponent(token);
  }

  return config;
});

// Intercepteur pour gérer les sessions expirées (401)
let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(callback: () => void) {
  onUnauthorized = callback;
}

api.interceptors.response.use(
  (response) => response,
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
  // obligatoire avant login/register (CSRF cookie)
  await api.get("/sanctum/csrf-cookie");
}

// === RESERVATIONS API ===

// Public API - Get all tables with their reservations
export async function getPublicTables(): Promise<PublicTable[]> {
  const response = await api.get("/api/public/tables");
  return response.data;
}

// Public API - Create a reservation
export async function createReservation(payload: ReservationPayload): Promise<{ message: string; reservation: any }> {
  await csrf(); // CSRF protection
  const response = await api.post("/api/public/reservations", payload);
  return response.data;
}

// Public API - Create an event reservation request
export async function createEventReservation(payload: EventReservationPayload): Promise<{ message: string; reservation: any }> {
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

// Admin API - Update reservation status
export async function updateReservationStatus(id: number, status: string): Promise<any> {
  const response = await api.put(`/api/reservations/${id}`, { status });
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
  await csrf();
  const response = await api.put("/api/settings", payload);
  return response.data;
}

// Restore a no-show reservation
export async function restoreReservation(id: number): Promise<any> {
  const response = await api.post(`/api/reservations/${id}/restore`);
  return response.data;
}

// Public settings (no auth required)
export async function getPublicSettings(): Promise<{
  reservations_enabled: boolean;
  auto_optimize_tables: boolean;
  service_duration_minutes: number;
}> {
  const response = await api.get("/api/public/settings");
  return response.data;
}
