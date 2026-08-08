const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const { authMiddleware, roleMiddleware } = require('../../middlewares/auth.middleware');

// All admin routes are protected
router.use(authMiddleware, roleMiddleware(['admin']));

// @route   GET api/admin/businesses
// @desc    Get all businesses
router.get('/businesses', adminController.getBusinesses);

// @route   GET api/admin/users
// @desc    Get all users
router.get('/users', adminController.getUsers);

// @route   PUT api/admin/businesses/:id/status
// @desc    Approve or reject a business
router.put('/businesses/:id/status', adminController.approveBusiness);

// @route   POST api/admin/users
// @desc    Create a user of any role (customer/business/admin) - the one
//          legitimate way to create additional admin accounts after bootstrap
// @access  Private (Admin only, via the router.use gate above)
router.post('/users', adminController.inviteUser);

module.exports = router;
