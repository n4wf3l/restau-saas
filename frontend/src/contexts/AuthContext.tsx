import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { api, csrf, setOnUnauthorized } from "../lib/api";
import type { User, RegisterPayload } from "../lib/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local flag set once refreshMe returns a user, cleared on 401 or logout.
// Purpose: avoid calling /api/user on boot for visitors who have never logged
// in — that call always 401s for guests and pollutes the console. The flag
// is not a security check (Laravel's HttpOnly session cookie is authoritative).
const AUTH_HINT_KEY = "auth:hint";
function readAuthHint(): boolean {
  try { return localStorage.getItem(AUTH_HINT_KEY) === "1"; } catch { return false; }
}
function setAuthHint(v: boolean): void {
  try { v ? localStorage.setItem(AUTH_HINT_KEY, "1") : localStorage.removeItem(AUTH_HINT_KEY); } catch { /* quota */ }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const clearUser = useCallback(() => {
    setUser(null);
    setAuthHint(false);
  }, []);

  const refreshMe = async () => {
    try {
      const { data } = await api.get<User>("/api/user");
      setUser(data);
      setAuthHint(true);
    } catch {
      setUser(null);
      setAuthHint(false);
    }
  };

  const login = async (email: string, password: string) => {
    await csrf();
    await api.post("/login", { email, password });
    await refreshMe();
  };

  const register = async (payload: RegisterPayload) => {
    await csrf();
    if (payload.logo) {
      const fd = new FormData();
      fd.append('name', payload.name);
      fd.append('email', payload.email);
      fd.append('password', payload.password);
      fd.append('password_confirmation', payload.password_confirmation);
      fd.append('logo', payload.logo);
      await api.post("/register", fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } else {
      await api.post("/register", payload);
    }
    await refreshMe();
  };

  const logout = async () => {
    try {
      await api.post("/logout");
    } finally {
      setUser(null);
    }
  };

  useEffect(() => {
    setOnUnauthorized(clearUser);
    // Only hit /api/user on boot if we've seen a session before. Guests skip
    // the call entirely so no 401 shows in DevTools on the public site.
    if (readAuthHint()) {
      refreshMe().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [clearUser]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
