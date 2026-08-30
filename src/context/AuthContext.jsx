import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('civicsync_user');
    const token = localStorage.getItem('civicsync_token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await api.login(email, password);
      // API now returns access_token (Supabase session token)
      const token = data?.access_token || data?.token;
      if (token && data.user) {
        localStorage.setItem('civicsync_token', token);
        localStorage.setItem('civicsync_user', JSON.stringify(data.user));
        if (data.refresh_token) localStorage.setItem('civicsync_refresh_token', data.refresh_token);
        if (data.expires_at)   localStorage.setItem('civicsync_token_expires_at', data.expires_at);
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: 'Authentication failed' };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const loginWithToken = async (token, userData) => {
    localStorage.setItem('civicsync_token', token);
    localStorage.setItem('civicsync_user', JSON.stringify(userData));
    setUser(userData);
  };

  const register = async ({ full_name, email, password }) => {
    setLoading(true);
    try {
      // Signup no longer returns a token — user must confirm email first
      await api.signup(full_name, email, password);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('civicsync_token');
    localStorage.removeItem('civicsync_refresh_token');
    localStorage.removeItem('civicsync_token_expires_at');
    localStorage.removeItem('civicsync_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithToken, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
