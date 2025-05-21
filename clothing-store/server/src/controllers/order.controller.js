const { orderQueries, cartQueries, couponQueries } = require('../models/db.queries');
const db = require('../config/db');

const createOrder = async (req, res) => {
    try {
        const { items, shippingAddressId, billingAddressId, total, paymentMethod, couponCode } = req.body;
        const userId = req.user.id;

        console.log('Creating order with data:', { 
            userId, 
            total, 
            shippingAddressId, 
            items: items?.length || 0, 
            paymentMethod,
            couponCode 
        });

        // Validate required data
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'No items in order' });
        }

        if (!shippingAddressId) {
            return res.status(400).json({ message: 'Shipping address is required' });
        }

        // Validate shipping address exists
        try {
            const addressQuery = 'SELECT * FROM addresses WHERE id = $1 AND user_id = $2';
            const addressResult = await db.query(addressQuery, [shippingAddressId, userId]);
            
            if (!addressResult.rows || addressResult.rows.length === 0) {
                return res.status(400).json({ message: 'Invalid shipping address' });
            }
        } catch (error) {
            console.error('Error validating shipping address:', error);
            return res.status(500).json({ message: 'Error validating shipping address', error: error.message });
        }

        let subtotal = 0;
        try {
            subtotal = items.reduce((sum, item) => {
                const price = parseFloat(item.price) || 0;
                const quantity = parseInt(item.quantity) || 1;
                return sum + (price * quantity);
            }, 0);

            subtotal = isNaN(subtotal) ? 0 : Number(subtotal.toFixed(2));
        } catch (error) {
            console.error('Error calculating subtotal:', error);
            subtotal = 0;
        }

        let discountAmount = 0;
        let finalTotal = subtotal;
        let appliedCoupon = null;

        if (couponCode) {
            try {
                const couponResult = await couponQueries.getCouponByCode(couponCode);
                
                if (couponResult.rows && couponResult.rows.length > 0) {
                    const coupon = couponResult.rows[0];
                    const now = new Date();
                    const expirationDate = new Date(coupon.expires_at);
                    
                    // Check if coupon is valid
                    if (now <= expirationDate) {
                        // Calculate discount amount
                        discountAmount = subtotal * (coupon.discount_percentage / 100);
                        discountAmount = Number(discountAmount.toFixed(2));
                        
                        // Apply discount to total
                        finalTotal = subtotal - discountAmount;
                        finalTotal = Number(finalTotal.toFixed(2));
                        
                        appliedCoupon = coupon;
                        console.log(`Applied coupon ${couponCode}: ${coupon.discount_percentage}% off, saved $${discountAmount}`);
                    } else {
                        console.log(`Coupon ${couponCode} has expired`);
                    }
                } else {
                    console.log(`Coupon ${couponCode} not found`);
                }
            } catch (error) {
                console.error('Error applying coupon:', error);
            }
        }

        const shippingCost = finalTotal >= 50 ? 0 : 5.99;
        finalTotal += shippingCost;
        finalTotal = Number(finalTotal.toFixed(2));

        let orderTotal = parseFloat(total) || finalTotal;
        orderTotal = Number(orderTotal.toFixed(2));

        console.log('Order summary:');
        console.log(`- Subtotal: $${subtotal}`);
        console.log(`- Discount: $${discountAmount} (Coupon: ${couponCode || 'none'})`);
        console.log(`- Shipping: $${shippingCost}`);
        console.log(`- Total: $${orderTotal}`);

        let order;
        // Create order
        try {
            const orderResult = await db.query(`
                INSERT INTO orders (
                    user_id, 
                    status, 
                    total,
                    shipping_address_id,
                    coupon_code,
                    discount_amount
                )
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *;
            `, [
                userId,
                'pending',
                orderTotal,
                shippingAddressId,
                appliedCoupon ? appliedCoupon.code : null,
                discountAmount
            ]);
            
            order = orderResult.rows[0];
            console.log('Order created:', order);
        } catch (error) {
            console.error('Error creating order in database:', error);
            return res.status(500).json({ 
                message: 'Error creating order in database', 
                error: error.message,
                details: { userId, shippingAddressId, orderTotal, subtotal }
            });
        }

        // Process order items
        try {
            const orderItemsPromises = items.map(async item => {
                if (!item.productVariantId) {
                    console.error('Missing productVariantId for item:', item);
                    return null;
                }

                let price = parseFloat(item.price) || 0;
                
                if (!price) {
                    try {
                        const variantQuery = 'SELECT price FROM product_variants WHERE id = $1';
                        const variantResult = await db.query(variantQuery, [item.productVariantId]);
                        
                        if (variantResult.rows && variantResult.rows.length > 0) {
                            price = parseFloat(variantResult.rows[0].price) || 0;
                        } else {
                            console.warn(`Product variant ${item.productVariantId} not found, using price 0`);
                        }
                    } catch (error) {
                        console.error('Error fetching product variant price:', error);
                    }
                }
                
                return orderQueries.createOrderItems({
                    orderId: order.id,
                    productVariantId: Number(item.productVariantId),
                    quantity: parseInt(item.quantity) || 1,
                    price: price
                });
            });
            
            const validOrderItemsPromises = orderItemsPromises.filter(promise => promise !== null);
            
            if (validOrderItemsPromises.length === 0) {
                return res.status(400).json({ message: 'No valid order items provided' });
            }

            const orderItemResults = await Promise.all(validOrderItemsPromises);
            console.log(`Created ${orderItemResults.length} order items`);

            try {
                console.log('Updating stock quantities for purchased items');
                const updateStockPromises = items.map(async item => {
                    if (!item.productVariantId) return null;
                    
                    const quantity = parseInt(item.quantity) || 1;
                    const updateStockQuery = `
                        UPDATE product_variants
                        SET stock = GREATEST(stock - $1, 0)
                        WHERE id = $2
                        RETURNING id, stock
                    `;
                    
                    return db.query(updateStockQuery, [quantity, item.productVariantId]);
                });

                const stockUpdateResults = await Promise.all(
                    updateStockPromises.filter(promise => promise !== null)
                );
                
                const updatedVariants = stockUpdateResults.map(result => 
                    result.rows && result.rows[0] ? result.rows[0] : null
                ).filter(Boolean);
                
                console.log(`Updated stock for ${updatedVariants.length} product variants:`, 
                    updatedVariants.map(v => `ID ${v.id}: ${v.stock} remaining`));
            } catch (error) {
                console.error('Error updating product stock quantities:', error);
                // Continue with order creation even if stock update fails
            }
        } catch (error) {
            console.error('Error processing order items:', error);
        }

        // Create invoice
        try {
            const actualBillingAddressId = billingAddressId || shippingAddressId;
            const invoiceResult = await orderQueries.createInvoice({
                orderId: order.id,
                amount: orderTotal,
                billingAddressId: actualBillingAddressId
            });
            console.log('Invoice created:', invoiceResult.rows[0]);
        } catch (error) {
            console.error('Error creating invoice:', error);
        }

        try {
            const cartResult = await cartQueries.getCart(userId);
            if (cartResult.rows && cartResult.rows.length > 0) {
                const cartId = cartResult.rows[0].cart_id;
                // Clear cart items
                await db.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
                console.log('Cart cleared after order placement');
            }
        } catch (error) {
            console.error('Error clearing cart:', error);
        }

        if (order) {
            try {
                // Get the complete order with items
                const finalOrderResult = await orderQueries.getUserOrders(userId);
                const finalOrder = finalOrderResult.rows.find(o => o.id === order.id);
                
                if (finalOrder) {
                    res.status(201).json(finalOrder);
                } else {
                    res.status(201).json(order);
                }
            } catch (error) {
                console.error('Error fetching final order details:', error);
                res.status(201).json(order);
            }
        } else {
            throw new Error('Order creation failed without specific error');
        }
    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({ 
            message: 'Server error creating order', 
            error: error.message, 
            stack: error.stack 
        });
    }
};

