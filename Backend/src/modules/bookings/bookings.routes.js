const express = require('express');
const router = express.Router();
const bookingsController = require('./bookings.controller');
const { authMiddleware, roleMiddleware } = require('../../middlewares/auth.middleware');
const { bookingCreateLimiter } = require('../../middlewares/rateLimit.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { createBookingSchema } = require('./bookings.schemas');

// @route   POST api/bookings
// @desc    Create a new booking
// @access  Private (Customer)
router.post('/', authMiddleware, roleMiddleware(['customer']), bookingCreateLimiter, validate(createBookingSchema), bookingsController.createBooking);

// @route   GET api/bookings/my
// @desc    Get current user's bookings
// @access  Private (Customer)
router.get('/my', authMiddleware, roleMiddleware(['customer']), bookingsController.getMyBookings);

// @route   PUT api/bookings/:id/terminate
// @desc    Terminate a booking (Manual Checkout)
// @access  Private (Customer)
router.put('/:id/terminate', authMiddleware, roleMiddleware(['customer']), bookingsController.terminateBooking);

// @route   PUT api/bookings/:id/cancel
// @desc    Cancel a booking
// @access  Private (Customer)
router.put('/:id/cancel', authMiddleware, roleMiddleware(['customer']), bookingsController.cancelBooking);

// @route   GET api/bookings/business/:businessId
// @desc    Get bookings for a business
// @access  Private (Business Owner)
router.get('/business/:businessId', authMiddleware, roleMiddleware(['business']), bookingsController.getBusinessBookings);

module.exports = router;
