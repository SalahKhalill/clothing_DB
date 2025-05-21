const router = require('express').Router();
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getProductVariant
} = require('../controllers/product.controller');

// Public routes
router.get('/', getAllProducts);
router.get('/variants/:id', getProductVariant);
router.get('/:id', getProductById);

// Admin routes
router.post('/', verifyToken, isAdmin, createProduct);
router.put('/:id', verifyToken, isAdmin, updateProduct);
router.delete('/:id', verifyToken, isAdmin, deleteProduct);

module.exports = router;