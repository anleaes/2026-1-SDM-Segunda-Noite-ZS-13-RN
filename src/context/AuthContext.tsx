import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { fetchAccount, loginUser, registerUser } from '@/api/services';
import type { AuthUser, RegisterPayload, UserRole } from '@/api/types';

const STORAGE_KEY = '@museu_auth_user';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshAccount: () => Promise<void>;
  fullName: string;
  roleLabel: string;
  isVisitante: boolean;
  isFuncionario: boolean;
  isArtista: boolean;
  isAdmin: boolean;
  /** Funcionario ou admin: galerias, obras e exposicoes */
  canStaff: boolean;
  /** Alias de canStaff — gestao de galerias */
  canManageGaleria: boolean;
  canRestauracao: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ROLE_LABELS: Record<UserRole, string> = {
  visitante: 'Visitante',
  funcionario: 'Funcionario',
  artista: 'Artista',
  admin: 'Administrador',
  usuario: 'Usuario',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setUser(JSON.parse(raw) as AuthUser);
      })
      .finally(() => setLoading(false));
  }, []);

  const persist = useCallback(async (authUser: AuthUser) => {
    setUser(authUser);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const authUser = await loginUser(username.trim(), password);
      await persist(authUser);
      return authUser;
    },
    [persist],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const authUser = await registerUser(payload);
      await persist(authUser);
      return authUser;
    },
    [persist],
  );

  const logout = useCallback(async () => {
    setUser(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const refreshAccount = useCallback(async () => {
    if (!user?.id) return;
    const fresh = await fetchAccount(user.id);
    await persist(fresh);
  }, [persist, user?.id]);

  const value = useMemo(() => {
    const role = user?.role;
    const isFuncionario = role === 'funcionario';
    const isAdmin = role === 'admin';
    return {
      user,
      loading,
      login,
      register,
      logout,
      refreshAccount,
      fullName: user ? `${user.first_name} ${user.last_name}`.trim() : '',
      roleLabel: role ? ROLE_LABELS[role] ?? role : '',
      isVisitante: role === 'visitante',
      isFuncionario,
      isArtista: role === 'artista',
      isAdmin,
      canStaff: isFuncionario || isAdmin,
      canManageGaleria: isFuncionario || isAdmin,
      canRestauracao: isFuncionario || isAdmin,
    };
  }, [user, loading, login, register, logout, refreshAccount]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
