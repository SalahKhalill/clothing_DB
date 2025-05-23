import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/authContext';
import { useNavigate } from 'react-router-dom';
import { addressService } from '../services/api';



const Addresses = () => {
  const { isLoggedIn, currentUser } = useAuth();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [editingAddress, setEditingAddress] = useState(null);
  const [newAddress, setNewAddress] = useState({
    id: null,
    name: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    isDefault: false,
    phone: ''
  });
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch addresses from API
  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await addressService.getAddresses();
      
      // Map backend address fields to frontend format
      const formattedAddresses = response.data.map(address => ({
        id: address.id,
        name: address.street.split(',')[0] || '', // Extract name from street if available
        addressLine1: address.street,
        addressLine2: '',
        city: address.city,
        state: address.state,
        postalCode: address.postal_code,
        country: address.country,
        isDefault: address.is_default,
        phone: ''  // Backend doesn't seem to have phone field
      }));
      
      setAddresses(formattedAddresses);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setError('Failed to load addresses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    
    // Load addresses from API
    fetchAddresses();
  }, [isLoggedIn, navigate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewAddress({
      ...newAddress,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const addNewAddress = async () => {
    // Validate form
    if (!newAddress.name || !newAddress.addressLine1 || !newAddress.city || !newAddress.postalCode || !newAddress.country) {
      setError('Please fill all required fields');
      return;
    }
    
    try {
      setLoading(true);
      // Convert frontend address format to backend format
      const addressData = {
        street: newAddress.addressLine1,
        city: newAddress.city,
        state: newAddress.state,
        country: newAddress.country,
        postalCode: newAddress.postalCode,
        isDefault: newAddress.isDefault
      };
      
      await addressService.addAddress(addressData);
      
      // Refresh addresses list
      await fetchAddresses();
      
      // Reset form
      setNewAddress({
        id: null,
        name: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        isDefault: false,
        phone: ''
      });
      setIsAdding(false);
      setError('');
    } catch (error) {
      console.error('Error adding address:', error);
      setError('Failed to add address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateAddress = async () => {
    // Validate form
    if (!newAddress.name || !newAddress.addressLine1 || !newAddress.city || !newAddress.postalCode || !newAddress.country) {
      setError('Please fill all required fields');
      return;
    }
    
    try {
      setLoading(true);
      // Convert frontend address format to backend format
      const addressData = {
        street: newAddress.addressLine1,
        city: newAddress.city,
        state: newAddress.state,
        country: newAddress.country,
        postalCode: newAddress.postalCode,
        isDefault: newAddress.isDefault
      };
      
      await addressService.updateAddress(newAddress.id, addressData);
      
      // Refresh addresses list
      await fetchAddresses();
      
      setEditingAddress(null);
      setNewAddress({
        id: null,
        name: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        isDefault: false,
        phone: ''
      });
      setError('');
    } catch (error) {
      console.error('Error updating address:', error);
      setError('Failed to update address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (address) => {
    setNewAddress({ ...address });
    setEditingAddress(address.id);
    setIsAdding(false);
  };

  const deleteAddress = async (id) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        setLoading(true);
        await addressService.deleteAddress(id);
        
        // Refresh addresses list
        await fetchAddresses();
        
        if (editingAddress === id) {
          setEditingAddress(null);
          setNewAddress({
            id: null,
            name: '',
            addressLine1: '',
            addressLine2: '',
            city: '',
            state: '',
            postalCode: '',
            country: '',
            isDefault: false,
            phone: ''
          });
        }
      } catch (error) {
        console.error('Error deleting address:', error);
        setError('Failed to delete address. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const setAsDefault = async (id) => {
    try {
      setLoading(true);
      console.log(`Attempting to set address ${id} as default`);
      
      const response = await addressService.setDefaultAddress(id);
      console.log('Set default address response:', response);
      
      // Refresh addresses list
      await fetchAddresses();
    } catch (error) {
      console.error('Error setting default address:', error);
      if (error.response) {
        console.error('Server response:', error.response.data);
        console.error('Status code:', error.response.status);
      }
      setError('Failed to set default address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startAddNew = () => {
    setIsAdding(true);
    setEditingAddress(null);
    setNewAddress({
      id: null,
      name: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      isDefault: addresses.length === 0, // Set default if it's the first address
      phone: ''
    });
  };

  const cancelForm = () => {
    setIsAdding(false);
    setEditingAddress(null);
    setNewAddress({
      id: null,
      name: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      isDefault: false,
      phone: ''
    });
    setError('');
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Manage Your Addresses</h1>
      
      {error && <div style={styles.error}>{error}</div>}
      
      {loading && (
        <div style={styles.loading}>
          <p>Loading...</p>
        </div>
      )}
      
      <div style={styles.addressList}>
        {!loading && addresses.map(address => (
          <div 
            key={address.id}
            style={{
              ...styles.addressCard,
              ...(address.isDefault ? styles.defaultCard : {})
            }}
          >
            {address.isDefault && (
              <div style={styles.defaultBadge}>Default</div>
            )}
            
            <div style={styles.addressDetails}>
              <h3>{address.name}</h3>
              <p>{address.addressLine1}</p>
              {address.addressLine2 && <p>{address.addressLine2}</p>}
              <p>{address.city}, {address.state} {address.postalCode}</p>
              <p>{address.country}</p>
              {address.phone && <p>Phone: {address.phone}</p>}
            </div>
            
            <div style={styles.addressActions}>
              <button 
                onClick={() => startEdit(address)}
                style={styles.editButton}
                disabled={loading}
              >
                Edit
              </button>
              
              <button 
                onClick={() => deleteAddress(address.id)}
                style={styles.deleteButton}
                disabled={loading}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        
        {!loading && addresses.length === 0 && !isAdding && (
          <div style={styles.emptyState}>
            <p>You don't have any saved addresses yet.</p>
          </div>
        )}
      </div>
      
      {!isAdding && !editingAddress && (
        <button 
          onClick={startAddNew} 
          style={styles.addButton}
          disabled={loading}
        >
          Add New Address
        </button>
      )}
      
      {(isAdding || editingAddress) && (
        <div style={styles.formContainer}>
          <h2>{isAdding ? 'Add New Address' : 'Edit Address'}</h2>
          
          <div style={styles.formRow}>
            <div style={styles.formField}>
              <label htmlFor="name" style={styles.label}>
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={newAddress.name}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="Enter your full name"
                required
                disabled={loading}
              />
            </div>
          </div>
          
          <div style={styles.formRow}>
            <div style={styles.formField}>
              <label htmlFor="addressLine1" style={styles.label}>
                Address Line 1 *
              </label>
              <input
                type="text"
                id="addressLine1"
                name="addressLine1"
                value={newAddress.addressLine1}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="Street address, P.O. box, company name"
                required
                disabled={loading}
              />
            </div>
          </div>
          
          <div style={styles.formRow}>
            <div style={styles.formField}>
              <label htmlFor="addressLine2" style={styles.label}>
                Address Line 2
              </label>
              <input
                type="text"
                id="addressLine2"
                name="addressLine2"
                value={newAddress.addressLine2}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="Apartment, suite, unit, building, floor, etc."
                disabled={loading}
              />
            </div>
          </div>
          
          <div style={styles.formRow}>
            <div style={styles.formField}>
              <label htmlFor="city" style={styles.label}>
                City *
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={newAddress.city}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="Enter your city"
                required
                disabled={loading}
              />
            </div>
            
            <div style={styles.formField}>
              <label htmlFor="state" style={styles.label}>
                State/Province
              </label>
              <input
                type="text"
                id="state"
                name="state"
                value={newAddress.state}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="Enter your state or province"
                disabled={loading}
              />
            </div>
          </div>
          
          <div style={styles.formRow}>
            <div style={styles.formField}>
              <label htmlFor="postalCode" style={styles.label}>
                Postal Code *
              </label>
              <input
                type="text"
                id="postalCode"
                name="postalCode"
                value={newAddress.postalCode}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="Enter your postal code"
                required
                disabled={loading}
              />
            </div>
            
            <div style={styles.formField}>
              <label htmlFor="country" style={styles.label}>
                Country *
              </label>
              <input
                type="text"
                id="country"
                name="country"
                value={newAddress.country}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="Enter your country"
                required
                disabled={loading}
              />
            </div>
          </div>
          
          <div style={styles.formRow}>
            <div style={styles.formField}>
              <label htmlFor="phone" style={styles.label}>
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={newAddress.phone}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="Enter your phone number"
                disabled={loading}
              />
            </div>
          </div>
          
          <div style={styles.checkboxRow}>
            <input
              type="checkbox"
              id="isDefault"
              name="isDefault"
              checked={newAddress.isDefault}
              onChange={handleInputChange}
              disabled={addresses.length === 0 || loading} // Disabled if it's the first address (automatic default)
            />
            <label htmlFor="isDefault" style={styles.checkboxLabel}>
              Set as default address
            </label>
          </div>
          
          <div style={styles.formActions}>
            <button 
              onClick={cancelForm}
              style={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </button>
            
            <button 
              onClick={isAdding ? addNewAddress : updateAddress}
              style={styles.saveButton}
              disabled={loading}
            >
              {isAdding ? 'Add Address' : 'Update Address'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '30px 20px'
  },
  title: {
    marginBottom: '30px',
    color: '#333',
    borderBottom: '1px solid #eee',
    paddingBottom: '10px'
  },
  addressList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    marginBottom: '30px'
  },
  addressCard: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    position: 'relative',
    backgroundColor: '#fff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  defaultCard: {
    borderColor: '#1d3557',
    boxShadow: '0 2px 5px rgba(29, 53, 87, 0.2)'
  },
  defaultBadge: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    backgroundColor: '#1d3557',
    color: 'white',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '0.8rem',
    fontWeight: 'bold'
  },
  addressDetails: {
    marginBottom: '15px'
  },
  addressActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    border: '1px dashed #ddd',
    borderRadius: '8px',
    color: '#999'
  },
  addButton: {
    backgroundColor: '#1d3557',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    display: 'block',
    margin: '0 auto'
  },
  formContainer: {
    backgroundColor: '#f9f9f9',
    padding: '25px',
    borderRadius: '8px',
    marginTop: '20px',
    border: '1px solid #eee'
  },
  formRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
    marginBottom: '15px'
  },
  formField: {
    flex: '1 1 300px'
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    color: '#333',
    fontWeight: '500'
  },
  input: {
    width: '100%',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '1rem'
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px'
  },
  checkboxLabel: {
    color: '#333'
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '15px'
  },
  cancelButton: {
    padding: '10px 15px',
    backgroundColor: 'transparent',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  saveButton: {
    padding: '10px 20px',
    backgroundColor: '#1d3557',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#e63946',
    padding: '10px 15px',
    borderRadius: '4px',
    marginBottom: '20px',
    fontWeight: '500'
  },
  editButton: {
    backgroundColor: '#f8f9fa',
    color: '#333',
    border: '1px solid #ddd',
    padding: '8px 12px',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  deleteButton: {
    backgroundColor: '#ffebee',
    color: '#e63946',
    border: '1px solid #ffcdd2',
    padding: '8px 12px',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  loading: {
    textAlign: 'center',
    padding: '20px',
    fontSize: '16px',
    color: '#666'
  }
};

export default Addresses; 