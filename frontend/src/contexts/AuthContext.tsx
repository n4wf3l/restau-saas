import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const clearUser = useCallback(() => {
    setUser(null);
  }, []);

  const refreshMe = async () => {
    try {
      const { data } = await api.get<User>("/api/user");
      setUser(data);
    } catch {
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    await csrf();
    await api.post("/login", { email, password });
    await refreshMe();
  };

  const register = async (payload: RegisterPayload) => {
    await csrf();
    await api.post("/register", payload);
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
    refreshMe().finally(() => setLoading(false));
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
