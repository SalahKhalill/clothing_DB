import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { orderService } from '../services/api';
import { useAuth } from '../services/authContext';

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orderId = new URLSearchParams(location.search).get('orderId');
        if (!orderId) {
          setError('No order ID provided');
          setLoading(false);
          return;
        }

        const response = await orderService.getOrder(orderId);
        console.log('Order data received:', response.data);
        console.log('Order items:', response.data?.items);
        console.log('Order total:', response.data?.total);
        console.log('Order shipping cost:', response.data?.shipping_cost);
        console.log('Order subtotal:', response.data?.subtotal);
        
        setOrder(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching order:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchOrder();
  }, [location]);

  const calculateSubtotal = () => {
    if (!order || !order.items) {
      console.log('No order or items found');
      return 0;
    }
    
    // First check if the server provided a subtotal and it's a valid number
    if (order.subtotal !== undefined && order.subtotal !== null) {
      const parsedSubtotal = parseFloat(order.subtotal);
      if (!isNaN(parsedSubtotal)) {
        console.log('Using server-provided subtotal:', parsedSubtotal);
        return parsedSubtotal;
      }
    }
    
    // Calculate client-side if server didn't provide a valid subtotal
    const calculatedSubtotal = order.items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 1;
      return sum + (price * quantity);
    }, 0);
    
    console.log('Calculated subtotal client-side:', calculatedSubtotal);
    return calculatedSubtotal;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const shippingCost = parseFloat(order?.shipping_cost) || 0;
    const total = subtotal + shippingCost;
    console.log('Calculated total:', total);
    return total;
  };

  if (loading) {
    return (
      <div style={styles.pageContainer}>
        <div style={styles.loadingContainer}>
          <div style={styles.loader}></div>
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={styles.pageContainer}>
        <div style={styles.errorContainer}>
          <h2>Something went wrong</h2>
          <p>{error || 'Order not found'}</p>
          <Link to="/account/orders" style={styles.button}>View Your Orders</Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getEstimatedDeliveryDate = (orderDate) => {
    if (!orderDate) return 'N/A';
    const date = new Date(orderDate);
    date.setDate(date.getDate() + 5); // Assuming 5 days for delivery
    return formatDate(date);
  };

  // Safely access order properties with fallbacks
  const orderItems = Array.isArray(order?.items) ? order.items : [];
  const shippingAddress = order?.shipping_address || {};
  const subtotal = calculateSubtotal();
  const shippingCost = parseFloat(order?.shipping_cost) || 0;
  const couponDiscount = parseFloat(order?.coupon_discount) || 0;
  const total = parseFloat(order?.total) || subtotal + shippingCost - couponDiscount;

  console.log('Rendering with values:', {
    orderItems,
    subtotal,
    shippingCost,
    total
  });

  return (
    <div style={styles.pageContainer}>
      <div style={styles.confirmationContainer}>
        <div style={styles.confirmationHeader}>
          <div style={styles.checkmark}>✓</div>
          <h1 style={styles.heading}>Order Confirmed</h1>
          <p style={styles.subheading}>Order #{order.id}</p>
          <p style={styles.subheading}>Placed on {formatDate(order.created_at)}</p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Order Details</h2>
          <div style={styles.orderItems}>
            {orderItems.map((item, index) => {
              // Extract product and variant information from the nested structure
              const productVariant = item?.product_variant || {};
              const product = productVariant?.product || {};
              const price = parseFloat(item.price) || 0;
              const quantity = parseInt(item.quantity) || 1;
              
              return (
                <div key={item?.id || index} style={styles.orderItem}>
                  <div style={styles.itemImageContainer}>
                    {product?.images && product.images.length > 0 ? (
                      <img src={product.images[0]} alt={product.name} style={styles.itemImage} />
                    ) : (
                      <div style={styles.placeholderImage}>No Image</div>
                    )}
                  </div>
                  <div style={styles.itemDetails}>
                    <h3 style={styles.itemName}>{product?.name || 'Product'}</h3>
                    <p style={styles.itemMeta}>
                      {productVariant?.color && `Color: ${productVariant.color}`}
                      {productVariant?.color && productVariant?.size && ' • '}
                      {productVariant?.size && `Size: ${productVariant.size}`}
                    </p>
                    <p style={styles.itemMeta}>Quantity: {quantity}</p>
                  </div>
                  <div style={styles.itemPrice}>${(price * quantity).toFixed(2)}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Shipping Address</h2>
          <div style={styles.addressDetails}>
            <p style={styles.addressLine}>{shippingAddress?.street || 'N/A'}</p>
            <p style={styles.addressLine}>
              {shippingAddress?.city || ''}{shippingAddress?.city && shippingAddress?.state ? ', ' : ''}
              {shippingAddress?.state || ''} {shippingAddress?.postal_code || ''}
            </p>
            <p style={styles.addressLine}>{shippingAddress?.country || ''}</p>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Order Summary</h2>
          <div style={styles.orderDetails}>
            <div style={styles.summaryTotals}>
              <div style={styles.totalRow}>
                <span>Subtotal:</span>
                <span>${calculateSubtotal().toFixed(2)}</span>
              </div>
              
              {order && order.discount_amount > 0 && (
                <div style={styles.totalRow}>
                  <span>Discount ({order.coupon_code}):</span>
                  <span style={styles.discountText}>-${Number(order.discount_amount).toFixed(2)}</span>
                </div>
              )}
              
              <div style={styles.totalRow}>
                <span>Shipping:</span>
                <span>{calculateSubtotal() >= 50 ? 'Free' : '$5.99'}</span>
              </div>
              
              <div style={styles.finalTotal}>
                <span>Total:</span>
                <span>${Number(order?.total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Shipping Information</h2>
          <div style={styles.shippingInfo}>
            <p style={styles.shippingDetail}>
              <span style={styles.shippingLabel}>Estimated Delivery Date:</span> 
              <span style={styles.shippingValue}>{getEstimatedDeliveryDate(order.created_at)}</span>
            </p>
            <p style={styles.shippingDetail}>
              <span style={styles.shippingLabel}>Shipping Method:</span> 
              <span style={styles.shippingValue}>Standard Shipping</span>
            </p>
          </div>
        </div>

        <div style={styles.actions}>
          <button 
            onClick={() => window.print()} 
            style={styles.secondaryButton}
          >
            Print Invoice
          </button>
          <Link 
            to="/shop" 
            style={styles.primaryButton}
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

const styles = {
  pageContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px'
  },
  confirmationContainer: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    padding: '24px'
  },
  confirmationHeader: {
    textAlign: 'center',
    padding: '20px 0 40px',
    borderBottom: '1px solid #eee'
  },
  checkmark: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#4CAF50',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px'
  },
  heading: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#333',
    margin: '0 0 8px'
  },
  subheading: {
    fontSize: '18px',
    color: '#666',
    margin: '0 0 16px'
  },
  section: {
    margin: '32px 0',
    padding: '0 0 32px',
    borderBottom: '1px solid #eee'
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#333'
  },
  orderItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px'
  },
  orderItem: {
    display: 'flex',
    padding: '16px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    alignItems: 'center'
  },
  itemImageContainer: {
    width: '80px',
    height: '80px',
    marginRight: '16px'
  },
  itemImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '4px'
  },
  itemDetails: {
    flex: '1'
  },
  itemName: {
    fontSize: '16px',
    fontWeight: '500',
    margin: '0 0 4px'
  },
  itemMeta: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 4px'
  },
  itemPrice: {
    fontWeight: '500',
    fontSize: '16px'
  },
  addressDetails: {
    fontSize: '14px',
    lineHeight: '1.5'
  },
  addressLine: {
    marginBottom: '8px'
  },
  paymentDetails: {
    backgroundColor: '#f9f9f9',
    padding: '16px',
    borderRadius: '8px'
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: '16px'
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0 0',
    marginTop: '8px',
    borderTop: '1px solid #ddd',
    fontWeight: '600',
    fontSize: '18px'
  },
  shippingInfo: {
    fontSize: '14px',
    lineHeight: '1.5'
  },
  shippingDetail: {
    marginBottom: '8px'
  },
  shippingLabel: {
    fontWeight: '600'
  },
  shippingValue: {
    marginLeft: '8px'
  },
  actions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    margin: '24px 0'
  },
  secondaryButton: {
    backgroundColor: '#fff',
    color: '#3f51b5',
    border: '1px solid #3f51b5',
    padding: '12px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '16px',
    textAlign: 'center'
  },
  primaryButton: {
    backgroundColor: '#3f51b5',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '16px',
    textAlign: 'center'
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px'
  },
  couponValue: {
    color: '#2e7d32',
    fontWeight: '500'
  },
  discountRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.95rem',
    marginBottom: '8px',
    color: '#2e7d32'
  },
  discountText: {
    color: '#2ecc71',
    fontWeight: 'bold',
  },
  finalTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0 0',
    marginTop: '8px',
    borderTop: '1px solid #ddd',
    fontWeight: '600',
    fontSize: '18px'
  }
};

export default OrderConfirmation; 