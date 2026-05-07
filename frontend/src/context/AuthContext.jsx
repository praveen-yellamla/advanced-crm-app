import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
        } catch (err) {
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkLoggedIn();
  }, []);

  const login = async (email, password, rememberMe) => {
    const res = await api.post('/auth/login', { email, password, rememberMe });
    const { token, user: userData } = res.data;
    
    if (rememberMe) {
      localStorage.setItem('token', token);
    } else {
      sessionStorage.setItem('token', token);
    }
    
    setUser(userData);
    return userData;
  };

  const setImpersonationToken = async (token) => {
    // Impersonation is always session-based (sessionStorage)
    const originalToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!sessionStorage.getItem('original_token')) {
      sessionStorage.setItem('original_token', originalToken);
    }
    
    sessionStorage.setItem('token', token);
    const res = await api.get('/auth/me');
    setUser(res.data.user);
  };

  const stopImpersonation = async () => {
    const originalToken = sessionStorage.getItem('original_token');
    if (originalToken) {
      sessionStorage.setItem('token', originalToken);
      sessionStorage.removeItem('original_token');
      const res = await api.get('/auth/me');
      setUser(res.data.user);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('original_token');
    setUser(null);
  };

  const value = React.useMemo(() => ({ 
    user, 
    login, 
    logout, 
    loading, 
    setImpersonationToken, 
    stopImpersonation 
  }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
