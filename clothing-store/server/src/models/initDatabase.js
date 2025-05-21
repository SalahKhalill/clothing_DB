const db = require('../config/db');

const createTables = async () => {
    try {
        console.log('Checking for cart and wishlist tables...');

        // Check if carts table exists
        const cartTableCheck = await db.query(`
            SELECT to_regclass('public.carts') as exists;
        `);
        
        const cartsTableExists = !!cartTableCheck.rows[0].exists;
        
        if (!cartsTableExists) {
            console.log('Creating carts table...');
            // Create carts table
            await db.query(`
                CREATE TABLE carts (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('Carts table created successfully.');
        } else {
            console.log('Carts table already exists.');
        }
        
        // Check if cart_items table exists
        const cartItemsTableCheck = await db.query(`
            SELECT to_regclass('public.cart_items') as exists;
        `);
        
        const cartItemsTableExists = !!cartItemsTableCheck.rows[0].exists;
        
        if (!cartItemsTableExists) {
            console.log('Creating cart_items table...');
            // Create cart_items table
            await db.query(`
                CREATE TABLE cart_items (
                    id SERIAL PRIMARY KEY,
                    cart_id INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
                    product_variant_id INTEGER NOT NULL,
                    quantity INTEGER NOT NULL DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('Cart_items table created successfully.');
        } else {
            console.log('Cart_items table already exists.');
        }
        
        // Check if wishlists table exists
        const wishlistsTableCheck = await db.query(`
            SELECT to_regclass('public.wishlists') as exists;
        `);
        
        const wishlistsTableExists = !!wishlistsTableCheck.rows[0].exists;
        
        if (!wishlistsTableExists) {
            console.log('Creating wishlists table...');
            // Create wishlists table
            await db.query(`
                CREATE TABLE wishlists (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('Wishlists table created successfully.');
        } else {
            console.log('Wishlists table already exists.');
        }
        
        // Check if wishlist_items table exists
        const wishlistItemsTableCheck = await db.query(`
            SELECT to_regclass('public.wishlist_items') as exists;
        `);
        
        const wishlistItemsTableExists = !!wishlistItemsTableCheck.rows[0].exists;
        
        if (!wishlistItemsTableExists) {
            console.log('Creating wishlist_items table...');
            // Create wishlist_items table
            await db.query(`
                CREATE TABLE wishlist_items (
                    id SERIAL PRIMARY KEY,
                    wishlist_id INTEGER NOT NULL,
                    product_id INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(wishlist_id, product_id)
                );
            `);
            console.log('Wishlist_items table created successfully.');
        } else {
            console.log('Wishlist_items table already exists.');
        }

        // Check if orders table exists
        const ordersTableCheck = await db.query(`
            SELECT to_regclass('public.orders') as exists;
        `);
        
        const ordersTableExists = !!ordersTableCheck.rows[0].exists;
        
        if (!ordersTableExists) {
            console.log('Creating orders table...');
            // Create orders table
            await db.query(`
                CREATE TABLE orders (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    status VARCHAR(50) NOT NULL DEFAULT 'pending',
                    total DECIMAL(10, 2) NOT NULL DEFAULT 0,
                    shipping_address_id INTEGER NOT NULL,
                    payment_method VARCHAR(50) DEFAULT 'credit_card',
                    coupon_code VARCHAR(50) NULL,
                    discount_amount DECIMAL(10, 2) DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('Orders table created successfully.');
        } else {
            console.log('Orders table already exists.');
            
            // Check if coupon fields exist, add them if they don't
            try {
                const couponFieldsCheck = await db.query(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'orders' AND column_name = 'coupon_code';
                `);
                
                if (couponFieldsCheck.rows.length === 0) {
                    console.log('Adding coupon fields to orders table...');
                    await db.query(`
                        ALTER TABLE orders 
                        ADD COLUMN coupon_code VARCHAR(50) NULL,
                        ADD COLUMN discount_amount DECIMAL(10, 2) DEFAULT 0;
                    `);
                    console.log('Coupon fields added to orders table.');
                } else {
                    console.log('Coupon fields already exist in orders table.');
                }
            } catch (error) {
                console.error('Error checking or adding coupon fields to orders table:', error);
            }
        }
        
        // Check if order_items table exists
        const orderItemsTableCheck = await db.query(`
            SELECT to_regclass('public.order_items') as exists;
        `);
        
        const orderItemsTableExists = !!orderItemsTableCheck.rows[0].exists;
        
        if (!orderItemsTableExists) {
            console.log('Creating order_items table...');
            // Create order_items table
            await db.query(`
                CREATE TABLE order_items (
                    id SERIAL PRIMARY KEY,
                    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                    product_variant_id INTEGER NOT NULL,
                    quantity INTEGER NOT NULL DEFAULT 1,
                    price DECIMAL(10, 2) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('Order_items table created successfully.');
        } else {
            console.log('Order_items table already exists.');
        }
        
        // Check if invoices table exists
        const invoicesTableCheck = await db.query(`
            SELECT to_regclass('public.invoices') as exists;
        `);
        
        const invoicesTableExists = !!invoicesTableCheck.rows[0].exists;
        
        if (!invoicesTableExists) {
            console.log('Creating invoices table...');
            // Create invoices table
            await db.query(`
                CREATE TABLE invoices (
                    id SERIAL PRIMARY KEY,
                    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                    amount DECIMAL(10, 2) NOT NULL,
                    billing_address_id INTEGER NOT NULL,
                    payment_status VARCHAR(50) DEFAULT 'paid',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('Invoices table created successfully.');
        } else {
            console.log('Invoices table already exists.');
        }

        // Check if coupons table exists
        const couponsTableCheck = await db.query(`
            SELECT to_regclass('public.coupons') as exists;
        `);
        
        const couponsTableExists = !!couponsTableCheck.rows[0].exists;
        
        if (!couponsTableExists) {
            console.log('Creating coupons table...');
            // Create coupons table
            await db.query(`
                CREATE TABLE IF NOT EXISTS public.coupons
                (
                    id serial NOT NULL,
                    code character varying(50) COLLATE pg_catalog."default" NOT NULL,
                    discount_percentage integer NOT NULL,
                    expires_at timestamp with time zone NOT NULL,
                    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT coupons_pkey PRIMARY KEY (id),
                    CONSTRAINT coupons_code_key UNIQUE (code)
                );
            `);
            console.log('Coupons table created successfully.');
        } else {
            console.log('Coupons table already exists.');
        }

        console.log('All tables checked or created successfully.');
    } catch (error) {
        console.error('Error creating tables:', error);
    }
};

// Run the function if this file is executed directly
if (require.main === module) {
    createTables()
        .then(() => {
            console.log('Database initialization completed');
            process.exit(0);
        })
        .catch(err => {
            console.error('Error initializing database:', err);
            process.exit(1);
        });
}

module.exports = createTables; 