import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartService } from '../services/api';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subtotal, setSubtotal] = useState(0);
  const [shipping, setShipping] = useState(5.99); // Default shipping cost
  const navigate = useNavigate();

  useEffect(() => {
    fetchCartItems();
  }, []);

  // Calculate totals when cart items change
  useEffect(() => {
    if (cartItems && cartItems.length) {
      calculateTotals();
    } else {
      setSubtotal(0);
    }
  }, [cartItems]);

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const response = await cartService.getCart();
      
      // Ensure items is always an array
      const items = response.data && response.data.items ? response.data.items : [];
      
      setCartItems(items);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching cart:', error);
      if (error.response && error.response.status === 401) {
        // Redirect to login if not authenticated
        navigate('/login');
        return;
      }
      setError('Failed to load cart items. Please try again later.');
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const total = cartItems.reduce((sum, item) => {
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
  };

  const handleUpdateQuantity = async (itemId, quantity) => {
    try {
      if (quantity <= 0) {
        await cartService.removeFromCart(itemId);
      } else {
        await cartService.updateCartItem(itemId, quantity);
      }
      fetchCartItems(); // Refresh cart
    } catch (error) {
      console.error('Error updating cart item:', error);
      alert('Failed to update item. Please try again.');
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await cartService.removeFromCart(itemId);
      fetchCartItems(); // Refresh cart
    } catch (error) {
      console.error('Error removing cart item:', error);
      alert('Failed to remove item. Please try again.');
    }
  };

  const proceedToCheckout = () => {
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div style={styles.pageContainer}>
        <div style={styles.loadingContainer}>
          <div style={styles.loader}></div>
          <p>Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.pageContainer}>
        <div style={styles.errorContainer}>
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <Link to="/products" style={styles.shopButton}>Browse Products</Link>
        </div>
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div style={styles.pageContainer}>
        <div style={styles.emptyCartContainer}>
          <div style={styles.emptyCartIcon}>🛒</div>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added any products to your cart yet.</p>
          <Link to="/products" style={styles.shopButton}>Start Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      <div style={styles.container}>
        <h1 style={styles.title}>Shopping Cart</h1>
        
        <div style={styles.cartLayout}>
          <div style={styles.cartItemsSection}>
            <div style={styles.cartHeader}>
              <div style={styles.productColumn}>Product</div>
              <div style={styles.priceColumn}>Price</div>
              <div style={styles.quantityColumn}>Quantity</div>
              <div style={styles.totalColumn}>Total</div>
              <div style={styles.actionsColumn}></div>
            </div>
            
            <div style={styles.cartItems}>
              {cartItems.map(item => {
                const productVariant = item.product_variant || {};
                const product = productVariant.product || {};
                
                return (
                  <div key={item.id} style={styles.cartItem}>
                    <div style={styles.productColumn}>
                      <div style={styles.productInfo}>
                        <img 
                          src={product.images || '/img/placeholder-product.jpg'} 
                          alt={product.name || 'Product'} 
                          style={styles.itemImage} 
                        />
                        <div style={styles.itemDetails}>
                          <Link to={`/products/${product.id || '#'}`} style={styles.productName}>
                            {product.name || 'Unknown Product'}
                          </Link>
                          <div style={styles.variantDetails}>
                            {productVariant.color && <span>Color: {productVariant.color}</span>}
                            {productVariant.size && <span>Size: {productVariant.size}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div style={styles.priceColumn}>
                      ${productVariant.price || '0.00'}
                    </div>
                    
                    <div style={styles.quantityColumn}>
                      <div style={styles.quantityControl}>
                        <button 
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          style={styles.quantityButton}
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (!isNaN(value)) {
                              handleUpdateQuantity(item.id, value);
                            }
                          }}
                          min="1"
                          style={styles.quantityInput}
                          aria-label="Quantity"
                        />
                        <button 
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          style={styles.quantityButton}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    
                    <div style={styles.totalColumn}>
                      ${((productVariant.price || 0) * item.quantity).toFixed(2)}
                    </div>
                    
                    <div style={styles.actionsColumn}>
                      <button 
                        onClick={() => handleRemoveItem(item.id)}
                        style={styles.removeButton}
                        aria-label="Remove item"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div style={styles.cartActions}>
              <Link to="/products" style={styles.continueShopping}>
                Continue Shopping
              </Link>
            </div>
          </div>
          
          <div style={styles.orderSummarySection}>
            <div style={styles.orderSummary}>
              <h2 style={styles.summaryTitle}>Order Summary</h2>
              
              <div style={styles.summaryRow}>
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              
              <div style={styles.summaryRow}>
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
              </div>
              
              {shipping === 0 && (
                <div style={styles.freeShippingMessage}>
                  You've qualified for free shipping!
                </div>
              )}
              
              {subtotal < 50 && (
                <div style={styles.shippingInfo}>
                  Add ${(50 - subtotal).toFixed(2)} more to get free shipping
                </div>
              )}
              
              <div style={styles.divider}></div>
              
              <div style={styles.totalRow}>
                <span>Total</span>
                <span>${(subtotal + shipping).toFixed(2)}</span>
              </div>
              
              <button 
                onClick={proceedToCheckout}
                style={styles.checkoutButton}
                disabled={cartItems.length === 0}
              >
                Proceed to Checkout
              </button>
              
              <div style={styles.secureCheckout}>
                <span>🔒 Secure Checkout</span>
              </div>
              
              <div style={styles.paymentMethods}>
                <p style={styles.paymentTitle}>We Accept:</p>
                <p style={styles.paymentOption}>Cash on Delivery</p>
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
  cartLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    gap: '30px',
    alignItems: 'start',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr'
    }
  },
  cartItemsSection: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    overflow: 'hidden'
  },
  cartHeader: {
    display: 'grid',
    gridTemplateColumns: '3fr 1fr 1.5fr 1fr 40px',
    padding: '15px 20px',
    borderBottom: '1px solid #eee',
    fontWeight: '600',
    color: '#666',
    backgroundColor: '#f8f9fa'
  },
  productColumn: {
    display: 'flex',
    alignItems: 'center'
  },
  priceColumn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  quantityColumn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  totalColumn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionsColumn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cartItems: {
    display: 'flex',
    flexDirection: 'column'
  },
  cartItem: {
    display: 'grid',
    gridTemplateColumns: '3fr 1fr 1.5fr 1fr 40px',
    padding: '20px',
    borderBottom: '1px solid #eee',
    alignItems: 'center'
  },
  productInfo: {
    display: 'flex',
    alignItems: 'center'
  },
  itemImage: {
    width: '80px',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '4px',
    marginRight: '15px'
  },
  itemDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  productName: {
    fontSize: '1rem',
    fontWeight: '500',
    color: '#1d3557',
    textDecoration: 'none',
    marginBottom: '5px'
  },
  variantDetails: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: '0.85rem',
    color: '#666'
  },
  quantityControl: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #ddd',
    borderRadius: '4px',
    width: 'fit-content'
  },
  quantityButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30px',
    height: '30px',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '1.2rem',
    cursor: 'pointer',
    color: '#666',
    transition: 'background-color 0.2s'
  },
  quantityInput: {
    width: '40px',
    height: '30px',
    border: 'none',
    borderRight: '1px solid #ddd',
    borderLeft: '1px solid #ddd',
    textAlign: 'center',
    fontSize: '0.9rem'
  },
  removeButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30px',
    height: '30px',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#999',
    transition: 'color 0.2s'
  },
  cartActions: {
    display: 'flex',
    justifyContent: 'flex-start',
    padding: '20px'
  },
  continueShopping: {
    display: 'inline-flex',
    alignItems: 'center',
    color: '#457b9d',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: '500'
  },
  orderSummarySection: {
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
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '15px',
    fontSize: '0.95rem',
    color: '#666'
  },
  divider: {
    height: '1px',
    backgroundColor: '#eee',
    margin: '15px 0'
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    margin: '15px 0 25px',
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#1d3557'
  },
  freeShippingMessage: {
    backgroundColor: '#e8f4f2',
    color: '#2a9d8f',
    padding: '10px',
    borderRadius: '4px',
    fontSize: '0.9rem',
    marginBottom: '15px',
    textAlign: 'center'
  },
  shippingInfo: {
    color: '#666',
    fontSize: '0.85rem',
    marginBottom: '15px',
    fontStyle: 'italic'
  },
  checkoutButton: {
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
  secureCheckout: {
    textAlign: 'center',
    fontSize: '0.85rem',
    color: '#666',
    marginBottom: '20px'
  },
  paymentMethods: {
    borderTop: '1px solid #eee',
    paddingTop: '15px'
  },
  paymentTitle: {
    fontSize: '0.85rem',
    color: '#666',
    marginBottom: '10px'
  },
  paymentOption: {
    fontSize: '0.9rem',
    fontWeight: '500'
  },
  emptyCartContainer: {
    backgroundColor: '#fff',
    padding: '60px 40px',
    borderRadius: '8px',
    textAlign: 'center',
    maxWidth: '600px',
    margin: '40px auto',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
  },
  emptyCartIcon: {
    fontSize: '3rem',
    marginBottom: '20px'
  },
  shopButton: {
    display: 'inline-block',
    backgroundColor: '#2a9d8f',
    color: 'white',
    padding: '12px 25px',
    borderRadius: '4px',
    textDecoration: 'none',
    fontWeight: '600',
    marginTop: '25px'
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
  errorContainer: {
    backgroundColor: '#fff',
    padding: '40px',
    borderRadius: '8px',
    textAlign: 'center',
    maxWidth: '600px',
    margin: '40px auto',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
  }
};

export default Cart; 