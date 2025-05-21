const { wishlistQueries } = require('../models/db.queries');
const db = require('../config/db');

// Helper function to ensure user has a wishlist
const getOrCreateWishlist = async (userId) => {
    // Check if user already has a wishlist
    const findQuery = 'SELECT id FROM wishlists WHERE user_id = $1';
    const { rows } = await db.query(findQuery, [userId]);
    
    if (rows.length > 0) {
        return rows[0].id;
    }
    
    // Create a new wishlist if not exists
    const createQuery = 'INSERT INTO wishlists (user_id) VALUES ($1) RETURNING id';
    const result = await db.query(createQuery, [userId]);
    return result.rows[0].id;
};

const getWishlist = async (req, res) => {
    try {
        console.log('Fetching wishlist for user:', req.user.id);
        
        // First, check if the user has a wishlist
        const findQuery = 'SELECT id FROM wishlists WHERE user_id = $1';
        const { rows: wishlistRows } = await db.query(findQuery, [req.user.id]);
        
        // If no wishlist exists, create one and return empty items
        if (wishlistRows.length === 0) {
            console.log('No wishlist found for user, creating a new one');
            const wishlistId = await getOrCreateWishlist(req.user.id);
            console.log('Created new wishlist with ID:', wishlistId);
            return res.json({ wishlist_id: wishlistId, items: [] });
        }
        
        // Use the wishlist queries to get detailed wishlist with items
        const { rows } = await wishlistQueries.getWishlist(req.user.id);
        
        // Log what was found
        if (rows.length > 0) {
            const itemCount = rows[0].items ? rows[0].items.length : 0;
            console.log(`Found wishlist with ${itemCount} items`);
        } else {
            console.log('Found wishlist but no rows returned from query');
        }
        
        // Return the wishlist or an empty structure if no items
        res.json(rows[0] || { items: [] });
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        res.status(500).json({ 
            message: 'Server error fetching wishlist', 
            error: error.message 
        });
    }
};

const addToWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        
        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }
        
        // Convert productId to number if it's a string
        const parsedProductId = typeof productId === 'string' ? parseInt(productId, 10) : productId;
        
        if (isNaN(parsedProductId)) {
            return res.status(400).json({ message: 'Invalid product ID format' });
        }
        
        console.log(`Adding product ${parsedProductId} to wishlist for user ${req.user.id}`);
        
        // Get or create user's wishlist
        const wishlistId = await getOrCreateWishlist(req.user.id);
        
        // Verify the product exists
        const productCheckQuery = 'SELECT id FROM products WHERE id = $1';
        const productResult = await db.query(productCheckQuery, [parsedProductId]);
        
        if (productResult.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        // Add item to wishlist
        const { rows } = await wishlistQueries.addToWishlist(wishlistId, parsedProductId);
        
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        if (error.constraint === 'wishlist_items_wishlist_id_product_id_key') {
            return res.status(400).json({ message: 'Item already in wishlist' });
        }
        res.status(500).json({ 
            message: 'Server error adding to wishlist', 
            error: error.message 
        });
    }
};

const removeFromWishlist = async (req, res) => {
    try {
        const productId = req.params.id;
        
        // Convert productId to number if it's a string
        const parsedProductId = typeof productId === 'string' ? parseInt(productId, 10) : productId;
        
        if (isNaN(parsedProductId)) {
            return res.status(400).json({ message: 'Invalid product ID format' });
        }
        
        console.log(`Removing product ${parsedProductId} from wishlist for user ${req.user.id}`);
        
        // Get the user's wishlist ID
        const findQuery = 'SELECT id FROM wishlists WHERE user_id = $1';
        const { rows: wishlistRows } = await db.query(findQuery, [req.user.id]);
        
        if (wishlistRows.length === 0) {
            return res.status(404).json({ message: 'Wishlist not found' });
        }
        
        const wishlistId = wishlistRows[0].id;
        
        // Find the item from the wishlist
        const findItemQuery = 'SELECT id FROM wishlist_items WHERE wishlist_id = $1 AND product_id = $2';
        const { rows: itemRows } = await db.query(findItemQuery, [wishlistId, parsedProductId]);
        
        if (itemRows.length === 0) {
            return res.status(404).json({ message: 'Item not found in wishlist' });
        }
        
        const wishlistItemId = itemRows[0].id;
        
        // Now remove the item
        const result = await wishlistQueries.removeFromWishlist(wishlistItemId);
        console.log('Item removed from wishlist, result:', result.rows[0]);
        
        res.json({ 
            message: 'Item removed from wishlist',
            removedItem: result.rows[0]
        });
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        res.status(500).json({ 
            message: 'Server error removing from wishlist', 
            error: error.message 
        });
    }
};

module.exports = {
    getWishlist,
    addToWishlist,
    removeFromWishlist
};