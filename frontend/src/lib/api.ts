import axios from "axios";
import type { Reservation, PublicTable, ReservationPayload, EventReservationPayload, MenuItem, MenuItemPayload } from "./types";

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
export async function getReservations(): Promise<Reservation[]> {
  const response = await api.get("/api/reservations");
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

// Get all menu items
export async function getMenuItems(): Promise<MenuItem[]> {
  const response = await api.get("/api/menu-items");
  return response.data;
}

// Create menu item
export async function createMenuItem(payload: MenuItemPayload): Promise<MenuItem> {
  const response = await api.post("/api/menu-items", payload);
  return response.data;
}

// Update menu item
export async function updateMenuItem(id: number, payload: Partial<MenuItemPayload>): Promise<MenuItem> {
  const response = await api.put(`/api/menu-items/${id}`, payload);
  return response.data;
}

// Delete menu item
export async function deleteMenuItem(id: number): Promise<void> {
  await api.delete(`/api/menu-items/${id}`);
}
