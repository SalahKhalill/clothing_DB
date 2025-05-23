import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/authContext';

const NavBar = () => {
  const { isLoggedIn, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    // Redirect to home page
    navigate('/');
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.logo}>
        <Link to="/" style={styles.logoLink}>Clothing Store</Link>
      </div>
      <ul style={styles.navLinks}>
        <li>
          <Link to="/" style={styles.link}>Home</Link>
        </li>
        <li>
          <Link to="/products" style={styles.link}>Products</Link>
        </li>
        <li>
          <Link to="/test-auth" style={styles.link}>Test Auth</Link>
        </li>
        {isLoggedIn ? (
          <>
            <li>
              <Link to="/cart" style={styles.link}>Cart</Link>
            </li>
            <li>
              <Link to="/wishlist" style={styles.link}>Wishlist</Link>
            </li>
            <li>
              <Link to="/orders" style={styles.link}>Orders</Link>
            </li>
            {isAdmin && (
              <li>
                <Link to="/admin" style={styles.link}>Admin Dashboard</Link>
              </li>
            )}
            <li>
              <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
            </li>
          </>
        ) : (
          <>
            <li>
              <Link to="/login" style={styles.link}>Login</Link>
            </li>
            <li>
              <Link to="/register" style={styles.link}>Register</Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

const styles = {
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: '#333',
    color: '#fff'
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: 'bold'
  },
  logoLink: {
    color: '#fff',
    textDecoration: 'none'
  },
  navLinks: {
    display: 'flex',
    listStyle: 'none',
    gap: '20px'
  },
  link: {
    color: '#fff',
    textDecoration: 'none'
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '1rem'
  }
};

export default NavBar; 