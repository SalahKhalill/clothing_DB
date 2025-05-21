# 🛍️ Clothing Store E-commerce Platform

A full-stack e-commerce application for clothing retail, featuring a React frontend and Node.js backend with PostgreSQL database.

---

## 📦 Project Overview

This clothing store application provides a complete e-commerce solution with separate client and server components.

### 👤 Customer Features
- Product browsing and search  
- User authentication (registration & login)  
- Shopping cart & wishlist  
- Secure checkout process  
- Order history and tracking  
- Address management  

### 🛠️ Admin Features
- Secure admin authentication  
- Dashboard with analytics  
- Product management (add, edit, delete)  
- Order management and processing  
- Customer management  

---

## 📁 Project Structure

```
clothing-store/
├── client/                 # React frontend application
│   ├── public/             # Static assets
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── pages/          # Page components
│       ├── services/       # API and context services
│       └── styles/         # CSS styling
│
├── server/                 # Node.js backend API
│   ├── src/
│   │   ├── config/         # Configuration settings
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   └── utils/          # Utility functions
│   └── uploads/            # Uploaded files storage
│
└── node_modules/           # Project dependencies
```

---

## ⚙️ Technologies Used

### 🖥️ Frontend
- React 19  
- React Router Dom 7  
- Axios  
- React Testing Library  

### 🧠 Backend
- Node.js with Express  
- PostgreSQL  
- JWT for authentication  
- bcryptjs for password hashing  
- Multer for file uploads  

---

## 🚀 Getting Started

### ✅ Prerequisites
- Node.js (v16+)  
- PostgreSQL  
- npm or yarn  

### 📥 Installation

```bash
# Clone the repository
git clone https://github.com/SalahKhalill/clothing_DB.git
cd clothing-store

# Install dependencies
npm install

# Install client dependencies
cd client && npm install

# Install server dependencies
cd server && npm install
```

---

## 🔐 Configuration

Create a `.env` file in the `server` directory with the following content:

```
PORT=5002
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=clothing_store
JWT_SECRET=your_secret_key
```

Then, set up your PostgreSQL database with the same name specified above.

---

## 🏃 Running the Application

```bash
# Start the server
cd server
npm run dev

# Start the client
cd client
npm start
```

- Client: http://localhost:3000  
- Server: http://localhost:5002  

---

## 📡 API Endpoints

| Functionality   | Endpoint          |
|----------------|-------------------|
| Authentication | `/api/auth`       |
| Products       | `/api/products`   |
| Cart           | `/api/cart`       |
| Orders         | `/api/orders`     |
| Users          | `/api/users`      |
| Wishlist       | `/api/wishlist`   |
| Reviews        | `/api/reviews`    |
| Coupons        | `/api/coupons`    |

---

## 📄 License

This project is licensed under the **MIT License**.