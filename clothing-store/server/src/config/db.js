const { Pool } = require('pg');
const config = require('./config');

const pool = new Pool({
    user: config.DB.user,
    host: config.DB.host,
    database: config.DB.database,
    password: config.DB.password,
    port: config.DB.port
});

pool.on('connect', () => {
    console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

module.exports = {
    query: (text, params) => pool.query(text, params)
};