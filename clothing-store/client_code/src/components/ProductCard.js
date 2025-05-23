import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartService, wishlistService } from '../services/api';
import { useAuth } from '../services/authContext';
import '../styles/ProductCard.css';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants && product.variants.length > 0 ? product.variants[0] : null
  );
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  // Get unique colors and sizes from variants
  const colors = [...new Set(product.variants?.map(v => v.color) || [])];
  const sizes = [...new Set(product.variants?.map(v => v.size) || [])];

  // Find matching variant based on selected color and size
  const findMatchingVariant = (color, size) => {
    return product.variants?.find(v => v.color === color && v.size === size);
  };

  const handleColorChange = (color) => {
    setSelectedColor(color);
    const matchingVariant = findMatchingVariant(color, selectedSize);
    if (matchingVariant) {
      setSelectedVariant(matchingVariant);
    }
  };

  const handleSizeChange = (size) => {
    setSelectedSize(size);
    const matchingVariant = findMatchingVariant(selectedColor, size);
    if (matchingVariant) {
      setSelectedVariant(matchingVariant);
    }
  };

  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    if (!selectedVariant) {
      alert('Please view details to select a variant');
      return;
    }

    try {
      await cartService.addToCart(selectedVariant.id, 1);
      alert('Product added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      if (error.response && error.response.status === 401) {
        alert('Please login to add items to cart');
      } else {
        alert('Failed to add product to cart');
      }
    }
  };

  const handleAddToWishlist = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    
    if (!product || !product.id) {
      alert('Product information is missing');
      return;
    }

    try {
      console.log('Adding product to wishlist in ProductCard.js, product details:', { 
        id: product.id, 
        name: product.name,
        category: product.category 
      });
      await wishlistService.addToWishlist(product.id);
      alert('Product added to wishlist!');
    } catch (error) {
      console.error('Error adding to wishlist in ProductCard.js:', error);
      if (error.response && error.response.status === 401) {
        alert('Please login to add items to wishlist');
      } else if (error.response && error.response.status === 400 && error.response.data.message === 'Item already in wishlist') {
        alert('This product is already in your wishlist');
      } else {
        const errorMsg = (error.response?.data?.message || error.message);
        console.error('Wishlist error details:', errorMsg);
        alert('Failed to add product to wishlist: ' + errorMsg);
      }
    }
  };

  const getPrice = () => {
    if (!product.variants || product.variants.length === 0) {
      return 'N/A';
    }
    
    const prices = product.variants.map(v => v.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    return minPrice === maxPrice 
      ? `$${minPrice}` 
      : `$${minPrice} - $${maxPrice}`;
  };

  // Extract main image from product data
  const getProductImage = () => {
    let imageUrl = '/img/placeholder-product.jpg';
    
    if (product.images) {
      if (Array.isArray(product.images) && product.images.length > 0) {
        imageUrl = product.images[0];
      } else if (typeof product.images === 'string') {
        // Handle comma-separated string of images
        if (product.images.includes(',')) {
          const firstImage = product.images.split(',')[0].trim();
          if (firstImage) imageUrl = firstImage;
        } else if (product.images.trim() !== '') {
          imageUrl = product.images.trim();
        }
      }
    }
    
    // Format URL if needed
    if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/img/placeholder')) {
      imageUrl = imageUrl.startsWith('/') ? `${process.env.REACT_APP_API_URL || ''}${imageUrl}` : `/${imageUrl}`;
    }
    
    return imageUrl;
  };

  return (
    <div className="product-card">
      <div className="product-image-container">
        <img 
          src={getProductImage()} 
          alt={product.name} 
          className="product-image" 
          onError={(e) => {
            e.target.onerror = null; 
            e.target.src='/img/placeholder-product.jpg';
          }}
        />
        
        <div className="product-overlay">
          <Link to={`/products/${product.id}`} className="view-details-button">
            View Details
          </Link>
        </div>
      </div>
      
      <div className="product-content">
        <h3 className="product-title">{product.name}</h3>
        <p className="product-category">{product.category}</p>
        <p className="product-price">{getPrice()}</p>
        
        <div className="product-actions">
          <button 
            onClick={handleAddToCart} 
            className="add-to-cart-button"
          >
            Add to Cart
          </button>
          <button 
            onClick={handleAddToWishlist} 
            className="wishlist-button"
          >
            ♥
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard; 