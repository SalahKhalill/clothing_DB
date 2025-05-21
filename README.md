**Clothing Store E-commerce Platform**
-A full-stack e-commerce application for clothing retail, featuring a React frontend and Node.js backend with PostgreSQL database.
-Project Overview
-This clothing store application provides a complete e-commerce solution with separate client and server components:
-Customer features: Product browsing, user authentication, shopping cart, wishlist, checkout, and order management
-Admin features: Dashboard for product, order, and inventory management

***Technologies Used***
**Frontend**
-React 19
-React Router Dom 7
-Axios for API requests
-Modern React testing library
**Backend**
-Node.js with Express
-PostgreSQL database
-JSON Web Token (JWT) authentication
-bcryptjs for password hashing
-Multer for file uploads
***Features***
**Customer Portal**
-User registration and authentication
-Product browsing and searching
-Product detail views
-Shopping cart management
-Wishlist functionality
-Secure checkout process
-Order history and tracking
-Address management
**Admin Portal**
-Secure admin authentication
-Dashboard with analytics
-Product management (add, edit, delete)
-Order management and processing
-Customer management
***Getting Started***
**Prerequisites**
-Node.js (v16+)
-PostgreSQL database
-npm or yarn
**Installation**

# Clone the repository
-git clone https://github.com/SalahKhalill/clothing_DB.git
-cd clothing-store

# Install dependencies
-npm install

# Install client dependencies
-cd client && npm install

# Install server dependencies
-cd server && npm install



***Configuration***
1-Create a .env file in the server directory with the following variables:
   -PORT=5002
   -DB_USER=your_db_user
   -DB_PASSWORD=your_db_password
   -DB_HOST=localhost
   -DB_PORT=5432
   -DB_NAME=clothing_store
   -JWT_SECRET=your_secret_key

2- Set up your PostgreSQL database with the name specified in your environment variables.

**Running the Application**
# Start the server (from server directory)
-cd server
-npm run dev

# Start the client (from client directory)
-cd client
-npm start

-The client application will be available at http://localhost:3000, and the server will run on http://localhost:5002.

***API Endpoints***

-The server provides the following API endpoints:
-Authentication: /api/auth
-Login, register, password reset
-Products: /api/products
-Browse, search, and filter products
-Cart: /api/cart
-Add, remove, update cart items
-Orders: /api/orders
-Place orders, view order history
-Users: /api/users
-User profile management
-Wishlist: /api/wishlist
-Save and manage favorite products
-Reviews: /api/reviews
-Product reviews and ratings
-Coupons: /api/coupons
-Discount codes and promotions
-License
-This project is licensed under the MIT License.
