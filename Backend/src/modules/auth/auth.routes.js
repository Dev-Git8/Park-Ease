const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { loginLimiter, registerLimiter, refreshLimiter, setPasswordLimiter } = require('../../middlewares/rateLimit.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { registerSchema, loginSchema, setPasswordSchema } = require('./auth.schemas');

// @route   POST api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerLimiter, validate(registerSchema), authController.register);

// @route   POST api/auth/login
// @desc    Login user & get access token
// @access  Public
router.post('/login', loginLimiter, validate(loginSchema), authController.login);

// @route   POST api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', refreshLimiter, authController.refresh);

// @route   POST api/auth/logout
// @desc    Logout user & clear cookie
// @access  Public
router.post('/logout', authController.logout);

// @route   POST api/auth/set-password
// @desc    Redeem a password-setup token (from a visit-request approval email)
// @access  Public (token-gated)
router.post('/set-password', setPasswordLimiter, validate(setPasswordSchema), authController.setPassword);

module.exports = router;
