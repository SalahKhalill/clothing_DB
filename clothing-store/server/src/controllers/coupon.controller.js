const { couponQueries } = require('../models/db.queries');

const getAllCoupons = async (req, res) => {
    try {
        const result = await couponQueries.getAllCoupons();
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).json({ message: 'Failed to fetch coupons', error: error.message });
    }
};

const getCouponById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await couponQueries.getCouponById(id);
        
        if (!result.rows || result.rows.length === 0) {
            return res.status(404).json({ message: 'Coupon not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching coupon:', error);
        res.status(500).json({ message: 'Failed to fetch coupon', error: error.message });
    }
};

const validateCoupon = async (req, res) => {
    try {
        const { code } = req.params;
        const result = await couponQueries.getCouponByCode(code);
        
        if (!result.rows || result.rows.length === 0) {
            return res.status(404).json({ 
                valid: false,
                message: 'Coupon not found' 
            });
        }
        
        const coupon = result.rows[0];
        const now = new Date();
        const expirationDate = new Date(coupon.expires_at);
        
        if (now > expirationDate) {
            return res.status(400).json({ 
                valid: false,
                message: 'Coupon has expired',
                coupon
            });
        }
        
        res.json({
            valid: true,
            coupon
        });
    } catch (error) {
        console.error('Error validating coupon:', error);
        res.status(500).json({ 
            valid: false,
            message: 'Failed to validate coupon', 
            error: error.message 
        });
    }
};

const createCoupon = async (req, res) => {
    try {
        const { code, discountPercentage, expiresAt } = req.body;
        
        // Validate required fields
        if (!code) {
            return res.status(400).json({ message: 'Coupon code is required' });
        }
        
        if (!discountPercentage || discountPercentage <= 0 || discountPercentage > 100) {
            return res.status(400).json({ message: 'Discount percentage must be between 1 and 100' });
        }
        
        if (!expiresAt) {
            return res.status(400).json({ message: 'Expiration date is required' });
        }
        
        // Check if coupon code already exists
        const existingCoupon = await couponQueries.getCouponByCode(code);
        if (existingCoupon.rows && existingCoupon.rows.length > 0) {
            return res.status(400).json({ message: 'A coupon with this code already exists' });
        }
        
        const couponData = {
            code,
            discountPercentage: parseInt(discountPercentage),
            expiresAt: new Date(expiresAt)
        };
        
        const result = await couponQueries.createCoupon(couponData);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating coupon:', error);
        res.status(500).json({ message: 'Failed to create coupon', error: error.message });
    }
};

const updateCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, discountPercentage, expiresAt } = req.body;
        
        // Validate required fields
        if (!code) {
            return res.status(400).json({ message: 'Coupon code is required' });
        }
        
        if (!discountPercentage || discountPercentage <= 0 || discountPercentage > 100) {
            return res.status(400).json({ message: 'Discount percentage must be between 1 and 100' });
        }
        
        if (!expiresAt) {
            return res.status(400).json({ message: 'Expiration date is required' });
        }
        
        // Check if the coupon exists
        const existingCoupon = await couponQueries.getCouponById(id);
        if (!existingCoupon.rows || existingCoupon.rows.length === 0) {
            return res.status(404).json({ message: 'Coupon not found' });
        }
        
        // Check if updated code conflicts with another coupon
        if (code !== existingCoupon.rows[0].code) {
            const codeCheck = await couponQueries.getCouponByCode(code);
            if (codeCheck.rows && codeCheck.rows.length > 0) {
                return res.status(400).json({ message: 'A coupon with this code already exists' });
            }
        }
        
        const couponData = {
            code,
            discountPercentage: parseInt(discountPercentage),
            expiresAt: new Date(expiresAt)
        };
        
        const result = await couponQueries.updateCoupon(id, couponData);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating coupon:', error);
        res.status(500).json({ message: 'Failed to update coupon', error: error.message });
    }
};

const deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if the coupon exists
        const existingCoupon = await couponQueries.getCouponById(id);
        if (!existingCoupon.rows || existingCoupon.rows.length === 0) {
            return res.status(404).json({ message: 'Coupon not found' });
        }
        
        const result = await couponQueries.deleteCoupon(id);
        res.json({ message: 'Coupon deleted successfully', coupon: result.rows[0] });
    } catch (error) {
        console.error('Error deleting coupon:', error);
        res.status(500).json({ message: 'Failed to delete coupon', error: error.message });
    }
};

module.exports = {
    getAllCoupons,
    getCouponById,
    validateCoupon,
    createCoupon,
    updateCoupon,
    deleteCoupon
}; 