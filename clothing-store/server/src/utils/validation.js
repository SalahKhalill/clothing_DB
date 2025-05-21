const { body, validationResult } = require('express-validator');

const validateProduct = [
    body('name').notEmpty().withMessage('Product name is required'),
    body('description').notEmpty().withMessage('Product description is required'),
    body('price').isNumeric().withMessage('Price must be a number'),
    body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    body('color').notEmpty().withMessage('Color is required'),
    body('size').notEmpty().withMessage('Size is required'),
];

const validateUser = [
    body('first_name').notEmpty().withMessage('First name is required'),
    body('last_name').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Email must be valid'),
    body('phone_number').notEmpty().withMessage('Phone number is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

const validateOrder = [
    body('shipping_address_id').notEmpty().withMessage('Shipping address is required'),
    body('cart_items').isArray().withMessage('Cart items must be an array'),
];

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

module.exports = {
    validateProduct,
    validateUser,
    validateOrder,
    validate,
};