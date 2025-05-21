const express = require('express');
const router = express.Router();
const couponController = require('../controllers/coupon.controller');
const { authenticateJWT, isAdmin } = require('../middleware/auth');

// Public routes
router.get('/validate/:code', couponController.validateCoupon);

// Admin-only routes
router.get('/', authenticateJWT, isAdmin, couponController.getAllCoupons);
router.get('/:id', authenticateJWT, isAdmin, couponController.getCouponById);
router.post('/', authenticateJWT, isAdmin, couponController.createCoupon);
router.put('/:id', authenticateJWT, isAdmin, couponController.updateCoupon);
router.delete('/:id', authenticateJWT, isAdmin, couponController.deleteCoupon);

module.exports = router; 