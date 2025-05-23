import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartService, addressService, orderService, couponService } from '../services/api';
import { useAuth } from '../services/authContext';

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    isDefault: false
  });
  const [subtotal, setSubtotal] = useState(0);
  const [shipping, setShipping] = useState(5.99);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [creditCard, setCreditCard] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch cart items and addresses in parallel
        const [cartResponse, addressesResponse] = await Promise.all([
          cartService.getCart(),
          addressService.getAddresses()
        ]);

        // Process cart data
        const items = cartResponse.data && cartResponse.data.items ? cartResponse.data.items : [];
        setCartItems(items);

        // Calculate cart totals
        const total = items.reduce((sum, item) => {
          const price = item.product_variant?.price || 0;
          return sum + (price * item.quantity);
        }, 0);
        
        setSubtotal(total);
        
        // Free shipping for orders over $50
        if (total >= 50) {
          setShipping(0);
        } else {
          setShipping(5.99);
        }

        // Process addresses
        const addressList = addressesResponse.data || [];
        setAddresses(addressList);

        // Select default address if available
        const defaultAddress = addressList.find(addr => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        } else if (addressList.length > 0) {
          setSelectedAddressId(addressList[0].id);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading checkout data:', error);
        setError('Failed to load checkout information. Please try again later.');
        setLoading(false);
        
        // Redirect to login if unauthorized
        if (error.response && error.response.status === 401) {
          navigate('/login');
        }
      }
    };

    fetchData();
  }, [navigate]);

  useEffect(() => {
    if (cartItems && cartItems.length) {
      calculateTotals();
    } else {
      setSubtotal(0);
      setDiscount(0);
    }
  }, [cartItems, appliedCoupon]);

  const calculateTotals = () => {
    const total = cartItems.reduce((sum, item) => {
      const price = item.product_variant?.price || 0;
      return sum + (price * item.quantity);
    }, 0);
    
    setSubtotal(total);
    
    // Calculate discount if coupon is applied
    if (appliedCoupon) {
      const discountAmount = (total * appliedCoupon.discount_percentage) / 100;
      setDiscount(discountAmount);
    } else {
      setDiscount(0);
    }
    
    // Calculate shipping - free for orders over $50 after discount
    const afterDiscount = total - (appliedCoupon ? discount : 0);
    if (afterDiscount >= 50) {
      setShipping(0);
    } else {
      setShipping(5.99);
    }
  };

  const handleAddressChange = (event) => {
    setSelectedAddressId(event.target.value);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAddress({
      ...newAddress,
      [name]: value
    });
  };

  const handleCheckboxChange = (e) => {
    setNewAddress({
      ...newAddress,
      isDefault: e.target.checked
    });
  };

  const toggleAddAddress = () => {
    setShowAddAddress(!showAddAddress);
  };

  const addNewAddress = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const response = await addressService.addAddress(newAddress);
      
      // Add new address to list and select it
      setAddresses([...addresses, response.data]);
      setSelectedAddressId(response.data.id);
      
      // Reset form and hide it
      setNewAddress({
        street: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        isDefault: false
      });
      setShowAddAddress(false);
      setLoading(false);
    } catch (error) {
      console.error('Error adding address:', error);
      setError('Failed to add address. Please try again.');
      setLoading(false);
    }
  };

  const handleCreditCardChange = (e) => {
    const { name, value } = e.target;
    setCreditCard(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCouponChange = (e) => {
    setCouponCode(e.target.value.trim());
    setCouponError('');
    setCouponSuccess('');
  };

  const applyCoupon = async () => {
    if (!couponCode) {
      setCouponError('Please enter a coupon code');
      return;
    }

    try {
      setCouponError('');
      setCouponSuccess('');
      setLoading(true);

      const response = await couponService.validateCoupon(couponCode);
      
      if (response.data.valid) {
        setAppliedCoupon(response.data.coupon);
        setCouponSuccess(`Coupon applied: ${response.data.coupon.discount_percentage}% off`);
        calculateTotals();
      } else {
        setCouponError(response.data.message || 'Invalid coupon');
        setAppliedCoupon(null);
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      
      if (error.response && error.response.data) {
        setCouponError(error.response.data.message || 'Invalid coupon');
      } else {
        setCouponError('Error validating coupon');
      }
      
      setAppliedCoupon(null);
    } finally {
      setLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponSuccess('');
    setCouponError('');
    calculateTotals();
  };

  const validateForm = () => {
    if (!selectedAddressId) {
      setError('Please select a shipping address');
      return false;
    }
    
    if (paymentMethod === 'credit_card') {
      if (!creditCard.number || !creditCard.name || !creditCard.expiry || !creditCard.cvv) {
        setError('Please fill in all credit card details');
        return false;
      }
    }
    
    return true;
  };

  const placeOrder = async () => {
    if (!validateForm()) return;
    
    try {
      setPlacingOrder(true);
      setError(null);
      
      // Validate stock levels before placing order
      try {
        // Get current stock levels for all items in cart
        const stockCheckPromises = cartItems.map(async (item) => {
          if (!item.product_variant || !item.product_variant.id) return null;
          
          const variantId = item.product_variant.id;
          const requestedQty = item.quantity;
          
          // Fetch current stock from server
          const response = await fetch(`/api/products/variants/${variantId}`);
          
          if (!response.ok) {
            throw new Error(`Failed to check stock for variant ${variantId}`);
          }
          
          const data = await response.json();
          const availableStock = data.stock || 0;
          
          return {
            variantId,
            productName: item.product_variant.product?.name || 'Product',
            color: item.product_variant.color,
            size: item.product_variant.size,
            requestedQty,
            availableStock,
            isAvailable: availableStock >= requestedQty
          };
        });
        
        const stockResults = await Promise.all(stockCheckPromises.filter(p => p !== null));
        const outOfStockItems = stockResults.filter(item => !item.isAvailable);
        
        if (outOfStockItems.length > 0) {
          const itemList = outOfStockItems.map(item => 
            `${item.productName} (${item.color || ''} ${item.size || ''}): requested ${item.requestedQty}, only ${item.availableStock} available`
          ).join('\n');
          
          setError(`Some items in your cart are out of stock or have insufficient inventory:\n${itemList}`);
          setPlacingOrder(false);
          return;
        }
      } catch (stockError) {
        console.error('Error checking stock levels:', stockError);
        // Continue with order placement, server will do final validation
      }
      
      // Calculate the total (subtotal + shipping - discount)
      const orderTotal = Number((subtotal + shipping - discount).toFixed(2));
      
      // Format the data to ensure it matches what the server expects
      const orderData = {
        items: cartItems
          .filter(item => item.product_variant && item.product_variant.id) // Only include items with valid product variants
          .map(item => ({
            productVariantId: Number(item.product_variant.id),
            quantity: Number(item.quantity) || 1,
            price: Number(item.product_variant.price) || 0
          })),
        shippingAddressId: Number(selectedAddressId),
        billingAddressId: Number(selectedAddressId), // Using shipping address as billing address
        total: orderTotal,
        paymentMethod: paymentMethod || 'credit_card',
        couponCode: appliedCoupon ? appliedCoupon.code : null
      };
      
      // Validate we have items before proceeding
      if (!orderData.items.length) {
        setError('Unable to proceed: Your cart contains invalid items');
        setPlacingOrder(false);
        return;
      }
      
      console.log('Sending order data:', JSON.stringify(orderData, null, 2));
      
      // Create order with selected items and address
      const orderResponse = await orderService.createOrder(orderData);
      
      console.log('Order creation response:', orderResponse);
      
      setPlacingOrder(false);
      
      if (orderResponse && orderResponse.id) {
        console.log('Order created successfully with ID:', orderResponse.id);
        // Redirect to order confirmation page with order ID
        navigate(`/order-confirmation?orderId=${orderResponse.id}`);
      } else {
        console.warn('Order created but no ID returned:', orderResponse);
        // Still redirect to confirmation page with the response 
        navigate(`/order-confirmation${orderResponse ? `?orderId=${orderResponse}` : ''}`);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      
      // Log detailed error information
      if (error.response) {
        console.error('Server response:', error.response.status);
        console.error('Response data:', error.response.data);
        
        // Get detailed error message from server if available
        if (error.response.data && error.response.data.message) {
          setError(`Order failed: ${error.response.data.message}`);
        } else if (error.response.status === 400) {
          setError('Invalid order data. Please check your cart items and try again.');
        } else if (error.response.status === 401) {
          setError('Please log in to place an order.');
        } else if (error.response.status === 500) {
          setError('Server error occurred. Please try again or contact support.');
        } else {
          setError('Failed to place your order. Please try again.');
        }
      } else if (error.request) {
        console.error('No response received from server', error.request);
        setError('No response from server. Please check your connection and try again.');
      } else {
        console.error('Error:', error.message);
        setError(`Error: ${error.message}`);
      }
      
      setPlacingOrder(false);
    }
  };

  const formatCreditCard = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };
  
  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    
    return value;
  };

  if (loading) {
    return (
      <div style={styles.pageContainer}>
        <div style={styles.loadingContainer}>
          <div style={styles.loader}></div>
          <p>Loading checkout information...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0 && !loading) {
    return (
      <div style={styles.pageContainer}>
        <div style={styles.emptyCartContainer}>
          <h2>Your cart is empty</h2>
          <p>Please add items to your cart before proceeding to checkout.</p>
          <Link to="/products" style={styles.shopButton}>Browse Products</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      <div style={styles.container}>
        <h1 style={styles.title}>Checkout</h1>
        
        {error && (
          <div style={styles.errorMessage}>
            {error}
          </div>
        )}
        
        <div style={styles.checkoutLayout}>
          <div style={styles.checkoutMain}>
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Delivery Address</h2>
              
              {addresses.length > 0 ? (
                <div style={styles.addressList}>
                  {addresses.map((address) => (
                    <label key={address.id} style={styles.addressCard}>
                      <input 
                        type="radio"
                        name="selectedAddress"
                        value={address.id}
                        checked={selectedAddressId === address.id}
                        onChange={handleAddressChange}
                        style={styles.radioInput}
                      />
                      <div style={styles.addressInfo}>
                        <div style={styles.addressDetails}>
                          <p>
                            {address.street}, {address.city}<br />
                            {address.state}, {address.country} {address.postalCode}
                          </p>
                        </div>
                        {address.isDefault && (
                          <div style={styles.defaultBadge}>Default</div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div style={styles.noAddressMessage}>
                  You don't have any saved addresses. Please add one.
                </div>
              )}
              
              {!showAddAddress ? (
                <button 
                  onClick={toggleAddAddress} 
                  style={styles.addAddressButton}
                >
                  Add New Address
                </button>
              ) : (
                <div style={styles.addAddressForm}>
                  <h3 style={styles.formTitle}>Add New Address</h3>
                  <form onSubmit={addNewAddress}>
                    <div style={styles.formRow}>
                      <div style={styles.formGroup}>
                        <label style={styles.inputLabel}>Street</label>
                        <input 
                          type="text"
                          name="street"
                          value={newAddress.street}
                          onChange={handleInputChange}
                          required
                          style={styles.input}
                        />
                      </div>
                    </div>
                    
                    <div style={styles.formRow}>
                      <div style={styles.formGroup}>
                        <label style={styles.inputLabel}>City</label>
                        <input 
                          type="text"
                          name="city"
                          value={newAddress.city}
                          onChange={handleInputChange}
                          required
                          style={styles.input}
                        />
                      </div>
                      
                      <div style={styles.formGroup}>
                        <label style={styles.inputLabel}>State/Province</label>
                        <input 
                          type="text"
                          name="state"
                          value={newAddress.state}
                          onChange={handleInputChange}
                          required
                          style={styles.input}
                        />
                      </div>
                    </div>
                    
                    <div style={styles.formRow}>
                      <div style={styles.formGroup}>
                        <label style={styles.inputLabel}>Country</label>
                        <input 
                          type="text"
                          name="country"
                          value={newAddress.country}
                          onChange={handleInputChange}
                          required
                          style={styles.input}
                        />
                      </div>
                      
                      <div style={styles.formGroup}>
                        <label style={styles.inputLabel}>Postal Code</label>
                        <input 
                          type="text"
                          name="postalCode"
                          value={newAddress.postalCode}
                          onChange={handleInputChange}
                          required
                          style={styles.input}
                        />
                      </div>
                    </div>
                    
                    <div style={styles.checkboxGroup}>
                      <input 
                        type="checkbox"
                        id="isDefault"
                        name="isDefault"
                        checked={newAddress.isDefault}
                        onChange={handleCheckboxChange}
                        style={styles.checkbox}
                      />
                      <label htmlFor="isDefault" style={styles.checkboxLabel}>
                        Set as default address
                      </label>
                    </div>
                    
                    <div style={styles.formActions}>
                      <button type="submit" style={styles.saveAddressButton}>
                        Save Address
                      </button>
                      <button 
                        type="button" 
                        onClick={toggleAddAddress} 
                        style={styles.cancelButton}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
            
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Payment Method</h2>
              <div style={styles.paymentMethod}>
                <div style={styles.paymentOption}>
                  <input 
                    type="radio"
                    id="cod"
                    name="paymentMethod"
                    value="cash_on_delivery"
                    checked={paymentMethod === 'cash_on_delivery'}
                    onChange={() => setPaymentMethod('cash_on_delivery')}
                    style={styles.radioInput}
                  />
                  <label htmlFor="cod" style={styles.paymentLabel}>
                    <div style={styles.codIcon}>💵</div>
                    <div>
                      <span style={styles.paymentTitle}>Cash on Delivery</span>
                      <span style={styles.paymentDescription}>
                        Pay with cash when your order is delivered
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Coupon code section */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Discount Code</h2>
              <div style={styles.couponContainer}>
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={handleCouponChange}
                  disabled={!!appliedCoupon}
                  style={styles.couponInput}
                />
                {!appliedCoupon ? (
                  <button 
                    onClick={applyCoupon} 
                    disabled={!couponCode || loading}
                    style={styles.couponButton}
                  >
                    Apply
                  </button>
                ) : (
                  <button 
                    onClick={removeCoupon}
                    style={styles.removeButton}
                  >
                    Remove
                  </button>
                )}
              </div>
              
              {couponError && (
                <div style={styles.couponError}>{couponError}</div>
              )}
              
              {couponSuccess && (
                <div style={styles.couponSuccess}>{couponSuccess}</div>
              )}
            </div>
          </div>
          
          <div style={styles.orderSummarySidebar}>
            <div style={styles.orderSummary}>
              <h2 style={styles.summaryTitle}>Order Summary</h2>
              
              <div style={styles.cartItemsList}>
                {cartItems.map((item) => {
                  const productVariant = item.product_variant;
                  const product = productVariant.product;
                  
                  return (
                    <div key={item.id} style={styles.orderItem}>
                      <div style={styles.itemInfo}>
                        <div style={styles.itemName}>{product.name}</div>
                        <div style={styles.itemVariant}>
                          {productVariant.color && `Color: ${productVariant.color}`}
                          {productVariant.size && productVariant.color && ' | '}
                          {productVariant.size && `Size: ${productVariant.size}`}
                        </div>
                        <div style={styles.itemPrice}>
                          ${productVariant.price} × {item.quantity}
                        </div>
                      </div>
                      <div style={styles.itemTotal}>
                        ${(productVariant.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div style={styles.divider}></div>
              
              <div style={styles.summaryRow}>
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              
              {discount > 0 && (
                <div style={styles.summaryRow}>
                  <span>Discount</span>
                  <span style={styles.discountText}>-${discount.toFixed(2)}</span>
                </div>
              )}
              
              <div style={styles.summaryRow}>
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
              </div>
              
              <div style={styles.divider}></div>
              
              <div style={styles.totalRow}>
                <span>Total</span>
                <span>${(subtotal + shipping - discount).toFixed(2)}</span>
              </div>
              
              <button 
                onClick={placeOrder}
                disabled={placingOrder || !selectedAddressId || cartItems.length === 0}
                style={{
                  ...styles.placeOrderButton, 
                  ...(placingOrder || !selectedAddressId || cartItems.length === 0 
                    ? styles.disabledButton 
                    : {})
                }}
              >
                {placingOrder ? 'Processing...' : 'Place Order'}
              </button>
              
              <div style={styles.secureCheckout}>
                <span>🔒 Secure Checkout</span>
              </div>
              
              <div style={styles.termsText}>
                By placing your order, you agree to our Terms of Service and Privacy Policy
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  pageContainer: {
    backgroundColor: '#f8f9fa',
    minHeight: '100vh',
    paddingBottom: '40px'
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px'
  },
  title: {
    textAlign: 'center',
    marginBottom: '40px',
    color: '#1d3557',
    fontSize: '2rem',
    fontWeight: '600'
  },
  checkoutLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr 380px',
    gap: '30px',
    alignItems: 'start',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr'
    }
  },
  checkoutMain: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px'
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    padding: '25px'
  },
  sectionTitle: {
    fontSize: '1.2rem',
    color: '#1d3557',
    marginBottom: '20px',
    fontWeight: '600'
  },
  addressList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  addressCard: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '15px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
    ':hover': {
      borderColor: '#2a9d8f'
    }
  },
  addressInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    marginLeft: '10px'
  },
  addressDetails: {
    fontSize: '0.95rem',
    lineHeight: '1.5'
  },
  defaultBadge: {
    backgroundColor: '#e8f4f2',
    color: '#2a9d8f',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '0.8rem',
    fontWeight: '500'
  },
  radioInput: {
    marginTop: '3px'
  },
  noAddressMessage: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    textAlign: 'center',
    marginBottom: '20px'
  },
  addAddressButton: {
    backgroundColor: 'transparent',
    color: '#2a9d8f',
    border: '1px solid #2a9d8f',
    padding: '10px 15px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
    marginTop: '15px'
  },
  addAddressForm: {
    marginTop: '25px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px'
  },
  formTitle: {
    fontSize: '1.1rem',
    marginBottom: '20px',
    color: '#1d3557'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
    marginBottom: '15px',
    '@media (max-width: 576px)': {
      gridTemplateColumns: '1fr'
    }
  },
  formGroup: {
    marginBottom: '15px'
  },
  inputLabel: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '0.9rem',
    color: '#555'
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '0.95rem'
  },
  checkboxGroup: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px'
  },
  checkbox: {
    marginRight: '10px'
  },
  checkboxLabel: {
    fontSize: '0.95rem'
  },
  formActions: {
    display: 'flex',
    gap: '10px'
  },
  saveAddressButton: {
    backgroundColor: '#2a9d8f',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500'
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    color: '#666',
    border: '1px solid #ddd',
    padding: '10px 15px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem'
  },
  paymentMethod: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  paymentOption: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '15px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  paymentLabel: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    marginLeft: '10px'
  },
  codIcon: {
    fontSize: '1.5rem',
    marginRight: '15px'
  },
  paymentTitle: {
    display: 'block',
    fontSize: '1rem',
    fontWeight: '500',
    marginBottom: '3px'
  },
  paymentDescription: {
    display: 'block',
    fontSize: '0.85rem',
    color: '#666'
  },
  orderSummarySidebar: {
    position: 'sticky',
    top: '20px'
  },
  orderSummary: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    padding: '25px'
  },
  summaryTitle: {
    fontSize: '1.2rem',
    marginBottom: '20px',
    color: '#1d3557',
    fontWeight: '600'
  },
  cartItemsList: {
    maxHeight: '250px',
    overflowY: 'auto',
    marginBottom: '20px'
  },
  orderItem: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '15px',
    paddingBottom: '15px',
    borderBottom: '1px solid #eee'
  },
  itemInfo: {
    flex: '1',
    marginRight: '15px'
  },
  itemName: {
    fontSize: '0.95rem',
    fontWeight: '500',
    marginBottom: '5px'
  },
  itemVariant: {
    fontSize: '0.85rem',
    color: '#666',
    marginBottom: '5px'
  },
  itemPrice: {
    fontSize: '0.85rem',
    color: '#666'
  },
  itemTotal: {
    fontSize: '0.95rem',
    fontWeight: '500'
  },
  divider: {
    height: '1px',
    backgroundColor: '#eee',
    margin: '15px 0'
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
    fontSize: '0.95rem',
    color: '#666'
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    margin: '15px 0 25px',
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#1d3557'
  },
  placeOrderButton: {
    backgroundColor: '#2a9d8f',
    color: 'white',
    border: 'none',
    padding: '15px',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
    transition: 'background-color 0.2s',
    marginBottom: '15px'
  },
  disabledButton: {
    backgroundColor: '#b8b8b8',
    cursor: 'not-allowed'
  },
  secureCheckout: {
    textAlign: 'center',
    fontSize: '0.85rem',
    color: '#666',
    marginBottom: '15px'
  },
  termsText: {
    fontSize: '0.8rem',
    color: '#888',
    textAlign: 'center',
    lineHeight: '1.4'
  },
  emptyCartContainer: {
    backgroundColor: '#fff',
    padding: '40px',
    borderRadius: '8px',
    textAlign: 'center',
    maxWidth: '600px',
    margin: '40px auto',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
  },
  shopButton: {
    display: 'inline-block',
    backgroundColor: '#2a9d8f',
    color: 'white',
    padding: '12px 25px',
    borderRadius: '4px',
    textDecoration: 'none',
    fontWeight: '600',
    marginTop: '20px'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '400px'
  },
  loader: {
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #2a9d8f',
    borderRadius: '50%',
    width: '30px',
    height: '30px',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px'
  },
  errorMessage: {
    backgroundColor: '#fff3f3',
    color: '#e63946',
    padding: '15px',
    borderRadius: '4px',
    marginBottom: '20px',
    textAlign: 'center'
  },
  couponContainer: {
    display: 'flex',
    marginBottom: '15px',
  },
  couponInput: {
    flex: 1,
    padding: '10px 15px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '4px 0 0 4px',
    outline: 'none',
  },
  couponButton: {
    padding: '10px 20px',
    fontSize: '16px',
    backgroundColor: '#4a4a4a',
    color: 'white',
    border: 'none',
    borderRadius: '0 4px 4px 0',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  removeButton: {
    padding: '10px 20px',
    fontSize: '16px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '0 4px 4px 0',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  couponError: {
    color: '#e74c3c',
    fontSize: '14px',
    marginTop: '5px',
  },
  couponSuccess: {
    color: '#2ecc71',
    fontSize: '14px',
    marginTop: '5px',
  },
  discountText: {
    color: '#2ecc71',
    fontWeight: 'bold',
  },
};

export default Checkout; 