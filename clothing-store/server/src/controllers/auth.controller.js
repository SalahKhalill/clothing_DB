const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { userQueries, cartQueries, wishlistQueries } = require('../models/db.queries');
const config = require('../config/config');

const register = async (req, res) => {
    try {
        const { firstName, lastName, email, phoneNumber, password } = req.body;

        // Check if user exists
        const { rows } = await userQueries.getUserByEmail(email);
        if (rows.length) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const result = await userQueries.createUser({
            firstName,
            lastName,
            email,
            phoneNumber,
            password: hashedPassword
        });

        const user = result.rows[0];
        
        // Create cart for the user
        const cartResult = await cartQueries.createCart(user.id);
        const cartId = cartResult.rows[0].id;
        
        // Create wishlist for the user
        const wishlistResult = await wishlistQueries.createWishlist(user.id);
        const wishlistId = wishlistResult.rows[0].id;
        
        // Include cart and wishlist IDs in the token
        const token = jwt.sign({ 
            id: user.id, 
            role: user.role,
            cartId: cartId,
            wishlistId: wishlistId
        }, config.JWT_SECRET);

        res.status(201).json({
            token,
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const { rows } = await userQueries.getUserByEmail(email);
        if (!rows.length) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = rows[0];
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Get user's cart and wishlist
        let cartId = null;
        let wishlistId = null;
        
        try {
            // Get or create cart
            const cartResult = await cartQueries.getCart(user.id);
            console.log('Cart lookup result:', cartResult.rows);
            
            if (cartResult.rows && cartResult.rows.length > 0) {
                cartId = cartResult.rows[0].cart_id;
                console.log('Found existing cart ID:', cartId);
            } else {
                // Create a cart if one doesn't exist
                console.log('Creating new cart for user:', user.id);
                const newCartResult = await cartQueries.createCart(user.id);
                cartId = newCartResult.rows[0].id;
                console.log('Created new cart with ID:', cartId);
            }
            
            // Get or create wishlist
            const wishlistResult = await wishlistQueries.getWishlist(user.id);
            console.log('Wishlist lookup result:', wishlistResult.rows);
            
            if (wishlistResult.rows && wishlistResult.rows.length > 0) {
                wishlistId = wishlistResult.rows[0].wishlist_id;
                console.log('Found existing wishlist ID:', wishlistId);
            } else {
                // Create a wishlist if one doesn't exist
                console.log('Creating new wishlist for user:', user.id);
                const newWishlistResult = await wishlistQueries.createWishlist(user.id);
                wishlistId = newWishlistResult.rows[0].id;
                console.log('Created new wishlist with ID:', wishlistId);
            }
        } catch (error) {
            console.error('Error getting/creating cart/wishlist:', error);
            // Continue even if there's an issue getting cart/wishlist
        }

        // Include cart and wishlist IDs in the token
        const tokenPayload = { 
            id: user.id, 
            role: user.role
        };
        
        if (cartId) tokenPayload.cartId = cartId;
        if (wishlistId) tokenPayload.wishlistId = wishlistId;
        
        console.log('Creating token with payload:', tokenPayload);
        const token = jwt.sign(tokenPayload, config.JWT_SECRET);

        res.json({
            token,
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getCurrentUser = async (req, res) => {
    try {
        const { rows } = await userQueries.getUserById(req.user.id);
        if (!rows.length) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = rows[0];
        res.json({
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            role: user.role
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    register,
    login,
    getCurrentUser
};