'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { login as apiLogin, setToken, clearToken } from '@/lib/api';
import type { AuthUser } from '@/types';

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({
  user: null, loading: true,
  login: async () => {}, logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('muchsharim_user');
    const token  = localStorage.getItem('muchsharim_token');
    if (stored && token) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (email: string) => {
    const res = await apiLogin(email);
    setToken(res.token);
    const u: AuthUser = {
      employee_id: res.user.employee_id,
      email:       res.user.email,
      name:        res.user.name,
      first_name:  res.user.name?.split(' ')[0] || '',
      last_name:   res.user.name?.split(' ').slice(1).join(' ') || '',
      department:  '',
      is_admin:    res.user.is_admin,
    };
    localStorage.setItem('muchsharim_user', JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
