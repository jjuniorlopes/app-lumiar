import React, { useState, useEffect, useCallback, useContext, createContext } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  organization_id: number | null;
  organization: string | null;
  email_verified: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, organization_name: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || '';

const STORAGE_KEYS = {
  TOKEN: 'lumiar_access_token',
  REFRESH_TOKEN: 'lumiar_refresh_token',
  USER: 'lumiar_user'
};

// ========== UTILITIES ==========

async function request(path: string, opts: any = {}, token?: string) {
  const headers: Record<string, string> = {
    ...(!(opts.body instanceof FormData) && { 'Content-Type': 'application/json' }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(opts.headers || {})
  };

  const response = await fetch(`${API_URL}/api/v1${path}`, {
    ...opts,
    headers
  });

  let data: any;
  try {
    data = await response.json();
  } catch (err) {
    data = { detail: response.statusText || 'Erro na resposta do servidor' };
  }

  if (!response.ok) {
    let msg = 'Erro na requisição';
    if (typeof data?.detail === 'string') {
      msg = data.detail;
    } else if (Array.isArray(data?.detail) && data.detail[0]?.msg) {
      msg = data.detail[0].msg;
    } else if (data?.message) {
      msg = data.message;
    }
    const error: any = new Error(msg);
    error.status = response.status;
    throw error;
  }
  return data;
}

// ========== HOOKS ==========

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar token do localStorage ao iniciar
  useEffect(() => {
    const savedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const savedRefreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    const savedUser = localStorage.getItem(STORAGE_KEYS.USER);

    if (savedToken && savedUser) {
      setToken(savedToken);
      setRefreshToken(savedRefreshToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password })
      });

      localStorage.setItem(STORAGE_KEYS.TOKEN, data.access_token);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));

      setToken(data.access_token);
      setRefreshToken(data.refresh_token);
      setUser(data.user);
    } catch (err: any) {
      const errorMsg = err.message || 'Falha ao autenticar';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, organization_name: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await request('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            name,
            email: email.trim(),
            password,
            organization_name
          })
        });

        localStorage.setItem(STORAGE_KEYS.TOKEN, data.access_token);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));

        setToken(data.access_token);
        setRefreshToken(data.refresh_token);
        setUser(data.user);
      } catch (err: any) {
        const errorMsg = err.message || 'Falha ao registrar';
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    setError(null);
  }, []);

  return {
    user,
    token,
    refreshToken,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!token
  };
}

// ========== PROVIDER ==========

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  return React.createElement(AuthContext.Provider, { value: auth }, children);
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext deve ser usado dentro de um AuthProvider');
  }
  return context;
}
