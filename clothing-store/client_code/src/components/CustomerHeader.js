import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/authContext';
import '../styles/CustomerHeader.css';

const CustomerHeader = () => {
  const { isLoggedIn, logout, currentUser } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && 
          !event.target.classList.contains('hamburger-icon') && 
          !event.target.parentElement.classList.contains('hamburger-icon')) {
        setMobileMenuOpen(false);
      }
      
      if (searchRef.current && !searchRef.current.contains(event.target) && 
          !event.target.classList.contains('search-icon')) {
        setSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus search input when search is opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

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
    navigate('/');
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
  };

  const handleNavLinkClick = () => {
    setMobileMenuOpen(false);
  };
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="customer-header">
      <div className="logo">
        <Link to="/" className="logo-link">Clothing Store</Link>
      </div>
      
      {/* Search Component */}
      <div className="search-container" ref={searchRef}>
        <button 
          className="search-icon-btn" 
          onClick={toggleSearch} 
          aria-label="Search"
        >
          <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
        
        <form 
          className={`search-form ${searchOpen ? 'open' : ''}`} 
          onSubmit={handleSearchSubmit}
        >
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            placeholder="Search for products..."
            aria-label="Search for products"
          />
          <button type="submit" className="search-submit" aria-label="Submit search">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </form>
      </div>
      
      {/* Hamburger Menu Icon */}
      <div className="hamburger-icon" onClick={toggleMobileMenu}>
        <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`}></span>
        <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`}></span>
        <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`}></span>
      </div>
      
      {/* Mobile Menu */}
      <div 
        ref={mobileMenuRef}
        className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}
      >
        {/* Mobile Search Form */}
        <div className="mobile-search-container">
          <form 
            className="mobile-search-form" 
            onSubmit={handleSearchSubmit}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mobile-search-input"
              placeholder="Search for products..."
              aria-label="Search for products"
            />
            <button type="submit" className="mobile-search-submit" aria-label="Submit search">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </form>
        </div>
        
        <nav className="mobile-nav">
          <ul className="mobile-nav-list">
            <li className="mobile-nav-item">
              <Link to="/" className="mobile-nav-link" onClick={handleNavLinkClick}>Home</Link>
            </li>
            <li className="mobile-nav-item">
              <Link to="/products" className="mobile-nav-link" onClick={handleNavLinkClick}>Products</Link>
            </li>
            
            {isLoggedIn ? (
              <>
                <li className="mobile-nav-item">
                  <Link to="/cart" className="mobile-nav-link" onClick={handleNavLinkClick}>Cart</Link>
                </li>
                <li className="mobile-nav-item">
                  <Link to="/wishlist" className="mobile-nav-link" onClick={handleNavLinkClick}>Wishlist</Link>
                </li>
                <li className="mobile-nav-item">
                  <Link to="/account/orders" className="mobile-nav-link" onClick={handleNavLinkClick}>My Orders</Link>
                </li>
                <li className="mobile-nav-item">
                  <Link to="/addresses" className="mobile-nav-link" onClick={handleNavLinkClick}>Addresses</Link>
                </li>
                <li className="mobile-nav-item">
                  <button onClick={handleLogout} className="mobile-logout-btn">Logout</button>
                </li>
              </>
            ) : (
              <>
                <li className="mobile-nav-item">
                  <Link to="/login" className="mobile-nav-link" onClick={handleNavLinkClick}>Login</Link>
                </li>
                <li className="mobile-nav-item">
                  <Link to="/register" className="mobile-nav-link" onClick={handleNavLinkClick}>Register</Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
      
      {/* Desktop Navigation */}
      <nav className="desktop-nav">
        <ul className="nav-list">
          <li className="nav-item">
            <Link to="/" className="nav-link">Home</Link>
          </li>
          <li className="nav-item">
            <Link to="/products" className="nav-link">Products</Link>
          </li>
          
          {isLoggedIn ? (
            <>
              <li className="nav-item">
                <Link to="/cart" className="nav-link">Cart</Link>
              </li>
              <li className="nav-item">
                <Link to="/wishlist" className="nav-link">Wishlist</Link>
              </li>
              <li className="nav-item" ref={dropdownRef}>
                <button onClick={toggleDropdown} className="dropdown-button">
                  My Account <span className="caret-down">▼</span>
                </button>
                
                {dropdownOpen && (
                  <div className="dropdown">
                    <Link 
                      to="/account/orders" 
                      className="dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      My Orders
                    </Link>
                    <Link 
                      to="/addresses" 
                      className="dropdown-item" 
                      onClick={() => setDropdownOpen(false)}
                    >
                      Addresses
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="dropdown-logout"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link to="/login" className="nav-link">Login</Link>
              </li>
              <li className="nav-item">
                <Link to="/register" className="nav-link">Register</Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default CustomerHeader; 