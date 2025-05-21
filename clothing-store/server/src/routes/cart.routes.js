const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart
} = require('../controllers/cart.controller');

router.use(verifyToken);

router.get('/', getCart);
router.post('/items', addToCart);
router.patch('/items/:id', updateCartItem);
router.delete('/items/:id', removeFromCart);

module.exports = router;