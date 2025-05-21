const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const {
    getWishlist,
    addToWishlist,
    removeFromWishlist
} = require('../controllers/wishlist.controller');

// Add detailed request logging middleware for debugging
router.use((req, res, next) => {
    console.log(`[WISHLIST ROUTE] ${req.method} ${req.originalUrl}`, {
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
        console.log(`[WISHLIST RESPONSE] Status: ${res.statusCode}`, 
            typeof data === 'string' && data.startsWith('{') ? JSON.parse(data) : 'Non-JSON response');
        originalSend.call(this, data);
    };
    
    next();
});

router.use(verifyToken);

router.get('/', getWishlist);
router.post('/items', addToWishlist);
router.delete('/items/:id', removeFromWishlist);

module.exports = router;