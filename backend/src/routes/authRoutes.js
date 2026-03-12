const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authenticate');
const { validate } = require('../middleware/validate');
const {
  registerValidation,
  loginValidation,
  refreshValidation,
  resetPasswordValidation,
} = require('../middleware/validators');
const config = require('../config/config');

// ─── Rate limiter for auth endpoints ─────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: 20, // tighter limit for auth
  message: config.rateLimit.message,
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Public Routes ────────────────────────────────────────────────────────────
// POST /api/auth/register
router.post('/register', authLimiter, registerValidation, validate, authController.register);

// POST /api/auth/login
router.post('/login', authLimiter, loginValidation, validate, authController.login);

// POST /api/auth/refresh-token
router.post('/refresh-token', refreshValidation, validate, authController.refreshToken);

// POST /api/auth/forgot-password
router.post('/forgot-password', authLimiter, authController.forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', resetPasswordValidation, validate, authController.resetPassword);

// ─── Protected Routes ─────────────────────────────────────────────────────────
// POST /api/auth/logout
router.post('/logout', authenticate, authController.logout);

// GET /api/auth/me
router.get('/me', authenticate, authController.getMe);

module.exports = router;
