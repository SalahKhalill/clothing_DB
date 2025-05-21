const { productQueries } = require('../models/db.queries');
const db = require('../config/db');

const createProduct = async (req, res) => {
    try {
        const { name, description, category, images, variants } = req.body;

        // Validate required fields
        if (!name) {
            return res.status(400).json({ message: 'Product name is required' });
        }

        // Process images - ensure it's handled correctly whether it's a string, array, or empty
        let processedImages = '';
        if (Array.isArray(images) && images.length > 0) {
            processedImages = images;
        } else if (typeof images === 'string' && images.trim() !== '') {
            processedImages = images;
        }

        // Create product with the authenticated user's ID
        const productResult = await productQueries.createProduct({
            name, 
            description, 
            category, 
            images: processedImages,
            userId: req.user.id
        });
        const product = productResult.rows[0];

        // Validate product variants
        if (!variants || !Array.isArray(variants) || variants.length === 0) {
            return res.status(400).json({ message: 'At least one product variant is required' });
        }

        // Create product variants
        const variantPromises = variants.map(variant => {
            // Ensure price and stock are numbers
            const processedVariant = {
                ...variant,
                price: parseFloat(variant.price) || 0,
                stock: parseInt(variant.stock) || 0,
                productId: product.id
            };
            return productQueries.createProductVariant(processedVariant);
        });
        await Promise.all(variantPromises);

        const finalProduct = await productQueries.getProductById(product.id);
        res.status(201).json(finalProduct.rows[0]);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getAllProducts = async (req, res) => {
    try {
        const { rows } = await productQueries.getAllProducts();
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getProductById = async (req, res) => {
    try {
        const { rows } = await productQueries.getProductById(req.params.id);
        if (!rows.length) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const { name, description, category, images, variants } = req.body;
        
        // Validate product ID
        if (!productId || isNaN(parseInt(productId))) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }
        
        // Validate required fields
        if (!name) {
            return res.status(400).json({ message: 'Product name is required' });
        }

        console.log(`Updating product with ID: ${productId}`);

        // Check if product exists first
        const checkProduct = await productQueries.getProductById(productId);
        if (!checkProduct.rows.length) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Process images - ensure it's handled correctly whether it's a string, array, or empty
        let processedImages = '';
        if (Array.isArray(images) && images.length > 0) {
            processedImages = images;
        } else if (typeof images === 'string' && images.trim() !== '') {
            processedImages = images;
        }
        
        // Update product base info
        const productResult = await productQueries.updateProduct(productId, {
            name, description, category, images: processedImages
        });
        
        if (!productResult.rows.length) {
            return res.status(404).json({ message: 'Product not found or could not be updated' });
        }
        
        // Handle variants if provided
        if (variants && Array.isArray(variants) && variants.length > 0) {
            try {
                // Get existing variants
                const existingVariantsQuery = `
                    SELECT pv.*, 
                        (SELECT COUNT(*) FROM order_items oi WHERE oi.product_variant_id = pv.id) as order_count
                    FROM product_variants pv 
                    WHERE pv.product_id = $1
                `;
                const existingVariantsResult = await db.query(existingVariantsQuery, [productId]);
                const existingVariants = existingVariantsResult.rows;
                
                // Map existing variants by ID for quick lookup
                const existingVariantsMap = {};
                existingVariants.forEach(variant => {
                    existingVariantsMap[variant.id] = variant;
                });
                
                // Separate variants into categories
                const newVariants = [];
                const updateVariants = [];
                
                variants.forEach(variant => {
                    // Check if this is an existing variant with an ID
                    if (variant.id && existingVariantsMap[variant.id]) {
                        updateVariants.push({
                            ...variant,
                            existingData: existingVariantsMap[variant.id]
                        });
                    } else {
                        // This is a new variant
                        newVariants.push(variant);
                    }
                });
                
                console.log(`Processing ${updateVariants.length} existing variants and ${newVariants.length} new variants`);
                
                // Process updates to existing variants
                for (const variant of updateVariants) {
                    const orderCount = variant.existingData.order_count || 0;
                    const variantId = variant.id;
                    
                    // If variant has been ordered, only update stock and price, not size or color
                    if (orderCount > 0) {
                        console.log(`Variant ${variantId} is used in ${orderCount} orders - updating only safe fields`);
                        // Update only stock and price
                        const safeUpdateQuery = `
                            UPDATE product_variants
                            SET stock = $1, price = $2
                            WHERE id = $3
                        `;
                        await db.query(safeUpdateQuery, [
                            parseInt(variant.stock) || 0,
                            parseFloat(variant.price) || 0,
                            variantId
                        ]);
                    } else {
                        // Safe to update all fields
                        const fullUpdateQuery = `
                            UPDATE product_variants
                            SET stock = $1, price = $2, color = $3, size = $4
                            WHERE id = $5
                        `;
                        await db.query(fullUpdateQuery, [
                            parseInt(variant.stock) || 0,
                            parseFloat(variant.price) || 0,
                            variant.color || '',
                            variant.size || '',
                            variantId
                        ]);
                    }
                }
                
                // Insert new variants
                const variantPromises = newVariants.map(variant => {
                    // Ensure price and stock are numbers
                    const processedVariant = {
                        ...variant,
                        price: parseFloat(variant.price) || 0,
                        stock: parseInt(variant.stock) || 0,
                        productId
                    };
                    return productQueries.createProductVariant(processedVariant);
                });
                
                if (variantPromises.length > 0) {
                    await Promise.all(variantPromises);
                    console.log(`Added ${variantPromises.length} new variants`);
                }
                
                // Find variants to delete (existing variants not in the update list)
                const updateVariantIds = updateVariants.map(v => v.id);
                const variantsToDelete = existingVariants
                    .filter(v => !updateVariantIds.includes(v.id) && v.order_count == 0)
                    .map(v => v.id);
                    
                if (variantsToDelete.length > 0) {
                    const deleteVariantsQuery = `
                        DELETE FROM product_variants
                        WHERE id = ANY($1::int[])
                    `;
                    await db.query(deleteVariantsQuery, [variantsToDelete]);
                    console.log(`Deleted ${variantsToDelete.length} variants that are no longer needed`);
                }
                
                console.log(`Updated variants for product ID: ${productId}`);
            } catch (variantError) {
                console.error('Error updating product variants:', variantError);
                // Continue with returning product even if variant update fails
            }
        }
        
        // Get updated product with variants
        const finalProduct = await productQueries.getProductById(productId);
        if (!finalProduct.rows.length) {
            return res.status(500).json({ message: 'Product updated but could not be retrieved' });
        }
        
        console.log(`Successfully updated product with ID: ${productId}`);
        res.json(finalProduct.rows[0]);
    } catch (error) {
        console.error('Error updating product:', error);
        
        if (error.code === '23505') { // Unique constraint violation
            return res.status(400).json({ 
                message: 'A product with this name already exists',
                error: error.message
            });
        }
        
        res.status(500).json({ 
            message: 'Server error while updating product', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        
        // Validate product ID
        if (!productId || isNaN(parseInt(productId))) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }
        
        console.log(`Attempting to delete product with ID: ${productId}`);
        
        // Check if product exists first
        const checkProduct = await productQueries.getProductById(productId);
        if (!checkProduct.rows.length) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        // Delete the product and its related data
        const { rows } = await productQueries.deleteProduct(productId);
        
        if (!rows.length) {
            console.warn(`Product delete operation didn't return any rows for ID: ${productId}`);
            return res.status(404).json({ message: 'Product not found or could not be deleted' });
        }
        
        console.log(`Successfully deleted product with ID: ${productId}`);
        res.json({ 
            message: 'Product deleted successfully',
            product: rows[0]
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        
        // Provide more helpful error messages
        if (error.code === 'PRODUCT_IN_ORDERS') {
            return res.status(400).json({ 
                message: 'Cannot delete product that has been ordered by customers',
                details: 'This product has already been purchased. Consider updating it or marking it as inactive instead of deleting.',
                orderCount: error.details?.orderCount
            });
        } else if (error.code === '23503') { // Foreign key constraint violation
            return res.status(400).json({ 
                message: 'Cannot delete product as it is referenced by existing orders',
                error: error.message,
                details: 'This product has already been purchased by customers. Consider updating it instead of deleting.'
            });
        }
        
        res.status(500).json({ 
            message: 'Server error while deleting product', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

const getProductVariant = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ message: 'Product variant ID is required' });
        }
        
        const query = `
            SELECT pv.*, 
                   p.id as product_id, 
                   p.name as product_name,
                   p.images
            FROM product_variants pv
            JOIN products p ON pv.product_id = p.id
            WHERE pv.id = $1
        `;
        
        const result = await db.query(query, [id]);
        
        if (!result.rows || result.rows.length === 0) {
            return res.status(404).json({ message: 'Product variant not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching product variant:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getProductVariant
};