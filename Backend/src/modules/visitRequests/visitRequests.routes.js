const express = require('express');
const router = express.Router();
const visitRequestsController = require('./visitRequests.controller');
const { authMiddleware, roleMiddleware } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { visitRequestLimiter } = require('../../middlewares/rateLimit.middleware');
const { createVisitRequestSchema } = require('./visitRequests.schemas');

// @route   POST api/visit-requests
// @desc    Submit a "List your lot" visit request
// @access  Public
router.post('/', visitRequestLimiter, validate(createVisitRequestSchema), visitRequestsController.createVisitRequest);

// @route   GET api/visit-requests
// @desc    List all visit requests
// @access  Private (Admin only)
router.get('/', authMiddleware, roleMiddleware(['admin']), visitRequestsController.listVisitRequests);

// @route   PUT api/visit-requests/:id/status
// @desc    Approve or reject a visit request
// @access  Private (Admin only)
router.put('/:id/status', authMiddleware, roleMiddleware(['admin']), visitRequestsController.updateStatus);

module.exports = router;
