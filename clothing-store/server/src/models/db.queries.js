const db = require('../config/db');

const productQueries = {
    createProduct: async (productData) => {
        const query = `
            INSERT INTO products (name, description, category, images, user_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const values = [
            productData.name, 
            productData.description, 
            productData.category, 
            productData.images,
            productData.userId
        ];
        return db.query(query, values);
    },

    createProductVariant: async (variantData) => {
        const query = `
            INSERT INTO product_variants (product_id, price, stock, color, size)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const values = [
            variantData.productId,
            variantData.price,
            variantData.stock,
            variantData.color,
            variantData.size
        ];
        return db.query(query, values);
    },

    getAllProducts: async () => {
        const query = `
            SELECT p.*, 
                   json_agg(
                       json_build_object(
                           'id', pv.id,
                           'price', pv.price,
                           'stock', pv.stock,
                           'color', pv.color,
                           'size', pv.size
                       )
                   ) as variants
            FROM products p
            LEFT JOIN product_variants pv ON p.id = pv.product_id
            GROUP BY p.id;
        `;
        return db.query(query);
    },

    getProductById: async (id) => {
        const query = `
            SELECT p.*, 
                   json_agg(
                       json_build_object(
                           'id', pv.id,
                           'price', pv.price,
                           'stock', pv.stock,
                           'color', pv.color,
                           'size', pv.size
                       )
                   ) as variants
            FROM products p
            LEFT JOIN product_variants pv ON p.id = pv.product_id
            WHERE p.id = $1
            GROUP BY p.id;
        `;
        return db.query(query, [id]);
    },

    updateProduct: async (id, productData) => {
        const query = `
            UPDATE products 
            SET name = $1, description = $2, category = $3, images = $4
            WHERE id = $5
            RETURNING *;
        `;
        const values = [
            productData.name,
            productData.description,
            productData.category,
            productData.images,
            id
        ];
        return db.query(query, values);
    },

    deleteProduct: async (id) => {
        // First, check if this product's variants are used in any orders
        const checkOrderItemsQuery = `
            SELECT COUNT(*) as order_count 
            FROM order_items oi
            JOIN product_variants pv ON oi.product_variant_id = pv.id
            WHERE pv.product_id = $1
        `;
        const orderCheck = await db.query(checkOrderItemsQuery, [id]);
        const orderCount = parseInt(orderCheck.rows[0].order_count);
        
        if (orderCount > 0) {
            // This product has been ordered, so we should throw an error
            const error = new Error('Cannot delete product that has been ordered by customers');
            error.code = 'PRODUCT_IN_ORDERS';
            error.details = { productId: id, orderCount };
            throw error;
        }
    
        // First, delete items in the cart that reference this product's variants
        const deleteCartItemsQuery = `
            DELETE FROM cart_items 
            WHERE product_variant_id IN (
                SELECT id FROM product_variants WHERE product_id = $1
            )
        `;
        await db.query(deleteCartItemsQuery, [id]);
        
        // Next, delete items in the wishlists that reference this product
        const deleteWishlistItemsQuery = `
            DELETE FROM wishlist_items 
            WHERE product_id = $1
        `;
        await db.query(deleteWishlistItemsQuery, [id]);
        
        // Now it's safe to delete the product variants
        const deleteVariantsQuery = 'DELETE FROM product_variants WHERE product_id = $1';
        await db.query(deleteVariantsQuery, [id]);
        
        // Finally, delete the product itself
        const query = 'DELETE FROM products WHERE id = $1 RETURNING *';
        return db.query(query, [id]);
    },

    deleteProductVariants: async (productId) => {
        // First, identify variants that have been ordered
        const checkOrderItemsQuery = `
            SELECT DISTINCT product_variant_id 
            FROM order_items 
            WHERE product_variant_id IN (
                SELECT id FROM product_variants WHERE product_id = $1
            )
        `;
        const orderCheckResult = await db.query(checkOrderItemsQuery, [productId]);
        const orderedVariantIds = orderCheckResult.rows.map(row => row.product_variant_id);
        
        if (orderedVariantIds.length > 0) {
            console.log(`Found ${orderedVariantIds.length} variants that have been ordered and cannot be deleted`);
            
            // Delete only variants that haven't been ordered
            const safeDeleteQuery = `
                DELETE FROM product_variants 
                WHERE product_id = $1 
                AND id NOT IN (${orderedVariantIds.join(',')})
            `;
            return db.query(safeDeleteQuery);
        } else {
            // Safe to delete all variants
            const query = 'DELETE FROM product_variants WHERE product_id = $1';
            return db.query(query, [productId]);
        }
    }
};

