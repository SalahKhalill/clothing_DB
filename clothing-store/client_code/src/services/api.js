import axios from 'axios';

const API_URL = 'http://localhost:5002/api';

console.log('API URL configured as:', API_URL);

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`, { 
      headers: config.headers,
      data: config.data 
    });
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to log errors
api.interceptors.response.use(
  (response) => {
    console.log(`API Response (${response.status}):`, response.data);
    return response;
  },
  (error) => {
    console.error('API Response Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: error.config
    });
    return Promise.reject(error);
  }
);

// Auth service
export const authService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/current')
};
// Address service
export const addressService = {
  getAddresses: () => api.get('/users/addresses'),
  addAddress: (addressData) => api.post('/users/addresses', addressData),
  updateAddress: (addressId, addressData) => api.put(`/users/addresses/${addressId}`, addressData),
  deleteAddress: (addressId) => api.delete(`/users/addresses/${addressId}`),
  setDefaultAddress: (addressId) => {
    console.log(`Setting address ${addressId} as default`);
    return api.put(`/users/addresses/${addressId}`, { isDefault: true });
  }
};

// Product service
export const productService = {
  getAllProducts: () => api.get('/products'),
  getProductById: (id) => api.get(`/products/${id}`),
  createProduct: (productData) => api.post('/products', productData),
  updateProduct: (id, productData) => api.put(`/products/${id}`, productData),
  deleteProduct: (id) => api.delete(`/products/${id}`)
};

// Cart service
export const cartService = {
  getCart: () => {
    console.log('Making getCart request');
    return api.get('/cart');
  },
  addToCart: (productVariantId, quantity) => {
    // Ensure parameters are appropriate types
    const params = {
      productVariantId: Number(productVariantId) || productVariantId,
      quantity: Number(quantity) || 1
    };
    console.log('Making addToCart request with params:', params);
    return api.post('/cart/items', params);
  },
  updateCartItem: (itemId, quantity) => {
    console.log('Making updateCartItem request:', { itemId, quantity });
    return api.patch(`/cart/items/${itemId}`, { quantity });
  },
  removeFromCart: (itemId) => {
    console.log('Making removeFromCart request:', { itemId });
    return api.delete(`/cart/items/${itemId}`);
  }
};

// Wishlist service
export const wishlistService = {
  getWishlist: async () => {
    try {
      console.log('Calling getWishlist API endpoint');
      const response = await api.get('/wishlist');
      console.log('Wishlist response received:', response);
      return response;
    } catch (error) {
      console.error('Error in getWishlist service:', error);
      if (error.response) {
        console.error('Server response:', error.response.data);
        console.error('Status code:', error.response.status);
      } else if (error.request) {
        console.error('No response received from server', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      throw error;
    }
  },
  
  addToWishlist: async (productId) => {
    try {
      if (!productId) {
        console.error('Invalid product ID:', productId);
        throw new Error('Product ID is required');
      }
      
      // Ensure productId is a number
      const id = Number(productId);
      if (isNaN(id)) {
        console.error('Product ID is not a valid number:', productId);
        throw new Error('Invalid product ID format');
      }
      
      console.log(`Calling addToWishlist API endpoint for product ID: ${id}`);
      const response = await api.post('/wishlist/items', { productId: id });
      console.log('Add to wishlist response:', response);
      return response;
    } catch (error) {
      console.error(`Error in addToWishlist service for product ID ${productId}:`, error);
      if (error.response) {
        console.error('Server response:', error.response.data);
        console.error('Status code:', error.response.status);
      } else if (error.request) {
        console.error('No response received from server', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      throw error;
    }
  },
  
  removeFromWishlist: async (productId) => {
    try {
      if (!productId) {
        console.error('Invalid product ID:', productId);
        throw new Error('Product ID is required');
      }
      
      // Ensure productId is a number
      const id = Number(productId);
      if (isNaN(id)) {
        console.error('Product ID is not a valid number:', productId);
        throw new Error('Invalid product ID format');
      }
      
      console.log(`Calling removeFromWishlist API endpoint for product ID: ${id}`);
      const response = await api.delete(`/wishlist/items/${id}`);
      console.log('Remove from wishlist response:', response);
      return response;
    } catch (error) {
      console.error(`Error in removeFromWishlist service for product ID ${productId}:`, error);
      if (error.response) {
        console.error('Server response:', error.response.data);
        console.error('Status code:', error.response.status);
      } else if (error.request) {
        console.error('No response received from server', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      throw error;
    }
  }
};

// Order service
export const orderService = {
  // Create a new order
  createOrder: async (orderData) => {
    try {
      // Basic validation
      if (!orderData || !orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
        throw new Error('No items provided for order');
      }

      if (!orderData.shippingAddressId) {
        throw new Error('Shipping address is required');
      }

      // Ensure numeric values
      const formattedOrder = {
        ...orderData,
        shippingAddressId: Number(orderData.shippingAddressId),
        billingAddressId: orderData.billingAddressId ? Number(orderData.billingAddressId) : null,
        total: orderData.total ? Number(parseFloat(orderData.total).toFixed(2)) : null,
        items: orderData.items.map(item => ({
          ...item,
          productVariantId: Number(item.productVariantId),
          quantity: Number(item.quantity) || 1,
          price: item.price ? Number(parseFloat(item.price).toFixed(2)) : null
        }))
      };

      console.log('Sending order data:', JSON.stringify(formattedOrder, null, 2));
      
      const response = await api.post('/orders', formattedOrder);
      console.log('Order created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      if (error.response) {
        console.error('Server error details:', error.response.data);
        console.error('Status code:', error.response.status);
        console.error('Headers:', error.response.headers);
        throw new Error(error.response.data.message || 'Server error creating order');
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        throw new Error('No response received from server');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Request setup error:', error.message);
        throw error;
      }
    }
  },
  
  // Get a specific order by ID
  getOrder: async (orderId) => {
    return await api.get(`/orders/${orderId}`);
  },
  
  // Get all orders for the current user
  getUserOrders: async (params = {}) => {
    // Use the my-orders endpoint for better semantics
    return await api.get('/orders/my-orders', { params });
  },
  
  // Get all orders (admin only)
  getAllOrders: async () => {
    return await api.get('/orders/admin/all');
  },
  
  // Update order status (for admin use)
  updateOrderStatus: async (orderId, status) => {
    return await api.patch(`/orders/${orderId}/status`, { status });
  },
  
  // Cancel an order (if permitted)
  cancelOrder: async (orderId) => {
    return await api.post(`/orders/${orderId}/cancel`);
  },
  
  // Get order invoice
  getOrderInvoice: async (orderId) => {
    return await api.get(`/orders/${orderId}/invoice`);
  }
};

// Review service
export const reviewService = {
  // Get reviews for a product
  getProductReviews: async (productId) => {
    try {
      console.log(`Fetching reviews for product ID: ${productId}`);
      const response = await api.get(`/reviews/products/${productId}`);
      console.log('Product reviews response:', response);
      return response;
    } catch (error) {
      console.error(`Error getting reviews for product ID ${productId}:`, error);
      throw error;
    }
  },
  
  // Check if a user can review a product (has purchased it with a completed order)
  checkCanReview: async (productId) => {
    try {
      console.log(`Checking if user can review product ID: ${productId}`);
      const response = await api.get(`/reviews/check/${productId}`);
      console.log('Check can review response:', response);
      return response.data;
    } catch (error) {
      console.error(`Error checking review eligibility for product ID ${productId}:`, error);
      // Default to not being able to review if there's an error
      return { canReview: false, hasPurchased: false, hasReviewed: false };
    }
  },
  
  // Create a new review
  createReview: async (reviewData) => {
    try {
      if (!reviewData.productId || !reviewData.rating || !reviewData.comment) {
        throw new Error('Product ID, rating, and comment are required for a review');
      }
      
      // Ensure productId and rating are numbers
      const formattedReview = {
        ...reviewData,
        productId: Number(reviewData.productId),
        rating: Number(reviewData.rating)
      };
      
      console.log('Creating new review with data:', formattedReview);
      const response = await api.post('/reviews', formattedReview);
      console.log('Create review response:', response);
      return response;
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  },
  
  // Update an existing review
  updateReview: async (reviewId, reviewData) => {
    try {
      if (!reviewData.rating || !reviewData.comment) {
        throw new Error('Rating and comment are required for a review update');
      }
      
      const formattedReview = {
        rating: Number(reviewData.rating),
        comment: reviewData.comment
      };
      
      console.log(`Updating review ID ${reviewId} with data:`, formattedReview);
      const response = await api.put(`/reviews/${reviewId}`, formattedReview);
      console.log('Update review response:', response);
      return response;
    } catch (error) {
      console.error(`Error updating review ID ${reviewId}:`, error);
      throw error;
    }
  },
  
  // Delete a review
  deleteReview: async (reviewId) => {
    try {
      console.log(`Deleting review ID: ${reviewId}`);
      const response = await api.delete(`/reviews/${reviewId}`);
      console.log('Delete review response:', response);
      return response;
    } catch (error) {
      console.error(`Error deleting review ID ${reviewId}:`, error);
      throw error;
    }
  }
};

// Coupon service
export const couponService = {
  getAllCoupons: () => api.get('/coupons'),
  getCouponById: (id) => api.get(`/coupons/${id}`),
  validateCoupon: (code) => api.get(`/coupons/validate/${code}`),
  createCoupon: (couponData) => api.post('/coupons', couponData),
  updateCoupon: (id, couponData) => api.put(`/coupons/${id}`, couponData),
  deleteCoupon: (id) => api.delete(`/coupons/${id}`)
};

export default api; 