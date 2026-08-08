const express = require('express');
const router = express.Router();
const businessController = require('./business.controller');
const { authMiddleware, roleMiddleware } = require('../../middlewares/auth.middleware');
const upload = require('../../middlewares/upload.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { registerBusinessSchema, updateBusinessSchema } = require('./business.schemas');

// @route   POST api/business/register
// @desc    Register a business (Business Owners)
// @access  Private (Business Owner)
router.post('/register', authMiddleware, roleMiddleware(['business']), upload.single('image'), validate(registerBusinessSchema), upload.verifyImageContent, businessController.registerBusiness);

// @route   GET api/business/my
// @desc    Get owner's businesses
// @access  Private (Business Owner)
router.get('/my', authMiddleware, roleMiddleware(['business']), businessController.getMyBusinesses);

// @route   GET api/business
// @desc    Get all approved businesses
// @access  Public
router.get('/', businessController.getAllApproved);

// @route   PUT api/business/:id
// @desc    Update business details
// @access  Private (Business Owner)
router.put('/:id', authMiddleware, roleMiddleware(['business']), upload.single('image'), validate(updateBusinessSchema), upload.verifyImageContent, businessController.updateBusiness);

// @route   GET api/business/:id
// @desc    Get single business details
// @access  Public
router.get('/:id', businessController.getSingleBusiness);

module.exports = router;
