import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { wishlistService, cartService } from '../services/api';

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debug, setDebug] = useState(false);
  const navigate = useNavigate();

  console.log("Wishlist component rendered");

  useEffect(() => {
    console.log("Wishlist useEffect called");
    fetchWishlistItems();
    
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        setDebug(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const fetchWishlistItems = async () => {
    try {
      setLoading(true);
      console.log('Fetching wishlist items...');
      
      // Check if user is authenticated before making the request
      if (!localStorage.getItem('token')) {
        console.error('No authentication token found');
        setError('You must be logged in to view your wishlist');
        setLoading(false);
        return;
      }
      
      const response = await wishlistService.getWishlist();
      console.log('Wishlist response:', response.data);
      
      const items = response.data && response.data.items ? response.data.items : [];
      console.log('Extracted wishlist items:', items);
      setWishlistItems(items);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      if (error.response && error.response.status === 401) {
        console.log('Authentication error, redirecting to login');
        navigate('/login');
        return;
      }
      setError('Failed to load wishlist items. Please try again later. Error: ' + (error.message || 'Unknown error'));
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (productId) => {
    try {
      console.log('Removing product from wishlist, ID:', productId);
      await wishlistService.removeFromWishlist(productId);
      console.log('Product successfully removed from wishlist');
      fetchWishlistItems();
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      alert('Failed to remove item from wishlist: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleAddToCart = async (product) => {
    try {
      const productVariantId = product.variants && product.variants.length > 0 
        ? product.variants[0].id 
        : product.id;
        
      await cartService.addToCart(productVariantId, 1);
      alert('Product added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add product to cart');
    }
  };

  if (loading) {
    return <div style={styles.message}>Loading wishlist...</div>;
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.error}>{error}</div>
        <button onClick={fetchWishlistItems} style={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div style={styles.emptyWishlist}>
        <h2>Your wishlist is empty</h2>
        <p>Add products to your wishlist to save them for later.</p>
        <Link to="/products" style={styles.shopButton}>Browse Products</Link>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      <div style={styles.container}>
        <h1 style={styles.title}>My Wishlist</h1>
        
        {debug && (
          <div style={styles.debugInfo}>
            <h3>Debug Information</h3>
            <p>Items count: {wishlistItems?.length || 0}</p>
            <p>Raw data:</p>
            <pre style={styles.debugPre}>
              {JSON.stringify(wishlistItems, null, 2)}
            </pre>
          </div>
        )}
        
        <div style={styles.wishlistGrid}>
          {wishlistItems.map(item => {
            const product = item.product;
            
            if (!product) {
              console.error('Item missing product data:', item);
              return null;
            }
            
            return (
              <div key={product.id} style={styles.wishlistItem}>
                <div style={styles.removeButtonContainer}>
                  <button 
                    onClick={() => handleRemoveFromWishlist(product.id)}
                    style={styles.topRemoveButton}
                    aria-label="Remove from wishlist"
                  >
                    ✕
                  </button>
                </div>
                <div style={styles.itemImageContainer}>
                  <img 
                    src={product.images?.[0] || '/img/placeholder-product.jpg'} 
                    alt={product.name} 
                    style={styles.itemImage} 
                  />
                  <div style={styles.itemActions}>
                    <button 
                      onClick={() => handleAddToCart(product)}
                      style={styles.addToCartButton}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
                <div style={styles.itemInfo}>
                  <Link to={`/products/${product.id}`} style={styles.itemName}>
                    {product.name}
                  </Link>
                  <p style={styles.itemCategory}>{product.category}</p>
                  <p style={styles.itemPrice}>
                    {product.variants && product.variants.length > 0 
                      ? `$${product.variants[0].price}` 
                      : 'Price not available'}
                  </p>
                  <div style={styles.itemButtons}>
                    <button 
                      onClick={() => handleAddToCart(product)}
                      style={styles.primaryButton}
                    >
                      Add to Cart
                    </button>
                    <button 
                      onClick={() => handleRemoveFromWishlist(product.id)}
                      style={styles.secondaryButton}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
    padding: '20px'
  },
  title: {
    textAlign: 'center',
    marginBottom: '40px',
    color: '#1d3557',
    fontSize: '2rem',
    borderBottom: '2px solid #2a9d8f',
    paddingBottom: '10px'
  },
  wishlistGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '30px'
  },
  wishlistItem: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    position: 'relative',
    ':hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
    }
  },
  removeButtonContainer: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    zIndex: '10'
  },
  topRemoveButton: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    border: '1px solid #e63946',
    color: '#e63946',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    padding: '0',
    ':hover': {
      backgroundColor: '#e63946',
      color: '#fff'
    }
  },
  itemImageContainer: {
    position: 'relative',
    height: '250px',
    overflow: 'hidden'
  },
  itemImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  itemActions: {
    position: 'absolute',
    bottom: '0',
    left: '0',
    right: '0',
    padding: '10px',
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    justifyContent: 'space-between',
    opacity: '0',
    transition: 'opacity 0.3s ease',
    ':hover': {
      opacity: '1'
    }
  },
  addToCartButton: {
    flex: '1',
    padding: '8px 12px',
    backgroundColor: '#2a9d8f',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    marginRight: '10px',
    cursor: 'pointer',
    fontSize: '0.9rem'
  },
  removeButton: {
    padding: '8px 12px',
    backgroundColor: '#e63946',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem'
  },
  itemInfo: {
    padding: '15px'
  },
  itemName: {
    color: '#1d3557',
    textDecoration: 'none',
    fontSize: '1.1rem',
    fontWeight: '600',
    marginBottom: '5px',
    display: 'block'
  },
  itemCategory: {
    color: '#666',
    fontSize: '0.9rem',
    margin: '5px 0'
  },
  itemPrice: {
    fontWeight: 'bold',
    color: '#2a9d8f',
    fontSize: '1.1rem',
    margin: '10px 0 15px 0'
  },
  itemButtons: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px'
  },
  primaryButton: {
    flex: '1',
    padding: '10px',
    backgroundColor: '#2a9d8f',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500'
  },
  secondaryButton: {
    flex: '1',
    padding: '10px',
    backgroundColor: '#fff',
    color: '#e63946',
    border: '1px solid #e63946',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  emptyWishlist: {
    backgroundColor: '#fff',
    padding: '50px 20px',
    borderRadius: '8px',
    textAlign: 'center',
    maxWidth: '600px',
    margin: '50px auto',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
  },
  shopButton: {
    display: 'inline-block',
    marginTop: '20px',
    padding: '12px 25px',
    backgroundColor: '#2a9d8f',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
    fontWeight: '600'
  },
  message: {
    textAlign: 'center',
    padding: '100px 0',
    fontSize: '1.2rem',
    color: '#666',
    backgroundColor: '#f8f9fa',
    minHeight: '100vh'
  },
  error: {
    textAlign: 'center',
    padding: '100px 0',
    fontSize: '1.2rem',
    color: '#e63946',
    backgroundColor: '#f8f9fa',
    minHeight: '100vh'
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '100px 0',
    backgroundColor: '#f8f9fa',
    minHeight: '100vh'
  },
  retryButton: {
    marginTop: '20px',
    padding: '10px 20px',
    backgroundColor: '#3f51b5',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem'
  },
  debugInfo: {
    backgroundColor: '#f5f5f5',
    border: '1px solid #ddd',
    padding: '15px',
    marginBottom: '20px',
    borderRadius: '4px',
    color: '#333'
  },
  debugPre: {
    whiteSpace: 'pre-wrap',
    overflowX: 'auto',
    padding: '10px',
    backgroundColor: '#eee',
    borderRadius: '4px',
    maxHeight: '300px',
    overflow: 'auto'
  }
};

export default Wishlist; 