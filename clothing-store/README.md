# Clothing Store E-Commerce Application

This is a full-stack e-commerce application for a clothing store built using React.js for the frontend, Express.js for the backend, and PostgreSQL for the database. The application provides a seamless shopping experience for customers and a robust admin panel for managing products and orders.

## Features

### Admin Panel
- Dashboard for viewing key metrics and statistics.
- Add, edit, and delete products and their variants.
- Manage and approve customer orders.

### Customer Experience
- User authentication for login and registration.
- Add items to the cart and wishlist.
- Checkout process with Cash on Delivery (COD) payment method.
- Manage user profile and addresses.

### Responsive Design
- Fully responsive UI for mobile and desktop devices.
- Intuitive navigation and layout for easy browsing.

## Project Structure

```
clothing-store
├── client          # Frontend application
│   ├── public
│   ├── src
│   └── package.json
├── server          # Backend application
│   ├── src
│   └── package.json
└── package.json    # Root package.json
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd clothing-store
   ```

2. Install dependencies for the client:
   ```
   cd client
   npm install
   ```

3. Install dependencies for the server:
   ```
   cd ../server
   npm install
   ```

4. Set up the PostgreSQL database and configure the connection in `server/src/config/db.js`.

5. Start the server:
   ```
   cd server
   npm start
   ```

6. Start the client:
   ```
   cd client
   npm start
   ```

## License

This project is licensed under the MIT License.