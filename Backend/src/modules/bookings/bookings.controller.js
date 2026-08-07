const bookingsService = require('./bookings.service');

const createBooking = async (req, res, next) => {
    try {
        // totalPrice is intentionally NOT read from the body - price is
        // always computed server-side inside createBookingHold.
        const { businessId, slotId, startTime, endTime } = req.body;
        const userId = req.user.id;

        const { booking, order } = await bookingsService.createBookingHold(
            userId,
            businessId,
            slotId,
            startTime,
            endTime
        );

        res.status(201).json({
            success: true,
            message: 'Booking hold created - complete payment to confirm',
            data: { booking, order }
        });
    } catch (error) {
        const message = error.message || '';
        if (message === 'Slot is already booked for an overlapping time range') {
            return res.status(409).json({ success: false, message });
        }
        if (
            message === 'Business not found' ||
            message === 'Slot not found' ||
            message === 'Slot does not belong to this business' ||
            message === 'Business is not accepting bookings' ||
            message === 'Slot is under maintenance' ||
            message.includes('startTime') ||
            message.includes('endTime') ||
            message.includes('Booking duration')
        ) {
            return res.status(400).json({ success: false, message });
        }
        next(error);
    }
};

const cancelBooking = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const booking = await bookingsService.cancelBookingTransaction(id, userId);

        res.status(200).json({
            success: true,
            message: 'Booking cancelled successfully',
            data: booking
        });
    } catch (error) {
        if (error.message === 'Booking not found' || error.message === 'Unauthorized' || error.message === 'Booking cannot be cancelled in its current state') {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const getMyBookings = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const bookings = await bookingsService.getBookingsByUser(userId);

        res.status(200).json({
            success: true,
            data: bookings
        });
    } catch (error) {
        next(error);
    }
};

const getBusinessBookings = async (req, res, next) => {
    try {
        const { businessId } = req.params;
        const ownerId = req.user.id;
        const bookings = await bookingsService.getBookingsByBusiness(businessId, ownerId);

        res.status(200).json({
            success: true,
            data: bookings
        });
    } catch (error) {
        if (error.message === 'Business not found') {
            return res.status(404).json({ success: false, message: error.message });
        }
        if (error.message === 'Unauthorized') {
            return res.status(403).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const terminateBooking = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const { booking, order } = await bookingsService.terminateBookingTransaction(id, userId);

        res.status(200).json({
            success: true,
            message: order ? 'Checked out - complete the overstay penalty payment to finish' : 'Booking terminated successfully',
            data: { booking, order }
        });
    } catch (error) {
        if (error.message === 'Booking not found' || error.message === 'Unauthorized' || error.message === 'Booking cannot be terminated in its current state') {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
};

module.exports = {
    createBooking,
    cancelBooking,
    getMyBookings,
    getBusinessBookings,
    terminateBooking
};
