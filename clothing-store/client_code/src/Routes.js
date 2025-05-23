import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CustomerHeader from './components/CustomerHeader';
import AdminHeader from './components/AdminHeader';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import CustomerRoute from './components/CustomerRoute';
import TestAuth from './pages/TestAuth';
import AdminLogin from './pages/AdminLogin';
import Addresses from './pages/Addresses';
import { useAuth } from './services/authContext';

// Layout component to handle different headers
const Layout = ({ children }) => {
  const { isAdminMode, isLoggedIn } = useAuth();
  
  // Don't show any header for admin login page or when logged out in admin mode
  if (isAdminMode && !isLoggedIn) {
    return <>{children}</>;
  }
  
  return (
    <>
      {isAdminMode ? <AdminHeader /> : <CustomerHeader />}
      {children}
    </>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Admin routes */}
      <Route path="/admin/login" element={<Layout><AdminLogin /></Layout>} />
      <Route path="/admin/*" element={
        <ProtectedRoute requireAdmin>
          <Layout>
            <Routes>
              <Route path="/" element={<AdminDashboard />} />
              <Route path="/products/new" element={<AdminDashboard />} />
              <Route path="/products/edit/:id" element={<AdminDashboard />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Customer routes */}
      <Route path="/" element={<Layout><CustomerRoute><Home /></CustomerRoute></Layout>} />
      <Route path="/products" element={<Layout><CustomerRoute><Products /></CustomerRoute></Layout>} />
      <Route path="/products/:id" element={<Layout><CustomerRoute><ProductDetail /></CustomerRoute></Layout>} />
      <Route path="/login" element={<Layout><CustomerRoute><Login /></CustomerRoute></Layout>} />
      <Route path="/register" element={<Layout><CustomerRoute><Register /></CustomerRoute></Layout>} />
      <Route path="/test-auth" element={<Layout><CustomerRoute><TestAuth /></CustomerRoute></Layout>} />
      <Route path="/cart" element={
        <ProtectedRoute>
          <Layout><CustomerRoute><Cart /></CustomerRoute></Layout>
        </ProtectedRoute>
      } />
      <Route path="/wishlist" element={
        <ProtectedRoute>
          <Layout><CustomerRoute><Wishlist /></CustomerRoute></Layout>
        </ProtectedRoute>
      } />
      <Route path="/addresses" element={
        <ProtectedRoute>
          <Layout><CustomerRoute><Addresses /></CustomerRoute></Layout>
        </ProtectedRoute>
      } />
      
      {/* Catch all route - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes; 