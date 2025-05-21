const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const userController = require('../controllers/user.controller');

// Profile routes
router.get('/profile', verifyToken, userController.getUserProfile);
router.put('/profile', verifyToken, userController.updateProfile);

// Address routes
router.get('/addresses', verifyToken, userController.getAddresses);
router.post('/addresses', verifyToken, userController.addAddress);
router.put('/addresses/:id', verifyToken, userController.updateUserAddress);
router.delete('/addresses/:id', verifyToken, userController.deleteUserAddress);

module.exports = router;