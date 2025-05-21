require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 5002,
    JWT_SECRET: process.env.JWT_SECRET || '4e2e1c7ff74b8a1797b8d2081188f2c1f4cd9407f8a93b26fa679e5c11a7f46f18fa287e5fdd88d637c90f7adf65f98f90b3ab5ab287d6e1f32c0c1c093ea8ab',
    DB: {
        host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Salah123',
        database: process.env.DB_NAME || 'ClothingDB',
        port: process.env.DB_PORT || 5432
    }
};