const jwt = require('jsonwebtoken');
const config = require('../config/config');

const adminMiddleware = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ message: 'No token provided!' });
    }

    jwt.verify(token, config.secret, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Unauthorized!' });
        }

        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Require Admin Role!' });
        }

        req.userId = decoded.id;
        next();
    });
};

module.exports = adminMiddleware;