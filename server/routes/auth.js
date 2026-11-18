const express = require('express');
const router = express.Router();
const { login, forgotPassword, resetPassword, changePassword, getMe, getDemoAccounts } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// GET /api/auth/demo-accounts (Public list for portfolio visitors)
router.get('/demo-accounts', getDemoAccounts);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', resetPassword);

// POST /api/auth/change-password
router.post('/change-password', protect, changePassword);

// GET /api/auth/me
router.get('/me', protect, getMe);

module.exports = router;
