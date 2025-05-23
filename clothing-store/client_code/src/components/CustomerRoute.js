import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../services/authContext';

const CustomerRoute = ({ children }) => {
  const { isLoggedIn, isAdmin, loading, logout } = useAuth();
  const location = useLocation();
  
  useEffect(() => {
    console.log("CustomerRoute at:", location.pathname);
    console.log("Customer auth state:", { isLoggedIn, isAdmin, loading });
    

    if (isLoggedIn && isAdmin) {
      const publicPaths = ['/products', '/products/'];
      const isPublicPath = publicPaths.some(path => location.pathname === path || location.pathname.startsWith('/products/'));
      
      if (!isPublicPath) {
        console.log("Admin user accessing customer-only page:", location.pathname);
        // Uncomment this to re-enable admin logout: logout();
      }
    }
  }, [isLoggedIn, isAdmin, logout, location.pathname]);

  if (loading) {
    console.log("CustomerRoute: Loading auth state...");
    return (
      <div style={styles.loadingContainer}>
        <p>Loading...</p>
      </div>
    );
  }

  // If user is logged in as admin, redirect to admin dashboard
  if (isLoggedIn && isAdmin) {
    console.log("CustomerRoute: Admin user detected, redirecting to admin dashboard");
    return <Navigate to="/admin" replace />;
  }

  // Not an admin or not logged in - render the customer component
  console.log("CustomerRoute: Rendering customer content");
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

export default CustomerRoute; 