const userQueries = {
    createUser: async (userData) => {
        const query = `
            INSERT INTO users (first_name, last_name, email, phone_number, password, role)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, first_name, last_name, email, role;
        `;
        const values = [
            userData.firstName,
            userData.lastName,
            userData.email,
            userData.phoneNumber,
            userData.password,
            userData.role || 'customer'
        ];
        return db.query(query, values);
    },

    getUserByEmail: async (email) => {
        const query = 'SELECT * FROM users WHERE email = $1';
        return db.query(query, [email]);
    },

    getUserById: async (id) => {
        const query = 'SELECT id, first_name, last_name, email, phone_number, role FROM users WHERE id = $1';
        return db.query(query, [id]);
    },

    updateUser: async (userId, userData) => {
        const query = `
            UPDATE users 
            SET first_name = $1, last_name = $2, phone_number = $3
            WHERE id = $4
            RETURNING id, first_name, last_name, email, phone_number, role;
        `;
        const values = [
            userData.firstName,
            userData.lastName,
            userData.phoneNumber,
            userId
        ];
        return db.query(query, values);
    },

    getUserAddresses: async (userId) => {
        const query = `
            SELECT * FROM addresses
            WHERE user_id = $1
            ORDER BY is_default DESC, created_at DESC;
        `;
        return db.query(query, [userId]);
    },

    updateUserAddress: async (addressId, addressData) => {
        // If setting as default, first update all other addresses to not be default
        if (addressData.isDefault) {
            const resetDefaultsQuery = `
                UPDATE addresses 
                SET is_default = false
                WHERE user_id = (SELECT user_id FROM addresses WHERE id = $1);
            `;
            await db.query(resetDefaultsQuery, [addressId]);
        }

        const query = `
            UPDATE addresses 
            SET street = $1, city = $2, state = $3, country = $4, postal_code = $5, is_default = $6
            WHERE id = $7
            RETURNING *;
        `;
        const values = [
            addressData.street,
            addressData.city,
            addressData.state,
            addressData.country,
            addressData.postalCode,
            addressData.isDefault || false,
            addressId
        ];
        return db.query(query, values);
    },

    deleteUserAddress: async (addressId) => {
        const query = 'DELETE FROM addresses WHERE id = $1 RETURNING *;';
        return db.query(query, [addressId]);
    },

    addUserAddress: async (userId, addressData) => {
        // If adding as default, first update all other addresses to not be default
        if (addressData.isDefault) {
            const resetDefaultsQuery = `
                UPDATE addresses 
                SET is_default = false
                WHERE user_id = $1;
            `;
            await db.query(resetDefaultsQuery, [userId]);
        }

        const query = `
            INSERT INTO addresses (
                user_id, street, city, state, country, 
                postal_code, is_default
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;
        const values = [
            userId,
            addressData.street,
            addressData.city,
            addressData.state,
            addressData.country,
            addressData.postalCode,
            addressData.isDefault || false
        ];
        return db.query(query, values);
    }
};

const orderQueries = {
    createOrder: async (orderData) => {
        const query = `
            INSERT INTO orders (user_id, status, total, shipping_address_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const values = [
            orderData.userId,
            'pending',
            orderData.total,
            orderData.shippingAddressId
        ];
        return db.query(query, values);
    },

    createOrderItems: async (orderItem) => {
        const query = `
            INSERT INTO order_items (order_id, product_variant_id, quantity, price)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const values = [
            orderItem.orderId,
            orderItem.productVariantId,
            orderItem.quantity,
            orderItem.price
        ];
        return db.query(query, values);
    },

    createInvoice: async (invoiceData) => {
        const query = `
            INSERT INTO invoices (order_id, amount, billing_address_id)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const values = [
            invoiceData.orderId,
            invoiceData.amount,
            invoiceData.billingAddressId
        ];
        return db.query(query, values);
    },

    getUserOrders: async (userId) => {
        const query = `
            SELECT o.*,
                  (SELECT json_agg(
                      json_build_object(
                          'id', oi.id,
                          'product_variant_id', oi.product_variant_id,
                          'quantity', oi.quantity,
                          'price', oi.price,
                          'product_variant', (
                              SELECT json_build_object(
                                  'id', pv.id,
                                  'color', pv.color,
                                  'size', pv.size,
                                  'price', pv.price,
                                  'product', (
                                      SELECT json_build_object(
                                          'id', p.id,
                                          'name', p.name,
                                          'images', p.images
                                      )
                                      FROM products p
                                      WHERE p.id = pv.product_id
                                  )
                              )
                              FROM product_variants pv
                              WHERE pv.id = oi.product_variant_id
                          )
                      )
                  ) FROM order_items oi WHERE oi.order_id = o.id) as items,
                  (SELECT json_build_object(
                      'id', a.id,
                      'street', a.street,
                      'city', a.city,
                      'state', a.state,
                      'country', a.country,
                      'postal_code', a.postal_code
                  ) FROM addresses a WHERE a.id = o.shipping_address_id) as shipping_address
            FROM orders o
            WHERE o.user_id = $1
            ORDER BY o.created_at DESC
        `;
        return db.query(query, [userId]);
    },

    getOrderById: async (orderId, userId) => {
        const query = `
            SELECT o.*,
                  (SELECT json_agg(
                      json_build_object(
                          'id', oi.id,
                          'product_variant_id', oi.product_variant_id,
                          'quantity', oi.quantity,
                          'price', oi.price,
                          'product_variant', (
                              SELECT json_build_object(
                                  'id', pv.id,
                                  'color', pv.color,
                                  'size', pv.size,
                                  'price', pv.price,
                                  'product', (
                                      SELECT json_build_object(
                                          'id', p.id,
                                          'name', p.name,
                                          'images', p.images
                                      )
                                      FROM products p
                                      WHERE p.id = pv.product_id
                                  )
                              )
                              FROM product_variants pv
                              WHERE pv.id = oi.product_variant_id
                          )
                      )
                  ) FROM order_items oi WHERE oi.order_id = o.id) as items,
                  (SELECT json_build_object(
                      'id', a.id,
                      'street', a.street,
                      'city', a.city,
                      'state', a.state,
                      'country', a.country,
                      'postal_code', a.postal_code
                  ) FROM addresses a WHERE a.id = o.shipping_address_id) as shipping_address
            FROM orders o
            WHERE o.id = $1 AND o.user_id = $2
        `;
        return db.query(query, [orderId, userId]);
    },

    getAllOrders: async () => {
        const query = `
            SELECT o.*,
                  u.first_name, u.last_name, u.email,
                  (SELECT json_agg(
                      json_build_object(
                          'id', oi.id,
                          'product_variant_id', oi.product_variant_id,
                          'quantity', oi.quantity,
                          'price', oi.price
                      )
                  ) FROM order_items oi WHERE oi.order_id = o.id) as items
            FROM orders o
            JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
        `;
        return db.query(query);
    },

    updateOrderStatus: async (orderId, status) => {
        const query = `
            UPDATE orders
            SET status = $1
            WHERE id = $2
            RETURNING *
        `;
        return db.query(query, [status, orderId]);
    }
};

const cartQueries = {
    getCart: async (userId) => {
        const query = `
            WITH user_cart AS (
                SELECT c.id as cart_id
                FROM carts c
                WHERE c.user_id = $1
            )
            SELECT 
                uc.cart_id,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', ci.id,
                            'quantity', ci.quantity,
                            'product_variant', (
                                SELECT json_build_object(
                                    'id', pv.id,
                                    'price', pv.price,
                                    'stock', pv.stock,
                                    'color', pv.color,
                                    'size', pv.size,
                                    'product', (
                                        SELECT json_build_object(
                                            'id', p.id,
                                            'name', p.name,
                                            'category', p.category,
                                            'images', p.images
                                        )
                                        FROM products p
                                        WHERE p.id = pv.product_id
                                    )
                                )
                                FROM product_variants pv
                                WHERE pv.id = ci.product_variant_id
                            )
                        )
                    ) FILTER (WHERE ci.id IS NOT NULL),
                    '[]'::json
                ) as items
            FROM user_cart uc
            LEFT JOIN cart_items ci ON uc.cart_id = ci.cart_id
            GROUP BY uc.cart_id;
        `;
        return db.query(query, [userId]);
    },

    createCart: async (userId) => {
        const query = `
            INSERT INTO carts (user_id)
            VALUES ($1)
            RETURNING id;
        `;
        return db.query(query, [userId]);
    },

    addCartItem: async (cartId, productVariantId, quantity) => {
        // Check if item already exists in cart
        const checkQuery = `
            SELECT id, quantity FROM cart_items
            WHERE cart_id = $1 AND product_variant_id = $2;
        `;
        const { rows } = await db.query(checkQuery, [cartId, productVariantId]);
        
        if (rows.length > 0) {
            // Update existing item
            const updateQuery = `
                UPDATE cart_items
                SET quantity = quantity + $1
                WHERE id = $2
                RETURNING *;
            `;
            return db.query(updateQuery, [quantity, rows[0].id]);
        } else {
            // Insert new item
            const insertQuery = `
                INSERT INTO cart_items (cart_id, product_variant_id, quantity)
                VALUES ($1, $2, $3)
                RETURNING *;
            `;
            return db.query(insertQuery, [cartId, productVariantId, quantity]);
        }
    },

    updateCartItem: async (itemId, quantity) => {
        const query = `
            UPDATE cart_items
            SET quantity = $1
            WHERE id = $2
            RETURNING *;
        `;
        return db.query(query, [quantity, itemId]);
    },

    removeCartItem: async (itemId) => {
        const query = `
            DELETE FROM cart_items
            WHERE id = $1
            RETURNING *;
        `;
        return db.query(query, [itemId]);
    },

    clearCart: async (cartId) => {
        const query = `
            DELETE FROM cart_items
            WHERE cart_id = $1;
        `;
        return db.query(query, [cartId]);
    }
};

const wishlistQueries = {
    getWishlist: async (userId) => {
        const query = `
            SELECT w.id as wishlist_id,
                json_agg(
                    json_build_object(
                        'id', wi.id,
                        'product', (
                            SELECT json_build_object(
                                'id', p.id,
                                'name', p.name,
                                'category', p.category,
                                'images', p.images,
                                'variants', (
                                    SELECT json_agg(
                                        json_build_object(
                                            'id', pv.id,
                                            'price', pv.price,
                                            'color', pv.color,
                                            'size', pv.size,
                                            'stock', pv.stock
                                        )
                                    )
                                    FROM product_variants pv
                                    WHERE pv.product_id = p.id
                                )
                            )
                            FROM products p
                            WHERE p.id = wi.product_id
                        )
                    )
                ) FILTER (WHERE wi.id IS NOT NULL) as items
            FROM wishlists w
            LEFT JOIN wishlist_items wi ON w.id = wi.wishlist_id
            WHERE w.user_id = $1
            GROUP BY w.id;
        `;
        return db.query(query, [userId]);
    },

    createWishlist: async (userId) => {
        const query = `
            INSERT INTO wishlists (user_id)
            VALUES ($1)
            RETURNING id;
        `;
        return db.query(query, [userId]);
    },

    addToWishlist: async (wishlistId, productId) => {
        const query = `
            INSERT INTO wishlist_items (wishlist_id, product_id)
            VALUES ($1, $2)
            RETURNING *;
        `;
        return db.query(query, [wishlistId, productId]);
    },

    removeFromWishlist: async (wishlistItemId) => {
        const query = `
            DELETE FROM wishlist_items
            WHERE id = $1
            RETURNING *;
        `;
        return db.query(query, [wishlistItemId]);
    }
};

const reviewQueries = {
    // Create a new review
    createReview: async (reviewData) => {
        const query = `
            INSERT INTO reviews (user_id, product_id, rating, comment)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const values = [
            reviewData.userId,
            reviewData.productId,
            reviewData.rating,
            reviewData.comment
        ];
        return db.query(query, values);
    },

    // Get reviews for a product
    getProductReviews: async (productId) => {
        const query = `
            SELECT r.*, 
                   json_build_object(
                       'id', u.id,
                       'first_name', u.first_name,
                       'last_name', u.last_name
                   ) as user
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.product_id = $1
            ORDER BY r.created_at DESC;
        `;
        return db.query(query, [productId]);
    },

    // Check if a user has purchased a product and the order is completed
    checkUserPurchasedProduct: async (userId, productId) => {
        const query = `
            SELECT COUNT(*) as purchase_count
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN product_variants pv ON oi.product_variant_id = pv.id
            WHERE o.user_id = $1 
              AND pv.product_id = $2
              AND o.status = 'completed';
        `;
        return db.query(query, [userId, productId]);
    },

    // Check if a user has already reviewed a product
    checkUserReviewedProduct: async (userId, productId) => {
        const query = `
            SELECT * FROM reviews
            WHERE user_id = $1 AND product_id = $2;
        `;
        return db.query(query, [userId, productId]);
    },

    // Update an existing review
    updateReview: async (reviewId, userId, reviewData) => {
        const query = `
            UPDATE reviews
            SET rating = $1, comment = $2
            WHERE id = $3 AND user_id = $4
            RETURNING *;
        `;
        const values = [
            reviewData.rating,
            reviewData.comment,
            reviewId,
            userId
        ];
        return db.query(query, values);
    },

    // Delete a review
    deleteReview: async (reviewId, userId) => {
        const query = `
            DELETE FROM reviews
            WHERE id = $1 AND user_id = $2
            RETURNING *;
        `;
        return db.query(query, [reviewId, userId]);
    },

    // Get a specific review
    getReviewById: async (reviewId) => {
        const query = `
            SELECT r.*, 
                   json_build_object(
                       'id', u.id,
                       'first_name', u.first_name,
                       'last_name', u.last_name
                   ) as user
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.id = $1;
        `;
        return db.query(query, [reviewId]);
    }
};

const couponQueries = {
    getAllCoupons: async () => {
        const query = `
            SELECT * FROM coupons
            ORDER BY created_at DESC;
        `;
        return db.query(query);
    },

    getCouponByCode: async (code) => {
        const query = `
            SELECT * FROM coupons
            WHERE code = $1;
        `;
        return db.query(query, [code]);
    },

    getCouponById: async (id) => {
        const query = `
            SELECT * FROM coupons
            WHERE id = $1;
        `;
        return db.query(query, [id]);
    },

    createCoupon: async (couponData) => {
        const query = `
            INSERT INTO coupons (code, discount_percentage, expires_at)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const values = [
            couponData.code,
            couponData.discountPercentage,
            couponData.expiresAt
        ];
        return db.query(query, values);
    },

    updateCoupon: async (id, couponData) => {
        const query = `
            UPDATE coupons
            SET code = $1, discount_percentage = $2, expires_at = $3
            WHERE id = $4
            RETURNING *;
        `;
        const values = [
            couponData.code,
            couponData.discountPercentage,
            couponData.expiresAt,
            id
        ];
        return db.query(query, values);
    },

    deleteCoupon: async (id) => {
        const query = `
            DELETE FROM coupons
            WHERE id = $1
            RETURNING *;
        `;
        return db.query(query, [id]);
    }
};

module.exports = {
    productQueries,
    userQueries,
    orderQueries,
    cartQueries,
    wishlistQueries,
    reviewQueries,
    couponQueries
};