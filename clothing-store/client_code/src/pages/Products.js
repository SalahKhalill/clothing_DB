import React, { useState, useEffect } from 'react';
import { productService } from '../services/api';
import ProductCard from '../components/ProductCard';
import { useLocation } from 'react-router-dom';
import '../styles/Products.css';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();

  // Define fixed categories
  const categories = ['Men', 'Women'];

  useEffect(() => {
    // Get parameters from URL query parameters
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get('category');
    const searchParam = params.get('search');
    
    if (categoryParam) {
      // Convert to proper case to match our category format (Men, Women)
      const formattedCategory = categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1).toLowerCase();
      if (categories.includes(formattedCategory)) {
        setSelectedCategory(formattedCategory);
      }
    }
    
    if (searchParam) {
      setSearchQuery(searchParam);
    } else {
      setSearchQuery('');
    }
    
    fetchProducts();
  }, [location.search]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getAllProducts();
      
      // Process products to ensure they have a category that is Men or Women
      const processedProducts = response.data.map(product => {
        // If the product doesn't have a category or it's not Men/Women, set to a default
        if (!product.category || !categories.includes(product.category)) {
          return { ...product, category: determineDefaultCategory(product) };
        }
        return product;
      });
      
      setProducts(processedProducts);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again later.');
      setLoading(false);
    }
  };
  
  // Helper to determine a default category based on product name or description
  const determineDefaultCategory = (product) => {
    const text = (product.name + ' ' + (product.description || '')).toLowerCase();
    if (text.includes('men') || text.includes('male') || text.includes('guy')) {
      return 'Men';
    } else if (text.includes('women') || text.includes('female') || text.includes('lady')) {
      return 'Women';
    }
    // Randomly assign if no clear indicator
    return Math.random() > 0.5 ? 'Men' : 'Women';
  };
  
  // First filter by category
  const categoryFilteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory);
  
  // Then filter by search query
  const filteredProducts = searchQuery 
    ? categoryFilteredProducts.filter(p => {
        const productText = [
          p.name,
          p.description,
          p.category,
          ...(p.tags || [])
        ].join(' ').toLowerCase();
        
        return productText.includes(searchQuery.toLowerCase());
      })
    : categoryFilteredProducts;

  if (loading) {
    return <div className="loading-message">Loading products...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (products.length === 0) {
    return <div className="empty-message">No products available at the moment.</div>;
  }

  return (
    <div className="products-page">
      <div className="products-container">
        <div className="products-header">
          <h1 className="products-title">Our Products</h1>
          <p className="products-subtitle">Discover our latest collection of trendy clothing and accessories</p>
        </div>
        
        <div className="filter-container">
          <div className="category-filter">
            <button 
              onClick={() => setSelectedCategory('all')}
              className={`category-button ${selectedCategory === 'all' ? 'active-category' : ''}`}
            >
              All Products
            </button>
            {categories.map(category => (
              <button 
                key={category} 
                onClick={() => setSelectedCategory(category)}
                className={`category-button ${selectedCategory === category ? 'active-category' : ''}`}
              >
                {category}
              </button>
            ))}
          </div>
          
          {searchQuery && (
            <div className="search-results-info">
              <p>Search results for: <span className="search-query">"{searchQuery}"</span></p>
              <button 
                className="clear-search-btn" 
                onClick={() => window.location.href = '/products'}
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
        
        <div className="results-info">
          Showing {filteredProducts.length} of {products.length} products
        </div>
        
        {filteredProducts.length === 0 && searchQuery && (
          <div className="no-results-message">
            <p>No products match your search criteria.</p>
            <p>Try different keywords or browse our categories.</p>
          </div>
        )}
        
        <div className="product-grid">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Products; 