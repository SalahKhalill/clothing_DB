import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/authContext';
import '../styles/AdminHeader.css';

const AdminHeader = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);
  
  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && 
          !event.target.classList.contains('admin-hamburger-icon') && 
          !event.target.parentElement.classList.contains('admin-hamburger-icon')) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [mobileMenuOpen]);
  
  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/admin/login');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleNavLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="admin-header">
      <div className="admin-logo">
        <Link to="/admin" className="admin-logo-link">Admin Dashboard</Link>
      </div>
      
      {/* Hamburger Menu Icon */}
      <div className="admin-hamburger-icon" onClick={toggleMobileMenu}>
        <span className={`admin-hamburger-bar ${mobileMenuOpen ? 'open' : ''}`}></span>
        <span className={`admin-hamburger-bar ${mobileMenuOpen ? 'open' : ''}`}></span>
        <span className={`admin-hamburger-bar ${mobileMenuOpen ? 'open' : ''}`}></span>
      </div>
      
      {/* Mobile Menu */}
      <div 
        ref={mobileMenuRef}
        className={`admin-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}
      >
        <nav className="admin-mobile-nav">
          <ul className="admin-mobile-nav-list">
            <li className="admin-mobile-nav-item">
              <Link to="/admin" className="admin-mobile-nav-link" onClick={handleNavLinkClick}>
                Dashboard
              </Link>
            </li>
            <li className="admin-mobile-nav-item">
              <Link to="/admin/products/new" className="admin-mobile-nav-link" onClick={handleNavLinkClick}>
                Add Product
              </Link>
            </li>
            <li className="admin-mobile-nav-item">
              <button onClick={handleLogout} className="admin-mobile-logout-btn">
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </div>
      
      {/* Desktop Navigation */}
      <nav className="admin-desktop-nav">
        <ul className="admin-nav-list">
          <li className="admin-nav-item">
            <Link to="/admin" className="admin-nav-link">Dashboard</Link>
          </li>
          <li className="admin-nav-item">
            <Link to="/admin/products/new" className="admin-nav-link">Add Product</Link>
          </li>
          <li className="admin-nav-item">
            <button onClick={handleLogout} className="admin-logout-button">
              Logout
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default AdminHeader; 