const getUserOrders = async (req, res) => {
    try {
        console.log('Fetching orders for user:', req.user.id);
        
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        
        const query = `
            SELECT o.*, 
                   json_agg(
                       CASE WHEN oi.id IS NOT NULL THEN
                           json_build_object(
                               'id', oi.id,
                               'product_variant', (
                                   SELECT json_build_object(
                                       'id', pv.id,
                                       'price', pv.price,
                                       'color', pv.color,
                                       'size', pv.size,
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
                               ),
                               'quantity', oi.quantity,
                               'price', oi.price
                           )
                       ELSE NULL END
                   ) FILTER (WHERE oi.id IS NOT NULL) as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.user_id = $1
            GROUP BY o.id
            ORDER BY o.created_at DESC;
        `;
        
        const { rows } = await db.query(query, [req.user.id]);
        console.log(`Found ${rows.length} orders for user ${req.user.id}`);
        
        res.json(rows || []);
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ 
            message: 'Server error fetching orders', 
            error: error.message,
            stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
        });
    }
};

const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const orderQuery = `
            SELECT * FROM orders WHERE id = $1 AND user_id = $2
        `;
        const orderResult = await db.query(orderQuery, [id, req.user.id]);
        
        if (!orderResult.rows || orderResult.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        const detailedOrderQuery = `
            SELECT 
                o.*,
                COALESCE(
                    (SELECT json_agg(
                        json_build_object(
                            'id', oi.id,
                            'product_variant', (
                                SELECT json_build_object(
                                    'id', pv.id,
                                    'price', pv.price,
                                    'color', pv.color,
                                    'size', pv.size,
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
                            ),
                            'quantity', oi.quantity,
                            'price', oi.price
                        )
                    ) FROM order_items oi WHERE oi.order_id = o.id),
                    '[]'::json
                ) as items,
                (
                    SELECT json_build_object(
                        'id', a.id,
                        'street', a.street,
                        'city', a.city,
                        'state', a.state,
                        'country', a.country,
                        'postal_code', a.postal_code
                    )
                    FROM addresses a
                    WHERE a.id = o.shipping_address_id
                ) as shipping_address
            FROM orders o
            WHERE o.id = $1 AND o.user_id = $2;
        `;
        
        const result = await db.query(detailedOrderQuery, [id, req.user.id]);
        
        if (!result.rows || result.rows.length === 0) {
            return res.status(404).json({ message: 'Order details not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching order by ID:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getAllOrders = async (req, res) => {
    try {
        // Only admin users should be able to access all orders
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        const query = `
            SELECT 
                o.*,
                u.email as user_email,
                u.first_name as user_first_name,
                u.last_name as user_last_name,
                COALESCE(
                    (SELECT json_agg(
                        json_build_object(
                            'id', oi.id,
                            'product_variant', (
                                SELECT json_build_object(
                                    'id', pv.id,
                                    'price', pv.price,
                                    'color', pv.color,
                                    'size', pv.size,
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
                            ),
                            'quantity', oi.quantity,
                            'price', oi.price
                        )
                    ) FROM order_items oi WHERE oi.order_id = o.id),
                    '[]'::json
                ) as items,
                (
                    SELECT json_build_object(
                        'id', a.id,
                        'street', a.street,
                        'city', a.city,
                        'state', a.state,
                        'country', a.country,
                        'postal_code', a.postal_code
                    )
                    FROM addresses a
                    WHERE a.id = o.shipping_address_id
                ) as shipping_address
            FROM orders o
            JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC;
        `;
        
        const { rows } = await db.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching all orders:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        
        // Validate the status
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'completed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                message: 'Invalid status', 
                validStatuses 
            });
        }
        
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        const { rows } = await orderQueries.updateOrderStatus(req.params.id, status);
        if (!rows.length) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        res.json(rows[0]);
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        // Verify the order exists and belongs to this user
        const orderQuery = `
            SELECT * FROM orders WHERE id = $1 AND user_id = $2
        `;
        const orderResult = await db.query(orderQuery, [id, userId]);
        
        if (!orderResult.rows || orderResult.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        const order = orderResult.rows[0];
        
        // Only allow cancellation of pending orders
        if (order.status !== 'pending') {
            return res.status(400).json({ 
                message: 'Only pending orders can be cancelled',
                currentStatus: order.status
            });
        }

        // Get order items to restore stock
        const orderItemsQuery = `
            SELECT oi.product_variant_id, oi.quantity 
            FROM order_items oi 
            WHERE oi.order_id = $1
        `;
        const orderItemsResult = await db.query(orderItemsQuery, [id]);
        const orderItems = orderItemsResult.rows;
        
        // Update order status to cancelled
        const { rows } = await orderQueries.updateOrderStatus(id, 'cancelled');
        if (!rows.length) {
            return res.status(500).json({ message: 'Failed to cancel order' });
        }

        // Restore stock for each product variant
        try {
            if (orderItems && orderItems.length > 0) {
                console.log(`Restoring stock for ${orderItems.length} items from cancelled order ${id}`);
                
                const restoreStockPromises = orderItems.map(item => {
                    const restoreStockQuery = `
                        UPDATE product_variants
                        SET stock = stock + $1
                        WHERE id = $2
                        RETURNING id, stock
                    `;
                    return db.query(restoreStockQuery, [item.quantity, item.product_variant_id]);
                });
                
                const stockRestoreResults = await Promise.all(restoreStockPromises);
                const restoredVariants = stockRestoreResults
                    .map(result => result.rows && result.rows[0] ? result.rows[0] : null)
                    .filter(Boolean);
                
                console.log(`Restored stock for ${restoredVariants.length} product variants:`, 
                    restoredVariants.map(v => `ID ${v.id}: ${v.stock} now available`));
            }
        } catch (error) {
            console.error('Error restoring product stock quantities:', error);
            // Continue with order cancellation even if stock restoration fails
        }
        
        res.json({ message: 'Order cancelled successfully', order: rows[0] });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getOrderInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        
        // Determine if admin or regular user
        const isAdmin = req.user.role === 'admin';
        
        // Build query based on user role
        let orderQuery;
        let queryParams;
        
        if (isAdmin) {
            // Admins can view any invoice
            orderQuery = `
                SELECT 
                    o.*,
                    u.first_name as user_first_name, 
                    u.last_name as user_last_name,
                    u.email as user_email,
                    i.id as invoice_id,
                    i.amount as invoice_amount,
                    i.created_at as invoice_date,
                    ba.street as billing_street,
                    ba.city as billing_city,
                    ba.state as billing_state,
                    ba.country as billing_country,
                    ba.postal_code as billing_postal_code,
                    sa.street as shipping_street,
                    sa.city as shipping_city,
                    sa.state as shipping_state,
                    sa.country as shipping_country,
                    sa.postal_code as shipping_postal_code,
                    COALESCE(
                        (SELECT json_agg(
                            json_build_object(
                                'id', oi.id,
                                'product_variant', (
                                    SELECT json_build_object(
                                        'id', pv.id,
                                        'price', pv.price,
                                        'color', pv.color,
                                        'size', pv.size,
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
                                ),
                                'quantity', oi.quantity,
                                'price', oi.price
                            )
                        ) FROM order_items oi WHERE oi.order_id = o.id),
                        '[]'::json
                    ) as items
                FROM orders o
                JOIN users u ON o.user_id = u.id
                JOIN invoices i ON i.order_id = o.id
                JOIN addresses ba ON i.billing_address_id = ba.id
                JOIN addresses sa ON o.shipping_address_id = sa.id
                WHERE o.id = $1
            `;
            queryParams = [id];
        } else {
            // Regular users can only view their own invoices
            orderQuery = `
                SELECT 
                    o.*,
                    u.first_name as user_first_name, 
                    u.last_name as user_last_name,
                    u.email as user_email,
                    i.id as invoice_id,
                    i.amount as invoice_amount,
                    i.created_at as invoice_date,
                    ba.street as billing_street,
                    ba.city as billing_city,
                    ba.state as billing_state,
                    ba.country as billing_country,
                    ba.postal_code as billing_postal_code,
                    sa.street as shipping_street,
                    sa.city as shipping_city,
                    sa.state as shipping_state,
                    sa.country as shipping_country,
                    sa.postal_code as shipping_postal_code,
                    COALESCE(
                        (SELECT json_agg(
                            json_build_object(
                                'id', oi.id,
                                'product_variant', (
                                    SELECT json_build_object(
                                        'id', pv.id,
                                        'price', pv.price,
                                        'color', pv.color,
                                        'size', pv.size,
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
                                ),
                                'quantity', oi.quantity,
                                'price', oi.price
                            )
                        ) FROM order_items oi WHERE oi.order_id = o.id),
                        '[]'::json
                    ) as items
                FROM orders o
                JOIN users u ON o.user_id = u.id
                JOIN invoices i ON i.order_id = o.id
                JOIN addresses ba ON i.billing_address_id = ba.id
                JOIN addresses sa ON o.shipping_address_id = sa.id
                WHERE o.id = $1 AND o.user_id = $2
            `;
            queryParams = [id, userId];
        }
        
        const result = await db.query(orderQuery, queryParams);
        
        if (!result.rows || result.rows.length === 0) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        
        const invoiceData = result.rows[0];
        
        res.json(invoiceData);
    } catch (error) {
        console.error('Error fetching invoice:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    createOrder,
    getUserOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
    cancelOrder,
    getOrderInvoice
};