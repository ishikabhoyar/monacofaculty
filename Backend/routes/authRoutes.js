// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateUser } = require('../middleware/auth');

// User registration
router.post('/register', authController.register);

// User login
router.post('/login', authController.login);

// User logout
router.post('/logout', authenticateUser, authController.logout);

// Get current user profile
router.get('/profile', authenticateUser, authController.getProfile);

// Password reset request
router.post('/reset-password', authController.requestPasswordReset);

module.exports = router;
