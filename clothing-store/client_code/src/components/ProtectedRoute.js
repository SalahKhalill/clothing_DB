import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../services/authContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isLoggedIn, isAdmin, loading } = useAuth();
  const location = useLocation();
  
  useEffect(() => {
    console.log("ProtectedRoute at:", location.pathname);
    console.log("Auth state:", { isLoggedIn, isAdmin, loading });
  }, [location.pathname, isLoggedIn, isAdmin, loading]);

  if (loading) {
    console.log("ProtectedRoute: Loading auth state...");
    return (
      <div style={styles.loadingContainer}>
        <p>Loading...</p>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isLoggedIn) {
    console.log("ProtectedRoute: User not logged in, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // Authenticated but not admin when admin is required
  if (requireAdmin && !isAdmin) {
    console.log("ProtectedRoute: Admin access required but user is not admin");
    return <Navigate to="/" replace />;
  }

  // Authenticated (and admin if required) - render the protected component
  console.log("ProtectedRoute: Rendering protected content");
  return children;
};

const styles = {
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh'
  }
};

export default ProtectedRoute; 