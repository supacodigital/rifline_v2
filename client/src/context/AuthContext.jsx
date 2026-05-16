import { createContext, useContext, useState, useEffect } from 'react';
import { setAccessToken, clearAccessToken } from '../services/api';
import * as authService from '../services/auth.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const data = await authService.refreshToken();
        if (data.accessToken) {
          setAccessToken(data.accessToken);
          if (data.user) {
            setUser(data.user);
          } else {
            const me = await authService.getMe();
            if (me && !me.error) setUser(me);
          }
        }
      } catch {
        // Pas de session active, normal
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    if (data.accessToken) {
      setAccessToken(data.accessToken);
      setUser(data.user);
    }
    return data;
  };

  const register = async (formData) => {
    const data = await authService.register(formData);
    if (data.accessToken) {
      setAccessToken(data.accessToken);
      setUser(data.user);
    }
    return data;
  };

  const logout = async () => {
    await authService.logout();
    clearAccessToken();
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
};
