import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          
          // If we have a refresh token, start the refresh timer
          const refreshToken = sessionStorage.getItem('refreshToken') || localStorage.getItem('refreshToken');
          if (refreshToken) {
            setupRefreshTimer();
          }
        } catch (err) {
          logout();
        }
      }
      setLoading(false);
    };
    checkLoggedIn();
    
    return () => {
      if (window.refreshTimer) clearTimeout(window.refreshTimer);
    };
  }, []);

  const setupRefreshTimer = () => {
    if (window.refreshTimer) clearTimeout(window.refreshTimer);
    
    // Refresh 1 minute before expiry (assuming 24h tokens, but let's do every 20h for safety)
    // In a real app, you'd decode the JWT to get exact expiry
    window.refreshTimer = setTimeout(async () => {
      const refreshToken = sessionStorage.getItem('refreshToken') || localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const res = await api.post('/auth/refresh', { refreshToken });
          const { token, refreshToken: newRefreshToken } = res.data;
          
          const isPersistent = !!localStorage.getItem('refreshToken');
          if (isPersistent) {
            localStorage.setItem('token', token);
            localStorage.setItem('refreshToken', newRefreshToken);
          } else {
            sessionStorage.setItem('token', token);
            sessionStorage.setItem('refreshToken', newRefreshToken);
          }
          setupRefreshTimer();
        } catch (err) {
          logout();
        }
      }
    }, 20 * 60 * 60 * 1000); // 20 hours
  };

  const login = async (email, password, rememberMe) => {
    const res = await api.post('/auth/login', { email, password, rememberMe });
    const { token, refreshToken, user: userData } = res.data;
    
    if (rememberMe) {
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
    } else {
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('refreshToken', refreshToken);
    }
    
    setUser(userData);
    setupRefreshTimer();
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
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('original_token');
    if (window.refreshTimer) clearTimeout(window.refreshTimer);
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      return res.data.user;
    } catch (err) {
      console.error("Failed to refresh profile", err);
    }
  };

  const value = React.useMemo(() => ({ 
    user, 
    login, 
    logout, 
    loading, 
    setImpersonationToken, 
    stopImpersonation,
    refreshProfile
  }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
