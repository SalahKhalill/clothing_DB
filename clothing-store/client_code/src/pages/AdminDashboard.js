import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { productService, authService, couponService } from '../services/api';
import AdminOrderManagement from '../components/AdminOrderManagement';
import '../styles/AdminDashboard.css'; // We'll create this file later

const AdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  
  // Product form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    images: [],
    variants: [{ price: 0, stock: 0, color: '', size: '' }]
  });

  // Coupon-related state
  const [coupons, setCoupons] = useState([]);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState(null);
  const [couponFormData, setCouponFormData] = useState({
    code: '',
    discountPercentage: 10,
    expiresAt: ''
  });
  const [editingCouponId, setEditingCouponId] = useState(null);

  // Check admin status on mount
  useEffect(() => {
    checkAdminStatus();
  }, []);
  
  // Refresh products when returning to dashboard
  useEffect(() => {
    // Only if user is admin and on the main dashboard page
    if (isAdmin && location.pathname === '/admin') {
      fetchProducts();
    }
  }, [isAdmin, location.pathname]);
  
  // Fetch product details when the id changes
  useEffect(() => {
    if (isAdmin && id && location.pathname.includes('/edit/')) {
      fetchProductDetails(id);
    }
  }, [isAdmin, id, location.pathname]);

  useEffect(() => {
    if (isAdmin && activeTab === 'coupons') {
      fetchCoupons();
    }
  }, [isAdmin, activeTab]);

  const checkAdminStatus = async () => {
    try {
      const response = await authService.getCurrentUser();
      if (!response.data.isAdmin && response.data.role !== 'admin') {
        // Redirect non-admin users
        navigate('/');
        return;
      }
      
      setIsAdmin(true);
      
      // Fetch product data if we're editing
      if (location.pathname.includes('/edit/') && id) {
        fetchProductDetails(id);
      } else if (location.pathname === '/admin') {
        fetchProducts();
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      // Redirect on authentication error
      navigate('/login');
    }
  };

  const fetchProductDetails = async (productId) => {
    try {
      setLoading(true);
      const response = await productService.getProductById(productId);
      const product = response.data;
      
      // Handle possible variant formats
      let variants = [];
      if (Array.isArray(product.variants) && product.variants.length > 0) {
        variants = product.variants;
      } else {
        variants = [{ price: 0, stock: 0, color: '', size: '' }];
      }
      
      // Process images - ensure it's always an array
      let imageArray = [];
      if (typeof product.images === 'string') {
        // If it's a comma-separated string
        if (product.images.includes(',')) {
          imageArray = product.images.split(',').map(url => url.trim()).filter(url => url !== '');
        } 
        // If it's a single URL
        else if (product.images.trim() !== '') {
          imageArray = [product.images.trim()];
        }
      } 
      // If it's already an array
      else if (Array.isArray(product.images)) {
        imageArray = product.images.filter(url => url && url.trim() !== '');
      }
      
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        images: imageArray,
        variants: variants
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching product details:', error);
      setError('Failed to load product details.');
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getAllProducts();
      setProducts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again later.');
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        setLoading(true);
        const response = await productService.deleteProduct(productId);
        console.log('Delete product response:', response.data);
        
        // Refresh product list
        fetchProducts();
        setLoading(false);
        alert('Product deleted successfully');
      } catch (error) {
        console.error('Error deleting product:', error);
        setLoading(false);
        
        // Display a more specific error message if available
        let errorMessage = 'Failed to delete product';
        
        if (error.response && error.response.data) {
          if (error.response.data.message) {
            errorMessage = error.response.data.message;
            
            // Add details if available
            if (error.response.data.details) {
              errorMessage += `\n\n${error.response.data.details}`;
            }
          }
        }
        
        alert(errorMessage);
      }
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'images') {
      // Split by commas and properly handle whitespace
      const imageUrls = value.split(',').map(url => url.trim()).filter(url => url !== '');
      setFormData({ ...formData, images: imageUrls });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };
  
  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[index][field] = value;
    setFormData({ ...formData, variants: updatedVariants });
  };
  
  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [...formData.variants, { price: 0, stock: 0, color: '', size: '' }]
    });
  };
  
  const removeVariant = (index) => {
    if (formData.variants.length > 1) {
      const updatedVariants = formData.variants.filter((_, i) => i !== index);
      setFormData({ ...formData, variants: updatedVariants });
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Validate form data
      if (!formData.name.trim()) {
        setError('Product name is required');
        setLoading(false);
        return;
      }
      
      if (!formData.variants || formData.variants.length === 0) {
        setError('At least one product variant is required');
        setLoading(false);
        return;
      }
      
      // Validate variants
      const invalidVariants = formData.variants.filter(
        variant => !variant.price || variant.price <= 0 || !variant.stock || variant.stock < 0
      );
      
      if (invalidVariants.length > 0) {
        setError('All variants must have valid price and stock values');
        setLoading(false);
        return;
      }
      
      // Create a copy of the form data for submission
      const productData = {
        ...formData,
        // Ensure variants have proper number types
        variants: formData.variants.map(variant => ({
          ...variant,
          price: parseFloat(variant.price),
          stock: parseInt(variant.stock),
        })),
        // Ensure images is properly formatted (array or string)
        images: Array.isArray(formData.images) ? formData.images : []
      };
      
      console.log('Submitting product data:', productData);
      
      let response;
      if (id) {
        // Update existing product
        response = await productService.updateProduct(id, productData);
        console.log('Product updated successfully:', response);
        alert('Product updated successfully');
      } else {
        // Create new product
        response = await productService.createProduct(productData);
        console.log('Product created successfully:', response);
        alert('Product created successfully');
      }
      
      navigate('/admin');
    } catch (error) {
      console.error('Error saving product:', error);
      
      let errorMessage = 'Failed to save product. Please try again.';
      
      if (error.response && error.response.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      setCouponLoading(true);
      setCouponError(null);
      const response = await couponService.getAllCoupons();
      setCoupons(response.data);
      setCouponLoading(false);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      setCouponError('Failed to load coupons');
      setCouponLoading(false);
    }
  };

  const handleCouponInputChange = (e) => {
    const { name, value } = e.target;
    setCouponFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCouponSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setCouponLoading(true);
      setCouponError(null);
      
      // Validate form
      if (!couponFormData.code) {
        setCouponError('Coupon code is required');
        setCouponLoading(false);
        return;
      }
      
      if (!couponFormData.discountPercentage || 
          couponFormData.discountPercentage <= 0 || 
          couponFormData.discountPercentage > 100) {
        setCouponError('Discount percentage must be between 1 and 100');
        setCouponLoading(false);
        return;
      }
      
      if (!couponFormData.expiresAt) {
        setCouponError('Expiration date is required');
        setCouponLoading(false);
        return;
      }
      
      // Format data
      const couponData = {
        code: couponFormData.code,
        discountPercentage: parseInt(couponFormData.discountPercentage),
        expiresAt: new Date(couponFormData.expiresAt).toISOString()
      };
      
      let response;
      if (editingCouponId) {
        // Update existing coupon
        response = await couponService.updateCoupon(editingCouponId, couponData);
        alert('Coupon updated successfully');
      } else {
        // Create new coupon
        response = await couponService.createCoupon(couponData);
        alert('Coupon created successfully');
      }
      
      // Reset form
      setCouponFormData({
        code: '',
        discountPercentage: 10,
        expiresAt: ''
      });
      setEditingCouponId(null);
      
      // Refresh coupons list
      fetchCoupons();
      setCouponLoading(false);
    } catch (error) {
      console.error('Error saving coupon:', error);
      setCouponError(error.response?.data?.message || 'Failed to save coupon');
      setCouponLoading(false);
    }
  };

  const handleEditCoupon = (coupon) => {
    // Format date for the input field (YYYY-MM-DD)
    const expiryDate = new Date(coupon.expires_at);
    const formattedDate = expiryDate.toISOString().split('T')[0];
    
    setCouponFormData({
      code: coupon.code,
      discountPercentage: coupon.discount_percentage,
      expiresAt: formattedDate
    });
    setEditingCouponId(coupon.id);
  };

  const handleDeleteCoupon = async (couponId) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      try {
        setCouponLoading(true);
        await couponService.deleteCoupon(couponId);
        alert('Coupon deleted successfully');
        fetchCoupons();
        setCouponLoading(false);
      } catch (error) {
        console.error('Error deleting coupon:', error);
        setCouponError('Failed to delete coupon');
        setCouponLoading(false);
      }
    }
  };

  const renderCouponManagement = () => {
    return (
      <div className="admin-section">
        <h2 className="section-title">Coupon Management</h2>
        
        {couponError && (
          <div className="error">{couponError}</div>
        )}
        
        <form onSubmit={handleCouponSubmit} className="coupon-form">
          <h3>{editingCouponId ? 'Edit Coupon' : 'Create New Coupon'}</h3>
          
          <div className="form-group">
            <label htmlFor="code">Coupon Code</label>
            <input
              type="text"
              id="code"
              name="code"
              value={couponFormData.code}
              onChange={handleCouponInputChange}
              className="form-input"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="discountPercentage">Discount Percentage</label>
            <input
              type="number"
              id="discountPercentage"
              name="discountPercentage"
              min="1"
              max="100"
              value={couponFormData.discountPercentage}
              onChange={handleCouponInputChange}
              className="form-input"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="expiresAt">Expiration Date</label>
            <input
              type="date"
              id="expiresAt"
              name="expiresAt"
              value={couponFormData.expiresAt}
              onChange={handleCouponInputChange}
              className="form-input"
              required
            />
          </div>
          
          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-button"
              disabled={couponLoading}
            >
              {couponLoading ? 'Saving...' : editingCouponId ? 'Update Coupon' : 'Create Coupon'}
            </button>
            
            {editingCouponId && (
              <button
                type="button"
                onClick={() => {
                  setEditingCouponId(null);
                  setCouponFormData({
                    code: '',
                    discountPercentage: 10,
                    expiresAt: ''
                  });
                }}
                className="cancel-button"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
        
        <h3>Existing Coupons</h3>
        {couponLoading ? (
          <p className="loading">Loading coupons...</p>
        ) : coupons.length === 0 ? (
          <p className="empty-message">No coupons found.</p>
        ) : (
          <div className="coupon-list">
            <div className="responsive-table">
              <table className="coupon-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Discount</th>
                    <th>Expires</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map(coupon => {
                    const now = new Date();
                    const expiryDate = new Date(coupon.expires_at);
                    const isExpired = now > expiryDate;
                    
                    return (
                      <tr key={coupon.id}>
                        <td>{coupon.code}</td>
                        <td>{coupon.discount_percentage}%</td>
                        <td>{new Date(coupon.expires_at).toLocaleDateString()}</td>
                        <td className={isExpired ? 'status-expired' : 'status-active'}>
                          {isExpired ? 'Expired' : 'Active'}
                        </td>
                        <td className="action-buttons">
                          <button 
                            onClick={() => handleEditCoupon(coupon)}
                            className="edit-button"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteCoupon(coupon.id)}
                            className="delete-button"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Products section in render
  const renderProductsSection = () => {
    return (
      <div className="admin-section">
        <div className="section-header">
          <h2 className="section-title">Products</h2>
          <button 
            className="add-button"
            onClick={() => navigate('/admin/products/new')}
          >
            Add New Product
          </button>
        </div>
        
        {loading ? (
          <div className="loading">Loading products...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <div className="products-grid">
            {products.length === 0 ? (
              <p className="empty-message">No products found. Add your first product!</p>
            ) : (
              products.map(product => (
                <div key={product.id} className="product-card">
                  <div className="product-image-container">
                    {Array.isArray(product.images) && product.images.length > 0 ? (
                      <img 
                        src={product.images[0]} 
                        alt={product.name} 
                        className="product-image"
                        onError={(e) => {e.target.onerror = null; e.target.src='/img/placeholder-product.jpg'}}
                      />
                    ) : (
                      <img 
                        src="/img/placeholder-product.jpg" 
                        alt={product.name} 
                        className="product-image"
                      />
                    )}
                  </div>
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-category">{product.category}</p>
                    <div className="product-actions">
                      <button 
                        className="edit-button"
                        onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  if (!isAdmin) {
    return <div style={styles.message}>Checking permissions...</div>;
  }

  if (loading && (location.pathname.includes('/products/new') || location.pathname.includes('/products/edit/'))) {
    return <div style={styles.message}>Loading...</div>;
  }

  if (error && (location.pathname.includes('/products/new') || location.pathname.includes('/products/edit/'))) {
    return <div style={styles.error}>{error}</div>;
  }
  
  // Product form for new/edit product
  if (location.pathname.includes('/products/new') || location.pathname.includes('/products/edit/')) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>{id ? 'Edit Product' : 'Add New Product'}</h1>
        
        <div style={styles.adminSection}>
          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label htmlFor="name">Product Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                style={styles.input}
              />
            </div>
            
            <div style={styles.formGroup}>
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                style={styles.textarea}
              />
            </div>
            
            <div style={styles.formGroup}>
              <label htmlFor="category">Category</label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                style={styles.input}
              />
            </div>
            
            <div style={styles.formGroup}>
              <label htmlFor="images">Image URLs</label>
              <textarea
                id="images"
                name="images"
                value={Array.isArray(formData.images) ? formData.images.join(', ') : ''}
                onChange={handleInputChange}
                placeholder="Enter image URLs separated by commas"
                style={{...styles.textarea, minHeight: '80px'}}
              />
              <small style={styles.helperText}>Enter multiple image URLs separated by commas. Each URL should be a direct link to an image.</small>
              
              {/* Preview of images if available */}
              {Array.isArray(formData.images) && formData.images.length > 0 && (
                <div style={styles.imagePreviewContainer}>
                  <p style={styles.previewLabel}>Image Previews:</p>
                  <div style={styles.imagePreviews}>
                    {formData.images.map((url, i) => (
                      <div key={i} style={styles.imagePreview}>
                        <img 
                          src={url} 
                          alt={`Preview ${i+1}`} 
                          style={styles.previewImage}
                          onError={(e) => {e.target.onerror = null; e.target.src='/img/placeholder-invalid.jpg'}}
                        />
                        <button 
                          type="button" 
                          onClick={() => {
                            const newImages = [...formData.images];
                            newImages.splice(i, 1);
                            setFormData({...formData, images: newImages});
                          }}
                          style={styles.removeImageButton}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <h3>Variants</h3>
            {formData.variants.map((variant, index) => (
              <div key={index} style={styles.variantContainer}>
                <h4>Variant {index + 1}</h4>
                <div style={styles.variantForm}>
                  <div style={styles.formGroup}>
                    <label>Price</label>
                    <input
                      type="number"
                      value={variant.price}
                      onChange={(e) => handleVariantChange(index, 'price', parseFloat(e.target.value))}
                      required
                      min="0"
                      step="0.01"
                      style={styles.input}
                    />
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label>Stock</label>
                    <input
                      type="number"
                      value={variant.stock}
                      onChange={(e) => handleVariantChange(index, 'stock', parseInt(e.target.value))}
                      required
                      min="0"
                      style={styles.input}
                    />
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label>Color</label>
                    <input
                      type="text"
                      value={variant.color}
                      onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                      style={styles.input}
                    />
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label>Size</label>
                    <input
                      type="text"
                      value={variant.size}
                      onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                      style={styles.input}
                    />
                  </div>
                  
                  {formData.variants.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeVariant(index)}
                      style={styles.deleteButton}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            <button 
              type="button" 
              onClick={addVariant}
              style={styles.addVariantButton}
            >
              Add Variant
            </button>
            
            <div style={styles.formActions}>
              <button type="submit" style={styles.submitButton}>
                {id ? 'Update Product' : 'Create Product'}
              </button>
              <button 
                type="button" 
                onClick={() => navigate('/admin')}
                style={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Main render function
  if (loading && products.length === 0) {
    return <div className="loading-screen">Loading...</div>;
  }

  // If we're on an edit page, render the edit form
  if (location.pathname.includes('/edit/') && id) {
    // ... existing edit form render
  } else {
    // Render the main dashboard
    return (
      <div className="admin-dashboard">
        <div className="admin-sidebar">
          <h2 className="admin-logo">Admin Dashboard</h2>
          <nav className="admin-nav">
            <button 
              className={activeTab === 'products' ? 'nav-link active' : 'nav-link'}
              onClick={() => setActiveTab('products')}
            >
              Products
            </button>
            <button 
              className={activeTab === 'orders' ? 'nav-link active' : 'nav-link'}
              onClick={() => setActiveTab('orders')}
            >
              Orders
            </button>
            <button 
              className={activeTab === 'coupons' ? 'nav-link active' : 'nav-link'}
              onClick={() => setActiveTab('coupons')}
            >
              Coupons
            </button>
          </nav>
        </div>
        
        <div className="admin-content">
          {activeTab === 'products' && renderProductsSection()}
          
          {activeTab === 'orders' && (
            <div className="admin-section">
              <AdminOrderManagement />
            </div>
          )}
          
          {activeTab === 'coupons' && renderCouponManagement()}
        </div>
      </div>
    );
  }
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px'
  },
  title: {
    marginBottom: '30px',
    color: '#333',
    borderBottom: '2px solid #457b9d',
    paddingBottom: '10px'
  },
  adminSection: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    marginBottom: '30px'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  sectionTitle: {
    margin: 0,
    fontSize: '1.5rem',
    color: '#333'
  },
  addButton: {
    backgroundColor: '#2a9d8f',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(1, 1fr)',
    gap: '20px',
    '@media (min-width: 576px)': {
      gridTemplateColumns: 'repeat(2, 1fr)'
    },
    '@media (min-width: 768px)': {
      gridTemplateColumns: 'repeat(3, 1fr)'
    },
    '@media (min-width: 992px)': {
      gridTemplateColumns: 'repeat(4, 1fr)'
    }
  },
  productCard: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    overflow: 'hidden'
  },
  productImageContainer: {
    width: '100%',
    height: '200px',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f8f9fa'
  },
  productImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    padding: '10px'
  },
  productInfo: {
    padding: '15px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  productName: {
    margin: '0 0 5px 0',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    color: '#333'
  },
  productCategory: {
    margin: '0 0 15px 0',
    fontSize: '0.9rem',
    color: '#666'
  },
  productActions: {
    display: 'flex',
    gap: '10px',
    marginTop: 'auto'
  },
  editButton: {
    backgroundColor: '#457b9d',
    color: 'white',
    border: 'none',
    padding: '5px 10px',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  deleteButton: {
    backgroundColor: '#e63946',
    color: 'white',
    border: 'none',
    padding: '5px 10px',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  message: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '1.2rem',
    color: '#666'
  },
  error: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '1.2rem',
    color: '#e63946'
  },
  formGroup: {
    marginBottom: '15px'
  },
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '4px'
  },
  textarea: {
    width: '100%',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ddd'
  },
  variantContainer: {
    marginBottom: '20px',
    padding: '15px',
    border: '1px solid #ddd',
    borderRadius: '4px'
  },
  variantForm: {
    display: 'grid',
    gridTemplateColumns: 'repeat(1, 1fr)',
    gap: '10px',
    '@media (min-width: 576px)': {
      gridTemplateColumns: 'repeat(2, 1fr)'
    },
    '@media (min-width: 992px)': {
      gridTemplateColumns: 'repeat(4, 1fr)'
    }
  },
  addVariantButton: {
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    marginBottom: '20px'
  },
  formActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px'
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  couponForm: {
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '5px',
    maxWidth: '600px'
  },
  couponList: {
    marginTop: '20px',
    overflowX: 'auto'
  },
  couponTable: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  actionButtons: {
    display: 'flex',
    gap: '10px'
  },
  editButton: {
    padding: '5px 10px',
    backgroundColor: '#17a2b8',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  deleteButton: {
    padding: '5px 10px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  dashboard: {
    display: 'flex',
    minHeight: '100vh',
    flexDirection: 'column',
    '@media (min-width: 768px)': {
      flexDirection: 'row'
    }
  },
  sidebar: {
    width: '100%',
    backgroundColor: '#343a40',
    color: 'white',
    padding: '20px',
    '@media (min-width: 768px)': {
      width: '250px'
    }
  },
  logo: {
    fontSize: '24px',
    marginBottom: '30px',
    textAlign: 'center'
  },
  nav: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: '10px',
    '@media (min-width: 768px)': {
      flexDirection: 'column'
    }
  },
  navLink: {
    padding: '10px 15px',
    backgroundColor: 'transparent',
    color: '#ccc',
    border: 'none',
    textAlign: 'left',
    fontSize: '16px',
    cursor: 'pointer',
    borderRadius: '4px'
  },
  activeNavLink: {
    padding: '10px 15px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    textAlign: 'left',
    fontSize: '16px',
    cursor: 'pointer',
    borderRadius: '4px'
  },
  content: {
    flex: 1,
    padding: '15px',
    backgroundColor: '#f8f9fa',
    '@media (min-width: 768px)': {
      padding: '30px'
    }
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '1.2rem',
    color: '#666'
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#666',
    padding: '40px',
    fontSize: '1.1rem'
  },
  helperText: {
    fontSize: '0.8rem',
    color: '#666'
  },
  imagePreviewContainer: {
    marginTop: '15px',
    marginBottom: '20px',
    padding: '15px',
    border: '1px solid #ddd',
    borderRadius: '4px'
  },
  previewLabel: {
    marginBottom: '10px',
    fontWeight: 'bold'
  },
  imagePreviews: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px'
  },
  imagePreview: {
    position: 'relative',
    width: '100px',
    height: '100px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  previewImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  removeImageButton: {
    position: 'absolute',
    top: '2px',
    right: '2px',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    color: '#d32f2f',
    border: 'none',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold'
  }
};

export default AdminDashboard; 