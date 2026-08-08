const express = require('express');
const router = express.Router();
const slotsController = require('./slots.controller');
const { authMiddleware, roleMiddleware } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { addSlotsSchema } = require('./slots.schemas');

// @route   POST api/slots
// @desc    Add slots to a business
// @access  Private (Business Owner)
router.post('/', authMiddleware, roleMiddleware(['business']), validate(addSlotsSchema), slotsController.addSlots);

// @route   GET api/slots/:businessId
// @desc    Get all slots for a business
// @access  Public
router.get('/:businessId', slotsController.listSlots);

// @route   DELETE api/slots/:id
// @desc    Delete a slot
// @access  Private (Business Owner)
router.delete('/:id', authMiddleware, roleMiddleware(['business']), slotsController.removeSlot);

module.exports = router;
