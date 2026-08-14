import React, { createContext, useContext, useState } from 'react';
import { mockUser } from '../data/mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // In production this would validate against a real backend.
  // For now we use mock user data.
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = async (phone, password) => {
    setLoading(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 800));
    setUser(mockUser);
    setLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
