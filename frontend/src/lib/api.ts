import axios from "axios";

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
  // Récupérer le token XSRF depuis les cookies
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("XSRF-TOKEN="))
    ?.split("=")[1];
  
  if (token) {
    config.headers["X-XSRF-TOKEN"] = decodeURIComponent(token);
  }
  
  return config;
});

export async function csrf() {
  // obligatoire avant login/register (CSRF cookie)
  await api.get("/sanctum/csrf-cookie");
}
