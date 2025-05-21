const router = require('express').Router();
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const {
    createReview,
    getProductReviews,
    updateReview,
    deleteReview,
    checkCanReview
} = require('../controllers/review.controller');

// Add detailed request logging middleware for debugging
router.use((req, res, next) => {
    console.log(`[REVIEW ROUTE] ${req.method} ${req.originalUrl}`, {
        params: req.params,
        query: req.query,
        body: req.body,
        headers: {
            authorization: req.headers.authorization ? 'Bearer [TOKEN]' : 'None',
            'content-type': req.headers['content-type']
        }
    });
    
    // Use response interceptor to log responses
    const originalSend = res.send;
    res.send = function(data) {
        console.log(`[REVIEW RESPONSE] Status: ${res.statusCode}`, 
            typeof data === 'string' && data.startsWith('{') ? JSON.parse(data) : 'Non-JSON response');
        originalSend.call(this, data);
    };
    
    next();
});

// Public route to get product reviews
router.get('/products/:id', getProductReviews);

// Protected routes - require authentication
router.use(verifyToken);

// Create a new review
router.post('/', createReview);

// Check if user can review a product
router.get('/check/:productId', checkCanReview);

// Update a review
router.put('/:id', updateReview);

// Delete a review
router.delete('/:id', deleteReview);

module.exports = router; 