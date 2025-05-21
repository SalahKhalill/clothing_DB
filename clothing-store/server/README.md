# README.md for the Server

# Clothing Store API

This is the server-side application for the Clothing Store e-commerce platform built using Express.js and PostgreSQL. It provides RESTful APIs for managing products, orders, users, and authentication.

## Features

- User authentication (login, registration)
- Admin functionalities for managing products and orders
- CRUD operations for products and orders
- Role-based access control for admin and user routes
- Integration with PostgreSQL for data storage

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the server directory:
   ```
   cd server
   ```

3. Install the dependencies:
   ```
   npm install
   ```

4. Set up your PostgreSQL database and update the database configuration in `src/config/db.js`.

5. Start the server:
   ```
   npm start
   ```

## API Endpoints

- **Authentication**
  - `POST /api/auth/login` - User login
  - `POST /api/auth/register` - User registration

- **Products**
  - `GET /api/products` - Get all products
  - `POST /api/products` - Add a new product (Admin only)
  - `PUT /api/products/:id` - Update a product (Admin only)
  - `DELETE /api/products/:id` - Delete a product (Admin only)

- **Orders**
  - `GET /api/orders` - Get all orders (Admin only)
  - `POST /api/orders` - Create a new order
  - `PUT /api/orders/:id` - Update an order status (Admin only)

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.