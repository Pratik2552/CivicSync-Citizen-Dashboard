// src/context/AuthContext.jsx
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
      if (data.token) {
        localStorage.setItem('civicsync_token', data.token);
        localStorage.setItem('civicsync_user', JSON.stringify(data.user));
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: 'Token missing in response' };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async ({ full_name, email, password }) => {
    setLoading(true);
    try {
      const data = await api.signup(full_name, email, password);
      if (data.token) {
        localStorage.setItem('civicsync_token', data.token);
        localStorage.setItem('civicsync_user', JSON.stringify(data.user));
        setUser(data.user);
        return { success: true };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('civicsync_token');
    localStorage.removeItem('civicsync_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);