import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { api, getToken, setToken } from "./api";
import type { UserProfile, VehicleInfo } from "./types";

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (b: {
    full_name: string; email: string; phone: string; password: string;
    city: string; date_of_birth?: string; vehicle?: VehicleInfo;
  }) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  setUser: (u: UserProfile) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) { setUserState(null); setLoading(false); return; }
    try {
      const me = await api.auth.me();
      setUserState(me);
    } catch {
      setToken(null);
      setUserState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const { access_token } = await api.auth.login(email, password);
    setToken(access_token);
    const me = await api.auth.me();
    setUserState(me);
  }, []);

  const register = useCallback(async (b: Parameters<AuthState["register"]>[0]) => {
    const { access_token } = await api.auth.register(b);
    setToken(access_token);
    const me = await api.auth.me();
    setUserState(me);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUserState(null);
  }, []);

  const value: AuthState = {
    user, loading, login, register, logout, refresh,
    setUser: setUserState,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
