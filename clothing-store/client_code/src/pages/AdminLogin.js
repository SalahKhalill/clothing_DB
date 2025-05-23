import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/authContext';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAdmin, refreshAuth, isLoggedIn } = useAuth();

  // Check if user is already logged in as admin
  useEffect(() => {
    const checkAuth = async () => {
      if (isLoggedIn && isAdmin) {
        // Already logged in as admin, redirect to dashboard
        navigate('/admin');
      }
    };
    
    checkAuth();
  }, [isLoggedIn, isAdmin, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Login the user
      await login(formData);
      
      // Get the latest auth status
      const isUserAdmin = await refreshAuth();
      
      // Check if user has admin privileges
      if (!isUserAdmin) {
        setError('You are not authorized to access the admin panel');
        localStorage.removeItem('token');
        return;
      }
      
      // Navigate to admin dashboard
      navigate('/admin');
    } catch (error) {
      console.error('Admin login error:', error);
      
      if (error.response) {
        if (error.response.status === 401) {
          setError('Invalid credentials');
        } else if (error.response.data && error.response.data.message) {
          setError(error.response.data.message);
        } else {
          setError(`Server error (${error.response.status})`);
        }
      } else if (error.request) {
        setError('Cannot connect to the server. Please try again later.');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formContainer}>
        <h2 style={styles.title}>Admin Login</h2>
        
        {error && <div style={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label htmlFor="email" style={styles.label}>Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={styles.input}
              placeholder="Enter admin email"
              required
            />
          </div>
          
          <div style={styles.formGroup}>
            <label htmlFor="password" style={styles.label}>Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              style={styles.input}
              placeholder="Enter password"
              required
            />
          </div>
          
          <button 
            type="submit" 
            style={styles.button}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login to Admin Panel'}
          </button>
        </form>
        
        <div style={styles.footer}>
          <p>This login is for administrators only.</p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 'calc(100vh - 100px)',
    padding: '20px',
    backgroundColor: '#f0f2f5'
  },
  formContainer: {
    width: '100%',
    maxWidth: '400px',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    backgroundColor: '#fff',
    border: '1px solid #ddd'
  },
  title: {
    textAlign: 'center',
    marginBottom: '25px',
    color: '#1d3557',
    borderBottom: '2px solid #457b9d',
    paddingBottom: '10px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  label: {
    fontWeight: 'bold',
    fontSize: '0.9rem',
    color: '#333'
  },
  input: {
    padding: '12px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '1rem',
    transition: 'border 0.3s ease'
  },
  button: {
    padding: '12px',
    backgroundColor: '#1d3557',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    marginTop: '10px',
    fontWeight: 'bold'
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#e63946',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '15px',
    textAlign: 'center',
    fontWeight: 'bold'
  },
  footer: {
    marginTop: '20px',
    textAlign: 'center',
    fontSize: '0.9rem',
    color: '#666'
  }
};

export default AdminLogin; 