import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { orderService } from '../services/api';

const InvoicePage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const orderId = id || new URLSearchParams(location.search).get('orderId');
        
        if (!orderId) {
          setError('No order ID provided');
          setLoading(false);
          return;
        }

        const response = await orderService.getOrderInvoice(orderId);
        console.log('Invoice data:', response.data);
        setInvoice(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching invoice:', error);
        setError(error.response?.data?.message || 'Failed to load invoice');
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id, location]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const calculateSubtotal = () => {
    if (!invoice || !invoice.items) return 0;
    return invoice.items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 1;
      return sum + (price * quantity);
    }, 0);
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loader}></div>
        <p>Loading invoice...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <button onClick={handleBack} style={styles.backButton}>
          Go Back
        </button>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div style={styles.errorContainer}>
        <h2>Invoice Not Found</h2>
        <p>The requested invoice could not be found.</p>
        <button onClick={handleBack} style={styles.backButton}>
          Go Back
        </button>
      </div>
    );
  }

  const subtotal = calculateSubtotal();
  const total = parseFloat(invoice.invoice_amount) || 0;

  return (
    <div style={styles.pageContainer}>
      <div style={styles.invoiceContainer}>
        <div style={styles.invoiceHeader}>
          <div>
            <h1 style={styles.title}>INVOICE</h1>
            <p style={styles.invoiceNumber}>Invoice #: {invoice.invoice_id}</p>
            <p style={styles.invoiceDate}>Date: {formatDate(invoice.invoice_date)}</p>
          </div>
        </div>

        <div style={styles.customerInfo}>
          <div style={styles.billingInfo}>
            <h3 style={styles.sectionTitle}>Bill To:</h3>
            <p style={styles.customerName}>{invoice.user_first_name} {invoice.user_last_name}</p>
            <p>{invoice.user_email}</p>
            <p>{invoice.billing_street}</p>
            <p>{invoice.billing_city}, {invoice.billing_state} {invoice.billing_postal_code}</p>
            <p>{invoice.billing_country}</p>
          </div>
          <div style={styles.shippingInfo}>
            <h3 style={styles.sectionTitle}>Ship To:</h3>
            <p>{invoice.shipping_street}</p>
            <p>{invoice.shipping_city}, {invoice.shipping_state} {invoice.shipping_postal_code}</p>
            <p>{invoice.shipping_country}</p>
          </div>
        </div>

        <div style={styles.orderDetails}>
          <h3 style={styles.sectionTitle}>Order Details:</h3>
          <p>Order #: {invoice.id}</p>
          <p>Order Date: {formatDate(invoice.created_at)}</p>
          <p>Order Status: {invoice.status}</p>
        </div>

        <table style={styles.itemsTable}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>Item</th>
              <th style={styles.tableHeader}>Description</th>
              <th style={styles.tableHeader}>Quantity</th>
              <th style={styles.tableHeader}>Unit Price</th>
              <th style={styles.tableHeader}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items || []).map((item, index) => {
              const product = item?.product_variant?.product || {};
              const variant = item?.product_variant || {};
              const price = parseFloat(item.price) || 0;
              const quantity = parseInt(item.quantity) || 1;
              
              return (
                <tr key={item?.id || index} style={styles.tableRow}>
                  <td style={styles.tableCell}>{index + 1}</td>
                  <td style={styles.tableCell}>
                    <p style={styles.productName}>{product?.name || 'Product'}</p>
                    <p style={styles.productVariant}>
                      {variant?.color && `Color: ${variant.color}`}
                      {variant?.color && variant?.size && ' • '}
                      {variant?.size && `Size: ${variant.size}`}
                    </p>
                  </td>
                  <td style={styles.tableCell}>{quantity}</td>
                  <td style={styles.tableCell}>${price.toFixed(2)}</td>
                  <td style={styles.tableCell}>${(price * quantity).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={styles.totalSection}>
          <div style={styles.totalRow}>
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div style={styles.totalRow}>
            <span>Shipping:</span>
            <span>${(total - subtotal).toFixed(2)}</span>
          </div>
          <div style={styles.totalRowFinal}>
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
        
        <div style={styles.actions}>
          <button onClick={handleBack} style={styles.backButton}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  pageContainer: {
    backgroundColor: '#f8f9fa',
    minHeight: '100vh',
    padding: '40px 20px',
    display: 'flex',
    justifyContent: 'center'
  },
  invoiceContainer: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    padding: '40px',
    maxWidth: '800px',
    width: '100%'
  },
  invoiceHeader: {
    marginBottom: '40px',
    borderBottom: '1px solid #eee',
    paddingBottom: '20px'
  },
  title: {
    fontSize: '28px',
    color: '#1d3557',
    marginBottom: '10px',
    marginTop: 0
  },
  invoiceNumber: {
    fontSize: '16px',
    marginBottom: '5px'
  },
  invoiceDate: {
    fontSize: '16px',
    color: '#666'
  },
  customerInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '30px'
  },
  billingInfo: {
    flex: 1,
    marginRight: '20px'
  },
  shippingInfo: {
    flex: 1
  },
  sectionTitle: {
    fontSize: '16px',
    color: '#1d3557',
    marginBottom: '10px',
    borderBottom: '1px solid #eee',
    paddingBottom: '5px'
  },
  customerName: {
    fontWeight: 'bold'
  },
  orderDetails: {
    marginBottom: '30px'
  },
  itemsTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '30px'
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
    padding: '10px',
    textAlign: 'left',
    borderBottom: '2px solid #dee2e6'
  },
  tableRow: {
    borderBottom: '1px solid #dee2e6'
  },
  tableCell: {
    padding: '10px',
    verticalAlign: 'top'
  },
  productName: {
    fontWeight: 'bold',
    margin: '0 0 5px 0'
  },
  productVariant: {
    fontSize: '14px',
    color: '#666',
    margin: 0
  },
  totalSection: {
    marginLeft: 'auto',
    width: '300px',
    marginBottom: '40px'
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid #eee'
  },
  totalRowFinal: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '15px 0',
    borderBottom: '2px solid #1d3557',
    fontWeight: 'bold',
    fontSize: '18px'
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-start'
  },
  backButton: {
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh'
  },
  loader: {
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #3498db',
    borderRadius: '50%',
    width: '30px',
    height: '30px',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px'
  },
  errorContainer: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    padding: '40px',
    maxWidth: '600px',
    margin: '40px auto',
    textAlign: 'center'
  }
};

export default InvoicePage; 