import React, { useState } from 'react';
import axios from 'axios';

const TestAuth = () => {
  const [testResult, setTestResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const testServerConnection = async () => {
    setLoading(true);
    setTestResult('Testing server connection...');
    
    try {
      const response = await axios.get('http://localhost:5002/health');
      setTestResult(`Server connection successful! Response: ${JSON.stringify(response.data)}`);
    } catch (error) {
      setTestResult(`Server connection failed: ${error.message}`);
      console.error('Server connection test error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testRegistration = async () => {
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setTestResult('Please fill all required fields for registration test');
      return;
    }
    
    setLoading(true);
    setTestResult('Testing registration...');
    
    try {
      const response = await axios.post('http://localhost:5002/api/auth/register', {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber || ''
      });
      
      setTestResult(`Registration successful! Response: ${JSON.stringify(response.data)}`);
    } catch (error) {
      if (error.response) {
        setTestResult(`Registration failed: ${JSON.stringify(error.response.data)}`);
      } else {
        setTestResult(`Registration failed: ${error.message}`);
      }
      console.error('Registration test error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    if (!formData.email || !formData.password) {
      setTestResult('Please provide email and password for login test');
      return;
    }
    
    setLoading(true);
    setTestResult('Testing login...');
    
    try {
      const response = await axios.post('http://localhost:5002/api/auth/login', {
        email: formData.email,
        password: formData.password
      });
      
      setTestResult(`Login successful! Token: ${response.data.token.substring(0, 20)}...`);
      
      // Also test the current user endpoint with the token
      if (response.data.token) {
        try {
          const userResponse = await axios.get('http://localhost:5002/api/auth/current', {
            headers: {
              Authorization: `Bearer ${response.data.token}`
            }
          });
          
          setTestResult(prev => `${prev}\n\nCurrent user fetch successful: ${JSON.stringify(userResponse.data)}`);
        } catch (userError) {
          setTestResult(prev => `${prev}\n\nCurrent user fetch failed: ${JSON.stringify(userError.response?.data || userError.message)}`);
        }
      }
    } catch (error) {
      if (error.response) {
        setTestResult(`Login failed: ${JSON.stringify(error.response.data)}`);
      } else {
        setTestResult(`Login failed: ${error.message}`);
      }
      console.error('Login test error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Authentication Test Tool</h2>
      
      <div style={styles.form}>
        <div style={styles.formGroup}>
          <label>Email:</label>
          <input 
            type="email" 
            name="email" 
            value={formData.email} 
            onChange={handleChange} 
            style={styles.input} 
          />
        </div>
        
        <div style={styles.formGroup}>
          <label>Password:</label>
          <input 
            type="password" 
            name="password" 
            value={formData.password} 
            onChange={handleChange} 
            style={styles.input} 
          />
        </div>
        
        <div style={styles.formGroup}>
          <label>First Name (for registration):</label>
          <input 
            type="text" 
            name="firstName" 
            value={formData.firstName} 
            onChange={handleChange} 
            style={styles.input} 
          />
        </div>
        
        <div style={styles.formGroup}>
          <label>Last Name (for registration):</label>
          <input 
            type="text" 
            name="lastName" 
            value={formData.lastName} 
            onChange={handleChange} 
            style={styles.input} 
          />
        </div>
        
        <div style={styles.formGroup}>
          <label>Phone Number (optional for registration):</label>
          <input 
            type="text" 
            name="phoneNumber" 
            value={formData.phoneNumber} 
            onChange={handleChange} 
            style={styles.input} 
          />
        </div>
        
        <div style={styles.buttonGroup}>
          <button 
            onClick={testServerConnection} 
            disabled={loading} 
            style={styles.button}
          >
            Test Server Connection
          </button>
          
          <button 
            onClick={testRegistration} 
            disabled={loading} 
            style={styles.button}
          >
            Test Registration
          </button>
          
          <button 
            onClick={testLogin} 
            disabled={loading} 
            style={styles.button}
          >
            Test Login
          </button>
        </div>
      </div>
      
      <div style={styles.resultContainer}>
        <h3>Test Results:</h3>
        <pre style={styles.result}>{testResult}</pre>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px'
  },
  title: {
    textAlign: 'center',
    marginBottom: '20px'
  },
  form: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  formGroup: {
    marginBottom: '15px'
  },
  input: {
    width: '100%',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    marginTop: '5px'
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '10px'
  },
  button: {
    padding: '10px 15px',
    backgroundColor: '#1d3557',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  resultContainer: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px'
  },
  result: {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    backgroundColor: '#eee',
    padding: '10px',
    borderRadius: '4px',
    fontSize: '14px'
  }
};

export default TestAuth; 