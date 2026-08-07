const express = require('express');
const router = express.Router();
const paymentsController = require('./payments.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');
const { paymentVerifyLimiter } = require('../../middlewares/rateLimit.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { verifyPaymentSchema } = require('./payments.schemas');

// @route   POST api/payments/webhook
// @desc    Razorpay webhook (payment.captured/failed, refund.processed)
// @access  Public - authenticated via Razorpay signature, not a session
router.post('/webhook', paymentsController.handleWebhook);

// @route   POST api/payments/verify
// @desc    Fast-path payment confirmation from the frontend's checkout success callback
// @access  Private (ownership of the underlying booking is checked against the order)
router.post('/verify', authMiddleware, paymentVerifyLimiter, validate(verifyPaymentSchema), paymentsController.verifyPayment);

// @route   GET api/payments/config
// @desc    Public Razorpay key id, for resuming a payment without a fresh order response
// @access  Private
router.get('/config', authMiddleware, paymentsController.getConfig);

module.exports = router;
