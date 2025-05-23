import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from './api';

// Create auth context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check auth status on mount or when token changes
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Check if current route is admin route
  useEffect(() => {
    const checkIfAdminRoute = () => {
      const path = window.location.pathname;
      setIsAdminMode(path.startsWith('/admin'));
    };

    checkIfAdminRoute();
    
    // Listen for route changes
    window.addEventListener('popstate', checkIfAdminRoute);
    
    return () => {
      window.removeEventListener('popstate', checkIfAdminRoute);
    };
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setCurrentUser(null);
      setIsLoggedIn(false);
      setIsAdmin(false);
      setLoading(false);
      return false; // Return isAdmin status
    }

    try {
      const response = await authService.getCurrentUser();
      setCurrentUser(response.data);
      setIsLoggedIn(true);
      
      // Check if user is admin
      const userIsAdmin = 
        response.data.isAdmin === true || 
        response.data.role === 'admin' ||
        response.data.role === 'ADMIN';
      
      setIsAdmin(userIsAdmin);
      
      // Check if current path is admin route
      const isAdminPath = window.location.pathname.startsWith('/admin');
      setIsAdminMode(isAdminPath);
      
      // If in admin section but not admin, redirect to login
      if (isAdminPath && !userIsAdmin) {
        logout();
        window.location.href = '/admin/login';
      }
      
      return userIsAdmin; // Return isAdmin status
    } catch (error) {
      console.error('Auth check error:', error);
      // Clear token if it's invalid
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
      }
      setCurrentUser(null);
      setIsLoggedIn(false);
      setIsAdmin(false);
      return false; // Return isAdmin status
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    localStorage.setItem('token', response.data.token);
    await checkAuthStatus(); // Refresh auth state
    return response;
  };

  const register = async (userData) => {
    const response = await authService.register(userData);
    return response;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setIsLoggedIn(false);
    setIsAdmin(false);
    
    // Redirect based on current mode
    if (isAdminMode) {
      setIsAdminMode(false);
      window.location.href = '/admin/login';
    } else {
      window.location.href = '/';
    }
  };

  const value = {
    currentUser,
    isLoggedIn,
    isAdmin,
    isAdminMode,
    loading,
    login,
    register,
    logout,
    refreshAuth: checkAuthStatus,
    setIsAdminMode
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 