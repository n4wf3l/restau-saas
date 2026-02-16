import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { api, csrf } from "../lib/api";
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

  const refreshMe = async () => {
    try {
      const { data } = await api.get<User>("/api/user");
      setUser(data);
    } catch (error: any) {
      // 401 est normal quand l'utilisateur n'est pas connecté
      if (error.response?.status !== 401) {
        console.error("RefreshMe error:", error.response?.data || error.message);
      }
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await csrf();
      await api.post("/login", { email, password });
      await refreshMe();
    } catch (error: any) {
      console.error("Login error:", error.response?.data || error.message);
      throw error;
    }
  };

  const register = async (payload: RegisterPayload) => {
    try {
      console.log("Calling CSRF...");
      await csrf();
      console.log("CSRF done, calling register...");
      await api.post("/register", payload);
      console.log("Register done, fetching user...");
      await refreshMe();
      console.log("User fetched successfully");
    } catch (error: any) {
      console.error("Register error:", error.response?.data || error.message);
      throw error;
    }
  };

  const logout = async () => {
    await api.post("/logout");
    setUser(null);
  };

  useEffect(() => {
    refreshMe().finally(() => setLoading(false));
  }, []);

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
