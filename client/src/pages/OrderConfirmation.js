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
    const subtotal = order.items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 1;
      return sum + (price * quantity);
    }, 0);
    console.log('Calculated subtotal:', subtotal);
    return subtotal;
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
  const total = calculateTotal();

  console.log('Rendering with values:', {
    orderItems,
    subtotal,
    shippingCost,
    total
  });

  return (
    <div style={styles.pageContainer}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.checkmark}>
            <span style={styles.checkmarkIcon}>✓</span>
          </div>
          <h1 style={styles.title}>Order Confirmed!</h1>
          <p style={styles.subtitle}>Thank you for your purchase</p>
          <p style={styles.orderNumber}>Order #{order?.id || 'N/A'}</p>
          <p style={styles.orderDate}>Placed on {formatDate(order?.created_at)}</p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Order Summary</h2>
          
          <div style={styles.orderItems}>
            {orderItems.map(item => (
              <div key={item?.id || Math.random()} style={styles.orderItem}>
                <div style={styles.productImageContainer}>
                  <img 
                    src={item?.product_variant?.product?.images?.[0] || '/placeholder.jpg'} 
                    alt={item?.product_variant?.product?.name || 'Product'}
                    style={styles.productImage}
                  />
                </div>
                <div style={styles.productDetails}>
                  <h3 style={styles.productName}>{item?.product_variant?.product?.name || 'Product'}</h3>
                  <p style={styles.productVariant}>
                    {item?.product_variant?.color && `Color: ${item.product_variant.color}`}
                    {item?.product_variant?.size && ` • Size: ${item.product_variant.size}`}
                  </p>
                  <p style={styles.productQuantity}>Quantity: {item?.quantity || 1}</p>
                </div>
                <div style={styles.productPrice}>
                  ${((item?.price || 0) * (item?.quantity || 1)).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
          
          <div style={styles.orderTotals}>
            <div style={styles.totalRow}>
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div style={styles.totalRow}>
              <span>Shipping</span>
              <span>{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</span>
            </div>
            <div style={styles.totalRowFinal}>
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div style={styles.infoSection}>
          <div style={styles.infoColumn}>
            <h3 style={styles.infoTitle}>Shipping Address</h3>
            <div style={styles.addressInfo}>
              <p>{shippingAddress?.street || 'N/A'}</p>
              <p>{shippingAddress?.city || ''}, {shippingAddress?.state || ''} {shippingAddress?.postal_code || ''}</p>
              <p>{shippingAddress?.country || ''}</p>
            </div>
          </div>
          
          <div style={styles.infoColumn}>
            <h3 style={styles.infoTitle}>Payment Information</h3>
            <div style={styles.paymentInfo}>
              <p>Payment Method: {order?.payment_method === 'credit_card' ? 'Credit Card' : order?.payment_method === 'paypal' ? 'PayPal' : 'Cash on Delivery'}</p>
              <p>Payment Status: {order?.payment_status || 'Pending'}</p>
            </div>
          </div>
          
          <div style={styles.infoColumn}>
            <h3 style={styles.infoTitle}>Delivery Information</h3>
            <div style={styles.deliveryInfo}>
              <p>Estimated Delivery: {getEstimatedDeliveryDate(order?.created_at)}</p>
              <p>Status: {order?.status || 'Processing'}</p>
            </div>
          </div>
        </div>
        
        <div style={styles.buttonContainer}>
          <Link to="/products" style={{...styles.button, ...styles.continueShoppingButton}}>
            Continue Shopping
          </Link>
          <Link to="/account/orders" style={styles.button}>
            View Your Orders
          </Link>
        </div>
        
        <div style={styles.helpSection}>
          <h3 style={styles.helpTitle}>Need Help?</h3>
          <p style={styles.helpText}>
            If you have any questions or concerns about your order, please contact customer support.
          </p>
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
  container: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    padding: '24px'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '50px 0'
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
    textAlign: 'center',
    padding: '50px 0'
  },
  header: {
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
  checkmarkIcon: {
    fontSize: '40px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#333',
    margin: '0 0 8px'
  },
  subtitle: {
    fontSize: '18px',
    color: '#666',
    margin: '0 0 16px'
  },
  orderNumber: {
    fontSize: '16px',
    fontWeight: '500',
    margin: '0 0 4px'
  },
  orderDate: {
    fontSize: '14px',
    color: '#666'
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
  productImageContainer: {
    width: '80px',
    height: '80px',
    marginRight: '16px'
  },
  productImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '4px'
  },
  productDetails: {
    flex: '1'
  },
  productName: {
    fontSize: '16px',
    fontWeight: '500',
    margin: '0 0 4px'
  },
  productVariant: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 4px'
  },
  productQuantity: {
    fontSize: '14px',
    color: '#666'
  },
  productPrice: {
    fontWeight: '500',
    fontSize: '16px'
  },
  orderTotals: {
    backgroundColor: '#f9f9f9',
    padding: '16px',
    borderRadius: '8px'
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: '16px'
  },
  totalRowFinal: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0 0',
    marginTop: '8px',
    borderTop: '1px solid #ddd',
    fontWeight: '600',
    fontSize: '18px'
  },
  infoSection: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '24px',
    margin: '32px 0',
    padding: '0 0 32px',
    borderBottom: '1px solid #eee'
  },
  infoColumn: {
    flex: '1',
    minWidth: '250px'
  },
  infoTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#333'
  },
  addressInfo: {
    fontSize: '14px',
    lineHeight: '1.5'
  },
  paymentInfo: {
    fontSize: '14px',
    lineHeight: '1.5'
  },
  deliveryInfo: {
    fontSize: '14px',
    lineHeight: '1.5'
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    margin: '24px 0'
  },
  button: {
    display: 'inline-block',
    backgroundColor: '#3f51b5',
    color: 'white',
    borderRadius: '4px',
    padding: '12px 20px',
    textDecoration: 'none',
    fontWeight: '500',
    fontSize: '16px',
    textAlign: 'center'
  },
  continueShoppingButton: {
    backgroundColor: '#fff',
    color: '#3f51b5',
    border: '1px solid #3f51b5'
  },
  helpSection: {
    textAlign: 'center',
    marginTop: '32px',
    padding: '16px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px'
  },
  helpTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '8px'
  },
  helpText: {
    fontSize: '14px',
    color: '#666'
  }
};

export default OrderConfirmation; 