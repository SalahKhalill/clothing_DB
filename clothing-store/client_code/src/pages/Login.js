import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/authContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Simple validation
    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      console.log('Submitting login with:', { email: formData.email });
      
      // Use the login function from auth context
      const response = await login(formData);
      
      // Check if user is admin
      if (response.data.user && (response.data.user.role === 'admin' || response.data.user.role === 'ADMIN' || response.data.user.isAdmin)) {
        // If admin, show message and logout
        setError('Admins must log in from the admin panel');
        localStorage.removeItem('token');
        return;
      }
      
      // Redirect to products page
      navigate('/products');
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.response) {
        // The server responded with an error status code
        if (error.response.status === 401) {
          setError('Invalid email or password. Please try again.');
        } else if (error.response.data && error.response.data.message) {
          setError(error.response.data.message);
        } else {
          setError(`Server error (${error.response.status}). Please try again later.`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        setError('Could not connect to the server. Please check your internet connection.');
      } else {
        // Something happened in setting up the request
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formContainer}>
        <h2 style={styles.title}>Customer Login</h2>
        
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
              placeholder="Enter your email"
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
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button 
            type="submit" 
            style={styles.button}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div style={styles.footer}>
          <p>Don't have an account? <Link to="/register" style={styles.link}>Register</Link></p>
          <p style={styles.adminNote}>Are you an admin? <Link to="/admin/login" style={styles.link}>Admin Login</Link></p>
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
    padding: '20px'
  },
  formContainer: {
    width: '100%',
    maxWidth: '400px',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    backgroundColor: '#fff'
  },
  title: {
    textAlign: 'center',
    marginBottom: '25px',
    color: '#333'
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
    color: '#555'
  },
  input: {
    padding: '10px 12px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '1rem'
  },
  button: {
    padding: '12px',
    backgroundColor: '#1d3557',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    marginTop: '10px'
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#e63946',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '15px',
    textAlign: 'center'
  },
  footer: {
    marginTop: '20px',
    textAlign: 'center',
    fontSize: '0.9rem',
    color: '#666'
  },
  link: {
    color: '#457b9d',
    textDecoration: 'none',
    fontWeight: 'bold'
  },
  adminNote: {
    marginTop: '10px',
    fontSize: '0.85rem'
  }
};

export default Login; 