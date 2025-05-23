import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { productService, cartService, wishlistService, reviewService } from '../services/api';
import { useAuth } from '../services/authContext';

const ProductDetail = () => {
  const { id } = useParams();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  
  // Image gallery state
  const [productImages, setProductImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  
  // Check if the URL has a review parameter
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const showForm = queryParams.get('review') === 'true';
    if (showForm) {
      setShowReviewForm(true);
    }
  }, [location.search]);

  useEffect(() => {
    fetchProduct();
    fetchReviews();
    if (isLoggedIn) {
      checkCanReview();
    }
  }, [id, isLoggedIn]);
  
  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productService.getProductById(id);
      setProduct(response.data);
      
      // Process product images
      let images = [];
      if (Array.isArray(response.data.images) && response.data.images.length > 0) {
        // Filter out empty strings or invalid URLs
        images = response.data.images.filter(url => url && url.trim() !== '');
      } else if (typeof response.data.images === 'string' && response.data.images.trim() !== '') {
        // Handle single image string or comma-separated list
        if (response.data.images.includes(',')) {
          images = response.data.images.split(',')
            .map(url => url.trim())
            .filter(url => url !== '');
        } else {
          images = [response.data.images.trim()];
        }
      }
      
      // Validate image URLs
      images = images.map(url => {
        // Ensure URL has proper format
        if (!url.startsWith('http')) {
          // If it's a relative path, convert to absolute
          return url.startsWith('/') ? `${process.env.REACT_APP_API_URL || ''}${url}` : `/${url}`;
        }
        return url;
      });
      
      // If no images found, add a placeholder
      if (images.length === 0) {
        images = ['/img/placeholder-product.jpg'];
      }
      
      console.log('Processed images:', images);
      setProductImages(images);
      setSelectedImageIndex(0);
      
      // Set the first variant as selected by default
      if (response.data.variants && response.data.variants.length > 0) {
        setSelectedVariant(response.data.variants[0]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Failed to load product details.');
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      const response = await reviewService.getProductReviews(id);
      setReviews(response.data || []);
      setLoadingReviews(false);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
      setLoadingReviews(false);
    }
  };

  const checkCanReview = async () => {
    try {
      const result = await reviewService.checkCanReview(id);
      setCanReview(result.canReview);
    } catch (error) {
      console.error('Error checking if user can review:', error);
      setCanReview(false);
    }
  };
  
  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant);
  };
  
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= (selectedVariant?.stock || 10)) {
      setQuantity(value);
    }
  };
  
  const addToCart = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    
    if (!selectedVariant) {
      alert('Please select a product variant');
      return;
    }

    if (!selectedVariant.id) {
      alert('Invalid product variant data. Please try selecting a different variant.');
      return;
    }
    
    try {
      setAddingToCart(true);
      console.log('Adding to cart:', selectedVariant.id, quantity);
      await cartService.addToCart(selectedVariant.id, quantity);
      alert('Product added to cart!');
      setAddingToCart(false);
    } catch (error) {
      console.error('Error adding to cart:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      alert('Failed to add product to cart. ' + (error.response?.data?.message || error.message));
      setAddingToCart(false);
    }
  };
  
  const addToWishlist = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    
    if (!product || !product.id) {
      alert('Product information is not available');
      return;
    }
    
    try {
      setAddingToWishlist(true);
      console.log('Adding product to wishlist, ID:', product.id);
      await wishlistService.addToWishlist(product.id);
      alert('Product added to wishlist!');
      setAddingToWishlist(false);
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      if (error.response && error.response.status === 400 && error.response.data.message === 'Item already in wishlist') {
        alert('This product is already in your wishlist');
      } else {
        alert('Failed to add product to wishlist: ' + (error.response?.data?.message || error.message));
      }
      setAddingToWishlist(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    
    if (reviewRating < 1 || reviewRating > 5) {
      setReviewError('Rating must be between 1 and 5');
      return;
    }
    
    if (!reviewComment.trim()) {
      setReviewError('Please enter a review comment');
      return;
    }
    
    try {
      setSubmittingReview(true);
      setReviewError(null);
      
      const reviewData = {
        productId: id,
        rating: reviewRating,
        comment: reviewComment
      };
      
      await reviewService.createReview(reviewData);
      
      // Refresh reviews
      fetchReviews();
      
      // Reset form
      setReviewRating(5);
      setReviewComment('');
      setShowReviewForm(false);
      setSubmittingReview(false);
      
      // Update can review status
      checkCanReview();
      
      alert('Thank you for your review!');
    } catch (error) {
      console.error('Error submitting review:', error);
      setReviewError(error.response?.data?.message || 'Failed to submit review. Please try again.');
      setSubmittingReview(false);
    }
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    return (
      <div style={styles.starsContainer}>
        {[...Array(fullStars)].map((_, i) => (
          <span key={`full-${i}`} style={styles.star}>★</span>
        ))}
        {halfStar && <span style={styles.star}>★</span>}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={`empty-${i}`} style={styles.emptyStar}>☆</span>
        ))}
      </div>
    );
  };
  
  if (loading) {
    return <div style={styles.loading}>Loading product details...</div>;
  }
  
  if (error) {
    return <div style={styles.error}>{error}</div>;
  }
  
  if (!product) {
    return <div style={styles.error}>Product not found</div>;
  }
  
  return (
    <div style={styles.pageContainer}>
      <div style={styles.breadcrumbs}>
        <span onClick={() => navigate('/')} style={styles.breadcrumbItem}>Home</span>
        <span style={styles.breadcrumbSeparator}>/</span>
        <span onClick={() => navigate('/products')} style={styles.breadcrumbItem}>Products</span>
        <span style={styles.breadcrumbSeparator}>/</span>
        <span style={styles.breadcrumbActive}>{product.name}</span>
      </div>
      
      <div style={styles.container}>
        <div style={styles.productContainer}>
          <div style={styles.imageContainer}>
            <div style={styles.mainImageWrapper}>
              <img 
                src={productImages[selectedImageIndex]} 
                alt={product.name} 
                style={styles.productImage} 
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src='/img/placeholder-product.jpg';
                }}
              />
              
              {productImages.length > 1 && (
                <>
                  <button 
                    style={{...styles.imageNavButton, left: '10px'}} 
                    className="prev" 
                    onClick={() => setSelectedImageIndex((prevIndex) => 
                      prevIndex === 0 ? productImages.length - 1 : prevIndex - 1
                    )}
                  >
                    &#10094;
                  </button>
                  <button 
                    style={{...styles.imageNavButton, right: '10px'}} 
                    className="next"
                    onClick={() => setSelectedImageIndex((prevIndex) => 
                      prevIndex === productImages.length - 1 ? 0 : prevIndex + 1
                    )}
                  >
                    &#10095;
                  </button>
                </>
              )}
            </div>
            
            {productImages.length > 1 && (
              <div style={styles.thumbnailContainer}>
                {productImages.map((img, index) => (
                  <div 
                    key={index} 
                    style={{
                      ...styles.thumbnail,
                      ...(selectedImageIndex === index ? styles.activeThumbnail : {})
                    }}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <img 
                      src={img} 
                      alt={`${product.name} - view ${index + 1}`} 
                      style={styles.thumbnailImage}
                      onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src='/img/placeholder-thumbnail.jpg';
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div style={styles.productInfo}>
            <h1 style={styles.productName}>{product.name}</h1>
            
            {selectedVariant && (
              <div style={styles.priceContainer}>
                <span style={styles.price}>${selectedVariant.price}</span>
                <span style={styles.stock}>
                  {selectedVariant.stock > 0 
                    ? <span style={{color: 'green'}}>In Stock ({selectedVariant.stock} available)</span> 
                    : <span style={{color: 'red'}}>Out of Stock</span>}
                </span>
              </div>
            )}
            
            <div style={styles.divider}></div>
            
            <p style={styles.productDescription}>{product.description}</p>
            
            <div style={styles.variantsContainer}>
              <h3 style={styles.variantsTitle}>Available Options</h3>
              <div style={styles.variantsList}>
                {product.variants && product.variants.map((variant) => (
                  <div
                    key={variant.id}
                    onClick={() => handleVariantSelect(variant)}
                    style={{
                      ...styles.variantCard,
                      ...(selectedVariant && selectedVariant.id === variant.id 
                        ? styles.selectedVariant 
                        : {})
                    }}
                  >
                    <div style={styles.variantDetails}>
                      {variant.color && (
                        <div style={styles.variantProperty}>
                          <span style={styles.variantLabel}>Color:</span> 
                          <span style={styles.variantValue}>{variant.color}</span>
                        </div>
                      )}
                      {variant.size && (
                        <div style={styles.variantProperty}>
                          <span style={styles.variantLabel}>Size:</span> 
                          <span style={styles.variantValue}>{variant.size}</span>
                        </div>
                      )}
                    </div>
                    <div style={styles.variantPrice}>${variant.price}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div style={styles.divider}></div>
            
            <div style={styles.quantityContainer}>
              <label style={styles.quantityLabel}>Quantity:</label>
              <div style={styles.quantityControls}>
                <button 
                  onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                  style={styles.quantityButton}
                >-</button>
                <input 
                  type="number" 
                  min="1" 
                  max={selectedVariant?.stock || 10}
                  value={quantity}
                  onChange={handleQuantityChange}
                  style={styles.quantityInput}
                />
                <button 
                  onClick={() => quantity < (selectedVariant?.stock || 10) && setQuantity(quantity + 1)}
                  style={styles.quantityButton}
                >+</button>
              </div>
            </div>
            
            <div style={styles.actionsContainer}>
              <button 
                onClick={addToCart}
                disabled={addingToCart || !selectedVariant || selectedVariant.stock <= 0}
                style={{
                  ...styles.addToCartButton,
                  ...(addingToCart ? styles.processingButton : {}),
                  ...(!selectedVariant || selectedVariant.stock <= 0 ? styles.disabledButton : {})
                }}
              >
                {addingToCart ? 'Adding...' : 'Add to Cart'}
              </button>
              
              <button 
                onClick={addToWishlist}
                disabled={addingToWishlist}
                style={{
                  ...styles.wishlistButton,
                  ...(addingToWishlist ? styles.processingButton : {})
                }}
              >
                {addingToWishlist ? 'Adding...' : '♥ Add to Wishlist'}
              </button>
            </div>
            
            <div style={styles.divider}></div>
            
            <div style={styles.metadata}>
              <div style={styles.metaItem}>
                <span style={styles.metaLabel}>Category:</span>
                <span style={styles.metaValue}>{product.category}</span>
              </div>
              <div style={styles.metaItem}>
                <span style={styles.metaLabel}>SKU:</span>
                <span style={styles.metaValue}>PROD-{product.id}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Reviews Container */}
        <div style={styles.container}>
          <div style={styles.reviewsContainer}>
            <div style={styles.reviewsHeader}>
              <h2 style={styles.reviewsTitle}>Customer Reviews</h2>
              
              {isLoggedIn && canReview && !showReviewForm && (
                <button 
                  style={styles.writeReviewButton}
                  onClick={() => setShowReviewForm(true)}
                >
                  Write a Review
                </button>
              )}
            </div>
            
            {showReviewForm && (
              <div style={styles.reviewFormContainer}>
                <h3 style={styles.reviewFormTitle}>Write Your Review</h3>
                
                {reviewError && (
                  <div style={styles.reviewFormError}>{reviewError}</div>
                )}
                
                <form style={styles.reviewForm} onSubmit={handleSubmitReview}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Rating</label>
                    <div style={styles.ratingSelector}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span 
                          key={star}
                          onClick={() => setReviewRating(star)}
                          style={styles.ratingStar}
                        >
                          {star <= reviewRating ? '★' : '☆'}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Your Review</label>
                    <textarea 
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      style={styles.reviewTextarea}
                      rows="5"
                      required
                    ></textarea>
                  </div>
                  
                  <button 
                    type="submit" 
                    style={styles.submitReviewButton}
                    disabled={submittingReview}
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              </div>
            )}
            
            {loadingReviews ? (
              <div style={styles.reviewsLoading}>Loading reviews...</div>
            ) : reviews.length === 0 ? (
              <div style={styles.noReviews}>
                <p>No reviews yet. Be the first to review this product!</p>
              </div>
            ) : (
              <div style={styles.reviewsList}>
                {reviews.map((review) => (
                  <div key={review.id} style={styles.reviewItem}>
                    <div style={styles.reviewHeader}>
                      <div style={styles.reviewUser}>
                        {review.user?.first_name || 'Anonymous'} {review.user?.last_name?.charAt(0) || ''}
                      </div>
                      <div style={styles.reviewDate}>
                        {new Date(review.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div style={styles.reviewRating}>
                      {renderStars(review.rating)}
                    </div>
                    
                    <div style={styles.reviewComment}>
                      {review.comment}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  pageContainer: {
    backgroundColor: '#f8f9fa',
    minHeight: '100vh'
  },
  breadcrumbs: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontSize: '0.9rem',
    color: '#666'
  },
  breadcrumbItem: {
    cursor: 'pointer',
    color: '#457b9d'
  },
  breadcrumbSeparator: {
    margin: '0 10px'
  },
  breadcrumbActive: {
    color: '#333',
    fontWeight: '500'
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    marginBottom: '40px'
  },
  productContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '30px',
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)'
  },
  imageContainer: {
    flex: '1 1 400px',
    marginBottom: '20px',
    maxWidth: '600px'
  },
  mainImageWrapper: {
    position: 'relative',
    width: '100%',
    height: '400px',
    marginBottom: '10px',
    display: 'flex',
    justifyContent: 'center',
    overflow: 'hidden',
    border: '1px solid #eee',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9'
  },
  productImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    borderRadius: '8px',
    maxHeight: '400px'
  },
  imageNavButton: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(0, 0, 0, 0.3)',
    border: 'none',
    fontSize: '1.5rem',
    color: '#fff',
    cursor: 'pointer',
    padding: '10px 15px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.3s',
    zIndex: 5,
    ':hover': {
      background: 'rgba(0, 0, 0, 0.5)'
    }
  },
  thumbnailContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    justifyContent: 'center',
    marginTop: '15px'
  },
  thumbnail: {
    width: '60px',
    height: '60px',
    cursor: 'pointer',
    border: '1px solid #ddd',
    borderRadius: '4px',
    overflow: 'hidden',
    transition: 'transform 0.2s, border-color 0.2s',
    ':hover': {
      transform: 'scale(1.05)',
      borderColor: '#333'
    }
  },
  activeThumbnail: {
    borderColor: '#000',
    borderWidth: '2px',
    boxShadow: '0 0 5px rgba(0,0,0,0.3)'
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block'
  },
  productInfo: {
    flex: '1 1 400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  productName: {
    fontSize: '2rem',
    color: '#1d3557',
    margin: 0
  },
  priceContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  price: {
    fontSize: '1.8rem',
    fontWeight: 'bold',
    color: '#e63946'
  },
  stock: {
    fontSize: '0.9rem',
    color: '#333'
  },
  productDescription: {
    fontSize: '1rem',
    lineHeight: '1.6',
    color: '#555'
  },
  divider: {
    height: '1px',
    backgroundColor: '#ddd',
    width: '100%'
  },
  variantsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  variantsTitle: {
    fontSize: '1.2rem',
    color: '#1d3557',
    margin: 0
  },
  variantsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px'
  },
  variantCard: {
    border: '1px solid #ddd',
    borderRadius: '5px',
    padding: '10px',
    minWidth: '120px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  selectedVariant: {
    borderColor: '#457b9d',
    backgroundColor: '#f1faee'
  },
  variantDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  variantProperty: {
    fontSize: '0.9rem'
  },
  variantLabel: {
    fontWeight: 'bold',
    color: '#333'
  },
  variantValue: {
    color: '#555'
  },
  variantPrice: {
    marginTop: '8px',
    fontWeight: 'bold',
    color: '#e63946'
  },
  quantityContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  quantityLabel: {
    fontSize: '1rem',
    fontWeight: '500'
  },
  quantityControls: {
    display: 'flex',
    alignItems: 'center'
  },
  quantityButton: {
    width: '40px',
    height: '40px',
    border: '1px solid #ddd',
    background: 'none',
    fontSize: '1.2rem',
    cursor: 'pointer'
  },
  quantityInput: {
    width: '60px',
    height: '40px',
    border: '1px solid #ddd',
    borderLeft: 'none',
    borderRight: 'none',
    textAlign: 'center',
    fontSize: '1rem'
  },
  actionsContainer: {
    display: 'flex',
    gap: '15px',
    marginTop: '10px'
  },
  addToCartButton: {
    flex: '2',
    backgroundColor: '#1d3557',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    minWidth: '200px',
    transition: 'all 0.2s ease'
  },
  wishlistButton: {
    flex: '1',
    backgroundColor: '#f8f9fa',
    color: '#e63946',
    border: '1px solid #ddd',
    padding: '12px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    minWidth: '150px',
    transition: 'all 0.2s ease'
  },
  processingButton: {
    backgroundColor: '#f1f1f1',
    color: '#666',
    cursor: 'wait'
  },
  disabledButton: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed'
  },
  metadata: {
    marginTop: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  metaItem: {
    fontSize: '0.9rem',
    color: '#666'
  },
  metaLabel: {
    fontWeight: 'bold',
    marginRight: '10px'
  },
  // Reviews styles
  reviewsContainer: {
    marginTop: '40px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    padding: '30px'
  },
  reviewsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  reviewsTitle: {
    fontSize: '1.5rem',
    color: '#1d3557',
    margin: 0
  },
  writeReviewButton: {
    backgroundColor: '#2a9d8f',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500'
  },
  reviewFormContainer: {
    backgroundColor: '#f9f9f9',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '30px',
    border: '1px solid #eee'
  },
  reviewFormTitle: {
    fontSize: '1.2rem',
    color: '#1d3557',
    marginTop: 0,
    marginBottom: '15px'
  },
  reviewFormError: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '20px',
    fontSize: '0.9rem'
  },
  reviewForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  formLabel: {
    fontSize: '1rem',
    fontWeight: '500',
    color: '#333'
  },
  ratingSelector: {
    display: 'flex',
    gap: '10px'
  },
  ratingStar: {
    fontSize: '2rem',
    cursor: 'pointer'
  },
  reviewTextarea: {
    padding: '12px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '1rem',
    resize: 'vertical'
  },
  submitReviewButton: {
    backgroundColor: '#2a9d8f',
    color: 'white',
    border: 'none',
    padding: '12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    alignSelf: 'flex-start'
  },
  reviewsLoading: {
    padding: '20px',
    textAlign: 'center',
    color: '#666'
  },
  noReviews: {
    padding: '20px',
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic'
  },
  reviewsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  reviewItem: {
    padding: '20px',
    borderBottom: '1px solid #eee'
  },
  reviewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px'
  },
  reviewUser: {
    fontWeight: '600',
    color: '#333'
  },
  reviewDate: {
    color: '#666',
    fontSize: '0.9rem'
  },
  reviewRating: {
    marginBottom: '10px'
  },
  starsContainer: {
    display: 'flex',
    gap: '2px'
  },
  star: {
    color: '#FFA41C',
    fontSize: '1.2rem'
  },
  emptyStar: {
    color: '#ccc',
    fontSize: '1.2rem'
  },
  reviewComment: {
    lineHeight: '1.5',
    color: '#555'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '50vh',
    fontSize: '1.2rem',
    color: '#666'
  },
  error: {
    maxWidth: '800px',
    margin: '40px auto',
    padding: '20px',
    backgroundColor: '#ffebee',
    color: '#c62828',
    borderRadius: '8px',
    textAlign: 'center'
  }
};

export default ProductDetail; 