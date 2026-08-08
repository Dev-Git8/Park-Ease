const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { loginLimiter, registerLimiter, refreshLimiter } = require('../../middlewares/rateLimit.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { registerSchema, loginSchema } = require('./auth.schemas');

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

module.exports = router;
