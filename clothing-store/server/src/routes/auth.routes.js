const express = require('express');
const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// User registration route
router.post('/register', authController.register);

// User login route
router.post('/login', authController.login);

// Get current user route
router.get('/current', verifyToken, authController.getCurrentUser);

module.exports = router;