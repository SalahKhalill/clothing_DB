import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { orderService } from '../services/api';

const OrderHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('Fetching user orders...');
      const response = await orderService.getUserOrders();
      console.log('Orders response:', response.data);
      setOrders(response.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      let errorMessage = 'Failed to load your orders. Please try again later.';
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        if (error.response.status === 401) {
          // Unauthorized - need to login
          errorMessage = 'Please log in to view your orders.';
        } else if (error.response.data && error.response.data.message) {
          errorMessage = `Error: ${error.response.data.message}`;
        }
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }

    try {
      setCancellingOrderId(orderId);
      const response = await orderService.cancelOrder(orderId);
      console.log('Order cancelled:', response.data);
      
      // Update the order status in the UI
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: 'cancelled' } : order
      ));
      
      alert('Order cancelled successfully');
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert(error.response?.data?.message || 'Failed to cancel order. Please try again.');
    } finally {
      setCancellingOrderId(null);
    }
  };

  const navigateToProductReview = (productId) => {
    navigate(`/products/${productId}?review=true`);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase() || 'pending') {
      case 'completed':
        return '#4caf50';
      case 'processing':
        return '#2196f3';
      case 'shipped':
        return '#ff9800';
      case 'cancelled':
        return '#f44336';
      case 'pending':
      default:
        return '#757575';
    }
  };

  const calculateOrderTotal = (order) => {
    if (!order) return 0;
    
    // If total exists, use it
    if (order.total) return parseFloat(order.total);
    
    // Otherwise calculate from items
    if (!order.items || !Array.isArray(order.items)) return 0;
    
    const subtotal = order.items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 1;
      return sum + (price * quantity);
    }, 0);
    
    const shippingCost = parseFloat(order.shipping_cost) || 0;
    return subtotal + shippingCost;
  };

  if (loading) {
    return (
      <div style={styles.pageContainer}>
        <div style={styles.loadingContainer}>
          <div style={styles.loader}></div>
          <p>Loading your orders...</p>
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
          <button 
            onClick={() => window.location.reload()}
            style={styles.retryButton}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      <div style={styles.container}>
        <h1 style={styles.title}>My Orders</h1>
        
        {orders.length === 0 ? (
          <div style={styles.emptyOrdersContainer}>
            <div style={styles.emptyIcon}>📦</div>
            <h2>You haven't placed any orders yet</h2>
            <p>When you place orders, they will appear here for you to track.</p>
            <Link to="/products" style={styles.shopButton}>Start Shopping</Link>
          </div>
        ) : (
          <div style={styles.ordersContainer}>
            {orders.map(order => (
              <div key={order.id} style={styles.orderCard}>
                <div style={styles.orderHeader}>
                  <div>
                    <h3 style={styles.orderTitle}>Order #{order?.id || 'N/A'}</h3>
                    <p style={styles.orderDate}>Placed on {formatDate(order?.created_at || new Date())}</p>
                  </div>
                  <div style={styles.orderStatus}>
                    <span 
                      style={{
                        ...styles.statusBadge,
                        backgroundColor: getStatusColor(order?.status)
                      }}
                    >
                      {order?.status || 'Pending'}
                    </span>
                  </div>
                </div>
                
                <div style={styles.orderItems}>
                  {(order.items || []).slice(0, 3).map(item => {
                    // Handle both new and old data structures
                    const productVariant = item?.product_variant || {};
                    const product = productVariant?.product || {};
                    const price = parseFloat(item?.price) || 0;
                    const quantity = parseInt(item?.quantity) || 1;
                    
                    return (
                      <div key={item?.id || Math.random()} style={styles.orderItem}>
                        <div style={styles.productImageContainer}>
                          <img 
                            src={product?.images?.[0] || '/placeholder.jpg'} 
                            alt={product?.name || 'Product'} 
                            style={styles.productImage}
                          />
                        </div>
                        <div style={styles.itemInfo}>
                          <p style={styles.itemName}>{product?.name || 'Product'}</p>
                          <p style={styles.itemVariant}>
                            {productVariant?.color && `Color: ${productVariant.color}`}
                            {productVariant?.color && productVariant?.size && ' • '}
                            {productVariant?.size && `Size: ${productVariant.size}`}
                          </p>
                          <p style={styles.itemPrice}>
                            ${price.toFixed(2)} × {quantity}
                          </p>
                          
                          {/* Add Review button for completed orders */}
                          {order?.status?.toLowerCase() === 'completed' && product?.id && (
                            <button 
                              onClick={() => navigateToProductReview(product.id)}
                              style={styles.reviewButton}
                            >
                              Write Review
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {(order.items || []).length > 3 && (
                    <p style={styles.moreItems}>
                      +{order.items.length - 3} more items
                    </p>
                  )}
                </div>
                
                <div style={styles.orderSummary}>
                  <div style={styles.summaryRow}>
                    <span>Total</span>
                    <span style={styles.orderTotal}>${calculateOrderTotal(order).toFixed(2)}</span>
                  </div>
                </div>
                
                <div style={styles.orderActions}>
                  <button 
                    onClick={() => navigate(`/order-confirmation?orderId=${order?.id}`)}
                    style={styles.viewDetailsButton}
                  >
                    View Order Details
                  </button>
                  
                  {order?.status?.toLowerCase() !== 'cancelled' && (
                    <button 
                      onClick={() => navigate(`/invoice?orderId=${order?.id}`)}
                      style={styles.invoiceButton}
                    >
                      View Invoice
                    </button>
                  )}
                  
                  {order?.status?.toLowerCase() === 'pending' && (
                    <button 
                      onClick={() => handleCancelOrder(order.id)}
                      style={{
                        ...styles.cancelOrderButton,
                        opacity: cancellingOrderId === order.id ? 0.7 : 1,
                        cursor: cancellingOrderId === order.id ? 'not-allowed' : 'pointer'
                      }}
                      disabled={cancellingOrderId === order.id}
                    >
                      {cancellingOrderId === order.id ? 'Cancelling...' : 'Cancel Order'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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
    maxWidth: '1000px',
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
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 0'
  },
  loader: {
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #3498db',
    borderRadius: '50%',
    width: '30px',
    height: '30px',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px'
  },
  errorContainer: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    padding: '40px',
    textAlign: 'center',
    maxWidth: '600px',
    margin: '40px auto'
  },
  retryButton: {
    backgroundColor: '#3f51b5',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    marginTop: '20px'
  },
  emptyOrdersContainer: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    padding: '60px 40px',
    textAlign: 'center',
    maxWidth: '600px',
    margin: '0 auto'
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '20px'
  },
  shopButton: {
    display: 'inline-block',
    backgroundColor: '#3f51b5',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '4px',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: '500',
    marginTop: '20px'
  },
  ordersContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden'
  },
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #eee'
  },
  orderTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    margin: '0 0 5px 0'
  },
  orderDate: {
    fontSize: '14px',
    color: '#666',
    margin: 0
  },
  orderStatus: {
    display: 'flex',
    alignItems: 'center'
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '16px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
    textTransform: 'capitalize'
  },
  orderItems: {
    padding: '20px'
  },
  orderItem: {
    display: 'flex',
    marginBottom: '15px',
    padding: '10px',
    borderRadius: '4px',
    backgroundColor: '#f9f9f9'
  },
  productImageContainer: {
    width: '60px',
    height: '60px',
    borderRadius: '4px',
    overflow: 'hidden',
    marginRight: '15px',
    flexShrink: 0
  },
  productImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  itemInfo: {
    flex: '1'
  },
  itemName: {
    fontSize: '16px',
    fontWeight: '500',
    margin: '0 0 5px 0',
    color: '#333'
  },
  itemVariant: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 5px 0'
  },
  itemPrice: {
    fontSize: '14px',
    color: '#1d3557',
    fontWeight: '500',
    margin: 0
  },
  moreItems: {
    textAlign: 'center',
    color: '#666',
    fontSize: '14px',
    margin: '10px 0 0 0'
  },
  orderSummary: {
    padding: '15px 20px',
    borderTop: '1px solid #eee',
    borderBottom: '1px solid #eee',
    backgroundColor: '#f9f9f9'
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  orderTotal: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1d3557'
  },
  orderActions: {
    display: 'flex',
    gap: '10px',
    padding: '15px 20px',
    justifyContent: 'flex-end',
    flexWrap: 'wrap'
  },
  viewDetailsButton: {
    backgroundColor: '#1d3557',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  invoiceButton: {
    backgroundColor: '#f1f1f1',
    color: '#333',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  cancelOrderButton: {
    backgroundColor: '#e63946',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  reviewButton: {
    backgroundColor: '#2a9d8f',
    color: 'white',
    border: 'none',
    padding: '5px 10px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    marginTop: '8px',
    display: 'inline-block'
  }
};

export default OrderHistory; 