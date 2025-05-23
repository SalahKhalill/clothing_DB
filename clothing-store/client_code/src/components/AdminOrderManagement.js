import React, { useState, useEffect } from 'react';
import { orderService } from '../services/api';
import { useNavigate } from 'react-router-dom';

const AdminOrderManagement = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getAllOrders();
      console.log('Admin orders response:', response.data);
      
      // Transform the data to create a user object from individual fields if needed
      const formattedOrders = response.data.map(order => {
        // If there's no user object but there are user_email, user_first_name fields
        if (!order.user && (order.user_email || order.user_first_name || order.user_last_name)) {
          order.user = {
            email: order.user_email,
            first_name: order.user_first_name,
            last_name: order.user_last_name
          };
        }
        return order;
      });
      
      setOrders(formattedOrders || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders. Please try again later.');
      setLoading(false);
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleCloseDetails = () => {
    setShowOrderDetails(false);
    setSelectedOrder(null);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      fetchOrders(); // Refresh orders
      
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({
          ...prev,
          status: newStatus
        }));
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
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

  const calculateSubtotal = (order) => {
    if (!order || !order.items || !Array.isArray(order.items)) return 0;
    
    try {
      return order.items.reduce((sum, item) => {
        if (!item) return sum;
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity) || 1;
        return sum + (price * quantity);
      }, 0);
    } catch (error) {
      console.error('Error calculating subtotal:', error);
      return 0;
    }
  };

  const formatUserName = (user) => {
    if (!user) return 'Unknown';
    return `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown';
  };

  const getUserEmail = (user) => {
    if (!user) return 'N/A';
    return user.email || 'N/A';
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loader}></div>
        <p>Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <h3>Error</h3>
        <p>{error}</p>
        <button 
          onClick={fetchOrders}
          style={styles.retryButton}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Order Management</h2>
      
      {orders.length === 0 ? (
        <div style={styles.emptyMessage}>
          No orders found.
        </div>
      ) : (
        <div style={styles.ordersTableContainer}>
          <table style={styles.ordersTable}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Order ID</th>
                <th style={styles.tableHeader}>Customer</th>
                <th style={styles.tableHeader}>Date</th>
                <th style={styles.tableHeader}>Total</th>
                <th style={styles.tableHeader}>Status</th>
                <th style={styles.tableHeader}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order?.id || Math.random()} style={styles.tableRow}>
                  <td style={styles.tableCell}>#{order?.id || 'N/A'}</td>
                  <td style={styles.tableCell}>{formatUserName(order?.user)}</td>
                  <td style={styles.tableCell}>{formatDate(order?.created_at || new Date())}</td>
                  <td style={styles.tableCell}>${parseFloat(order?.total || 0).toFixed(2)}</td>
                  <td style={styles.tableCell}>
                    <span 
                      style={{
                        ...styles.statusBadge,
                        backgroundColor: getStatusColor(order?.status)
                      }}
                    >
                      {order?.status || 'Pending'}
                    </span>
                  </td>
                  <td style={styles.tableCell}>
                    <button 
                      onClick={() => handleViewDetails(order)}
                      style={styles.viewButton}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {showOrderDetails && selectedOrder && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Order #{selectedOrder.id}</h3>
              <button 
                onClick={handleCloseDetails}
                style={styles.closeButton}
              >
                ×
              </button>
            </div>
            
            <div style={styles.orderInfo}>
              <div style={styles.orderInfoRow}>
                <span style={styles.orderInfoLabel}>Customer:</span>
                <span>{formatUserName(selectedOrder?.user)}</span>
              </div>
              <div style={styles.orderInfoRow}>
                <span style={styles.orderInfoLabel}>Email:</span>
                <span>{getUserEmail(selectedOrder?.user)}</span>
              </div>
              <div style={styles.orderInfoRow}>
                <span style={styles.orderInfoLabel}>Order Date:</span>
                <span>{formatDate(selectedOrder?.created_at || new Date())}</span>
              </div>
              <div style={styles.orderInfoRow}>
                <span style={styles.orderInfoLabel}>Order ID:</span>
                <span>#{selectedOrder?.id || 'N/A'}</span>
              </div>
              <div style={styles.orderInfoRow}>
                <span style={styles.orderInfoLabel}>Status:</span>
                <span 
                  style={{
                    ...styles.statusBadge,
                    backgroundColor: getStatusColor(selectedOrder?.status)
                  }}
                >
                  {selectedOrder?.status || 'Pending'}
                </span>
              </div>
            </div>
            
            <div style={styles.statusActions}>
              <span style={styles.statusLabel}>Update Status:</span>
              <div style={styles.statusButtons}>
                <button 
                  onClick={() => handleStatusChange(selectedOrder?.id, 'pending')}
                  style={{
                    ...styles.statusButton,
                    backgroundColor: getStatusColor('pending'),
                    opacity: selectedOrder?.status === 'pending' ? 1 : 0.7
                  }}
                >
                  Pending
                </button>
                <button 
                  onClick={() => handleStatusChange(selectedOrder?.id, 'processing')}
                  style={{
                    ...styles.statusButton,
                    backgroundColor: getStatusColor('processing'),
                    opacity: selectedOrder?.status === 'processing' ? 1 : 0.7
                  }}
                >
                  Processing
                </button>
                <button 
                  onClick={() => handleStatusChange(selectedOrder?.id, 'shipped')}
                  style={{
                    ...styles.statusButton,
                    backgroundColor: getStatusColor('shipped'),
                    opacity: selectedOrder?.status === 'shipped' ? 1 : 0.7
                  }}
                >
                  Shipped
                </button>
                <button 
                  onClick={() => handleStatusChange(selectedOrder?.id, 'completed')}
                  style={{
                    ...styles.statusButton,
                    backgroundColor: getStatusColor('completed'),
                    opacity: selectedOrder?.status === 'completed' ? 1 : 0.7
                  }}
                >
                  Completed
                </button>
                <button 
                  onClick={() => handleStatusChange(selectedOrder?.id, 'cancelled')}
                  style={{
                    ...styles.statusButton,
                    backgroundColor: getStatusColor('cancelled'),
                    opacity: selectedOrder?.status === 'cancelled' ? 1 : 0.7
                  }}
                >
                  Cancelled
                </button>
              </div>
            </div>
            
            <div style={styles.orderItems}>
              <h4 style={styles.orderItemsTitle}>Order Items</h4>
              <table style={styles.itemsTable}>
                <thead>
                  <tr>
                    <th style={styles.itemHeader}>Product</th>
                    <th style={styles.itemHeader}>Variant</th>
                    <th style={styles.itemHeader}>Quantity</th>
                    <th style={styles.itemHeader}>Price</th>
                    <th style={styles.itemHeader}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedOrder?.items || []).map((item, index) => {
                    if (!item) return null;
                    
                    const productVariant = item?.product_variant || {};
                    const product = productVariant?.product || {};
                    const price = parseFloat(item?.price) || 0;
                    const quantity = parseInt(item?.quantity) || 1;
                    
                    return (
                      <tr key={item?.id || `item-${index}`} style={styles.itemRow}>
                        <td style={styles.itemCell}>{product?.name || 'Product'}</td>
                        <td style={styles.itemCell}>
                          {productVariant?.color && `Color: ${productVariant.color}`}
                          {productVariant?.color && productVariant?.size && <br />}
                          {productVariant?.size && `Size: ${productVariant.size}`}
                        </td>
                        <td style={styles.itemCell}>{quantity}</td>
                        <td style={styles.itemCell}>${price.toFixed(2)}</td>
                        <td style={styles.itemCell}>${(price * quantity).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div style={styles.orderTotals}>
              <div style={styles.totalRow}>
                <span>Subtotal</span>
                <span>${calculateSubtotal(selectedOrder).toFixed(2)}</span>
              </div>
              <div style={styles.totalRow}>
                <span>Shipping</span>
                <span>
                  {parseFloat(selectedOrder?.shipping_cost || 0) === 0 
                    ? 'Free' 
                    : `$${parseFloat(selectedOrder?.shipping_cost || 0).toFixed(2)}`}
                </span>
              </div>
              <div style={styles.totalRowFinal}>
                <span>Total</span>
                <span>${parseFloat(selectedOrder?.total || (calculateSubtotal(selectedOrder) + parseFloat(selectedOrder?.shipping_cost || 0))).toFixed(2)}</span>
              </div>
            </div>
            
            <div style={styles.addressInfo}>
              <div style={styles.addressColumn}>
                <h4 style={styles.addressTitle}>Shipping Address</h4>
                <div style={styles.address}>
                  {selectedOrder?.shipping_address ? (
                    <>
                      <div style={styles.orderInfoRow}>
                        <span style={styles.orderInfoLabel}>Street:</span>
                        <span>{selectedOrder.shipping_address?.street || 'N/A'}</span>
                      </div>
                      <div style={styles.orderInfoRow}>
                        <span style={styles.orderInfoLabel}>City:</span>
                        <span>{selectedOrder.shipping_address?.city || 'N/A'}</span>
                      </div>
                      <div style={styles.orderInfoRow}>
                        <span style={styles.orderInfoLabel}>State:</span>
                        <span>{selectedOrder.shipping_address?.state || 'N/A'}</span>
                      </div>
                      <div style={styles.orderInfoRow}>
                        <span style={styles.orderInfoLabel}>Postal Code:</span>
                        <span>{selectedOrder.shipping_address?.postal_code || 'N/A'}</span>
                      </div>
                      <div style={styles.orderInfoRow}>
                        <span style={styles.orderInfoLabel}>Country:</span>
                        <span>{selectedOrder.shipping_address?.country || 'N/A'}</span>
                      </div>
                    </>
                  ) : (
                    <p>No shipping address available</p>
                  )}
                </div>
              </div>
              <div style={styles.addressColumn}>
                <h4 style={styles.addressTitle}>Payment Information</h4>
                <div style={styles.address}>
                  <div style={styles.orderInfoRow}>
                    <span style={styles.orderInfoLabel}>Method:</span>
                    <span>
                      {selectedOrder?.payment_method === 'credit_card' ? 'Credit Card' : 
                       selectedOrder?.payment_method === 'paypal' ? 'PayPal' : 
                       'Cash on Delivery'}
                    </span>
                  </div>
                  <div style={styles.orderInfoRow}>
                    <span style={styles.orderInfoLabel}>Status:</span>
                    <span>{selectedOrder?.payment_status || 'Pending'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div style={styles.buttonRow}>
              <button 
                onClick={() => navigate(`/invoice?orderId=${selectedOrder?.id}`)}
                style={styles.invoiceButton}
              >
                View Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    marginTop: '20px'
  },
  title: {
    fontSize: '1.5rem',
    marginBottom: '20px',
    color: '#333'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px'
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
    padding: '20px',
    backgroundColor: '#fff3f3',
    borderRadius: '8px',
    textAlign: 'center',
    marginBottom: '20px'
  },
  retryButton: {
    backgroundColor: '#3f51b5',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '10px'
  },
  emptyMessage: {
    padding: '20px',
    textAlign: 'center',
    color: '#666'
  },
  ordersTableContainer: {
    overflowX: 'auto'
  },
  ordersTable: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  tableHeader: {
    padding: '12px 15px',
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #ddd',
    fontWeight: '600',
    color: '#333'
  },
  tableRow: {
    borderBottom: '1px solid #eee'
  },
  tableCell: {
    padding: '12px 15px'
  },
  statusBadge: {
    display: 'inline-block',
    padding: '5px 10px',
    borderRadius: '16px',
    color: 'white',
    fontSize: '0.85rem',
    fontWeight: '500',
    textTransform: 'capitalize'
  },
  viewButton: {
    backgroundColor: '#3f51b5',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.85rem'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 20px rgba(0, 0, 0, 0.2)',
    width: '90%',
    maxWidth: '900px',
    maxHeight: '90vh',
    overflow: 'auto',
    padding: '20px'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '1px solid #eee',
    paddingBottom: '15px'
  },
  modalTitle: {
    fontSize: '1.5rem',
    margin: 0
  },
  closeButton: {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer'
  },
  orderInfo: {
    marginBottom: '20px'
  },
  orderInfoRow: {
    display: 'flex',
    marginBottom: '8px'
  },
  orderInfoLabel: {
    width: '120px',
    fontWeight: '600',
    color: '#666'
  },
  statusActions: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px'
  },
  statusLabel: {
    marginRight: '15px',
    fontWeight: '600'
  },
  statusButtons: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  statusButton: {
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '500'
  },
  orderItems: {
    marginBottom: '20px'
  },
  orderItemsTitle: {
    fontSize: '1.1rem',
    marginBottom: '10px'
  },
  itemsTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '20px'
  },
  itemHeader: {
    padding: '10px',
    backgroundColor: '#f8f9fa',
    textAlign: 'left',
    fontSize: '0.9rem',
    fontWeight: '600',
    borderBottom: '1px solid #ddd'
  },
  itemRow: {
    borderBottom: '1px solid #eee'
  },
  itemCell: {
    padding: '10px',
    fontSize: '0.9rem'
  },
  orderTotals: {
    backgroundColor: '#f9f9f9',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '5px 0',
    fontSize: '0.95rem'
  },
  totalRowFinal: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0 0',
    marginTop: '5px',
    borderTop: '1px solid #ddd',
    fontWeight: '600',
    fontSize: '1.1rem'
  },
  addressInfo: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap'
  },
  addressColumn: {
    flex: '1',
    minWidth: '250px'
  },
  addressTitle: {
    fontSize: '1.1rem',
    marginBottom: '10px'
  },
  address: {
    fontSize: '0.9rem',
    lineHeight: '1.5'
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '20px',
    marginBottom: '10px'
  },
  invoiceButton: {
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500'
  }
};

export default AdminOrderManagement; 