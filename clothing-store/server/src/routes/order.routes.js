const router = require('express').Router();
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const {
    createOrder,
    getUserOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
    cancelOrder,
    getOrderInvoice
} = require('../controllers/order.controller');

// Customer routes
router.post('/', verifyToken, createOrder);
router.get('/my-orders', verifyToken, getUserOrders);
router.get('/', verifyToken, getUserOrders);
router.get('/:id', verifyToken, getOrderById);
router.post('/:id/cancel', verifyToken, cancelOrder);
router.get('/:id/invoice', verifyToken, getOrderInvoice);

// Admin routes
router.get('/admin/all', verifyToken, isAdmin, getAllOrders);
router.patch('/:id/status', verifyToken, isAdmin, updateOrderStatus);

module.exports = router;