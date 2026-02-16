import { api, csrf } from "./api";

export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export async function login(email: string, password: string): Promise<User> {
  await csrf();
  await api.post("/login", { email, password });
  // ensuite récupérer l'utilisateur
  const { data } = await api.get<User>("/api/user");
  return data;
}

export async function register(payload: RegisterPayload): Promise<User> {
  await csrf();
  await api.post("/register", payload);
  const { data } = await api.get<User>("/api/user");
  return data;
}

export async function logout(): Promise<void> {
  await api.post("/logout");
}

export async function getCurrentUser(): Promise<User> {
  const { data } = await api.get<User>("/api/user");
  return data;
}
