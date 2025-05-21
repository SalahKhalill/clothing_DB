const { reviewQueries } = require('../models/db.queries');

// Create a new review
const createReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, rating, comment } = req.body;
        
        // Validate input
        if (!productId || !rating || !comment) {
            return res.status(400).json({ message: 'Product ID, rating, and comment are required' });
        }
        
        // Check if user has purchased the product
        const purchaseResult = await reviewQueries.checkUserPurchasedProduct(userId, productId);
        const hasPurchased = parseInt(purchaseResult.rows[0].purchase_count) > 0;
        
        if (!hasPurchased) {
            return res.status(403).json({ message: 'You can only review products you have purchased' });
        }
        
        // Check if user has already reviewed this product
        const existingReviews = await reviewQueries.checkUserReviewedProduct(userId, productId);
        
        if (existingReviews.rows.length > 0) {
            return res.status(400).json({ message: 'You have already reviewed this product' });
        }
        
        // Create the review
        const result = await reviewQueries.createReview({
            userId,
            productId,
            rating,
            comment
        });
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all reviews for a product
const getProductReviews = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ message: 'Product ID is required' });
        }
        
        const result = await reviewQueries.getProductReviews(id);
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting product reviews:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Check if user can review a product
const checkCanReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;
        
        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }
        
        // Check if user has purchased the product
        const purchaseResult = await reviewQueries.checkUserPurchasedProduct(userId, productId);
        const hasPurchased = parseInt(purchaseResult.rows[0].purchase_count) > 0;
        
        // Check if user has already reviewed this product
        const existingReviews = await reviewQueries.checkUserReviewedProduct(userId, productId);
        const hasReviewed = existingReviews.rows.length > 0;
        
        // User can review if they have purchased the product and haven't already reviewed it
        const canReview = hasPurchased && !hasReviewed;
        
        res.json({
            canReview,
            hasPurchased,
            hasReviewed
        });
    } catch (error) {
        console.error('Error checking if user can review:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update an existing review
const updateReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { rating, comment } = req.body;
        
        // Validate input
        if (!rating || !comment) {
            return res.status(400).json({ message: 'Rating and comment are required' });
        }
        
        // Check if the review exists and belongs to the user
        const existingReview = await reviewQueries.getReviewById(id);
        
        if (existingReview.rows.length === 0) {
            return res.status(404).json({ message: 'Review not found' });
        }
        
        if (existingReview.rows[0].user_id !== userId) {
            return res.status(403).json({ message: 'You can only update your own reviews' });
        }
        
        // Update the review
        const result = await reviewQueries.updateReview(id, userId, { rating, comment });
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating review:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete a review
const deleteReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const isAdmin = req.user.role === 'admin';
        
        // Check if the review exists
        const existingReview = await reviewQueries.getReviewById(id);
        
        if (existingReview.rows.length === 0) {
            return res.status(404).json({ message: 'Review not found' });
        }
        
        // Only the owner or an admin can delete the review
        if (existingReview.rows[0].user_id !== userId && !isAdmin) {
            return res.status(403).json({ message: 'You can only delete your own reviews' });
        }
        
        // Delete the review
        const result = await reviewQueries.deleteReview(id, existingReview.rows[0].user_id);
        
        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    createReview,
    getProductReviews,
    updateReview,
    deleteReview,
    checkCanReview
}; 