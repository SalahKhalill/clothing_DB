const { cartQueries } = require('../models/db.queries');
const db = require('../config/db');

// Helper function to ensure a user has a cart
const getOrCreateCart = async (userId) => {
    console.log('Getting or creating cart for user:', userId);
    
    // First check if the user already has a cart
    try {
        const cartResult = await cartQueries.getCart(userId);
        console.log('Cart lookup result:', cartResult.rows);
        
        if (cartResult.rows && cartResult.rows.length > 0) {
            const cartId = cartResult.rows[0].cart_id;
            console.log('Found existing cart with ID:', cartId);
            return cartId;
        }
    } catch (error) {
        console.error('Error checking for existing cart:', error);
        // Continue to cart creation if lookup fails
    }
    
    // Create a new cart if we didn't find one
    try {
        console.log('Creating new cart for user:', userId);
        const createCartQuery = 'INSERT INTO carts (user_id) VALUES ($1) RETURNING id';
        const result = await db.query(createCartQuery, [userId]);
        const cartId = result.rows[0].id;
        console.log('Created new cart with ID:', cartId);
        return cartId;
    } catch (error) {
        console.error('Error creating cart:', error);
        throw error;
    }
};

const getCart = async (req, res) => {
    try {
        const { rows } = await cartQueries.getCart(req.user.id);
        res.json(rows[0] || { items: [] });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const addToCart = async (req, res) => {
    try {
        console.log('Add to cart request body:', req.body);
        console.log('User from token:', req.user);
        
        const { productVariantId, quantity } = req.body;
        const requestedQuantity = parseInt(quantity) || 1;
        
        if (!productVariantId) {
            return res.status(400).json({ message: 'Missing productVariantId in request' });
        }
        
        // Check if product variant exists and has enough stock
        const checkVariantQuery = 'SELECT id, stock FROM product_variants WHERE id = $1';
        const variantResult = await db.query(checkVariantQuery, [productVariantId]);
        
        if (!variantResult.rows || variantResult.rows.length === 0) {
            return res.status(404).json({ message: 'Product variant not found' });
        }
        
        const variant = variantResult.rows[0];
        
        // Check if there's enough stock
        if (variant.stock < requestedQuantity) {
            return res.status(400).json({ 
                message: 'Not enough stock available', 
                available: variant.stock,
                requested: requestedQuantity
            });
        }
        
        // Check if the item is already in the cart
        const cartId = await getOrCreateCart(req.user.id);
        const existingItemQuery = 'SELECT * FROM cart_items WHERE cart_id = $1 AND product_variant_id = $2';
        const existingItemResult = await db.query(existingItemQuery, [cartId, productVariantId]);
        
        if (existingItemResult.rows && existingItemResult.rows.length > 0) {
            const existingItem = existingItemResult.rows[0];
            const newTotalQuantity = existingItem.quantity + requestedQuantity;
            
            // Validate total quantity against available stock
            if (newTotalQuantity > variant.stock) {
                return res.status(400).json({ 
                    message: 'Cannot add more of this item to cart (exceeds available stock)', 
                    available: variant.stock,
                    inCart: existingItem.quantity,
                    requested: requestedQuantity,
                    totalRequested: newTotalQuantity
                });
            }
            
            // Update existing cart item quantity
            const updateQuery = 'UPDATE cart_items SET quantity = $1 WHERE id = $2 RETURNING *';
            const { rows } = await db.query(updateQuery, [newTotalQuantity, existingItem.id]);
            console.log('Updated cart item quantity:', rows[0]);
            return res.json(rows[0]);
        }
        
        // Now add the item to the cart
        console.log('Adding item to cart:', { cartId, productVariantId, quantity: requestedQuantity });
        const { rows } = await cartQueries.addCartItem(cartId, productVariantId, requestedQuantity);
        console.log('Item added to cart:', rows[0]);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateCartItem = async (req, res) => {
    try {
        const { quantity } = req.body;
        const { rows } = await cartQueries.updateCartItem(req.params.id, quantity);
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const removeFromCart = async (req, res) => {
    try {
        await cartQueries.removeCartItem(req.params.id);
        res.json({ message: 'Item removed from cart' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart
};