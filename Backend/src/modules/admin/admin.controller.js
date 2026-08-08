const adminService = require('./admin.service');

const getBusinesses = async (req, res, next) => {
    try {
        const businesses = await adminService.getAllBusinesses();
        res.status(200).json({ success: true, data: businesses });
    } catch (error) {
        next(error);
    }
};

const getUsers = async (req, res, next) => {
    try {
        const users = await adminService.getAllUsers();
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        next(error);
    }
};

const approveBusiness = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'approved' or 'rejected'

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const business = await adminService.updateBusinessStatus(id, status);
        res.status(200).json({ success: true, message: `Business ${status}`, data: business });
    } catch (error) {
        next(error);
    }
};

const ADMIN_INVITE_ROLES = ['customer', 'business', 'admin'];

// The calling admin sets/communicates the password out-of-band - there's no
// email infra in this stack yet.
const inviteUser = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        if (!ADMIN_INVITE_ROLES.includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }

        const user = await adminService.inviteUser(name, email, password, role);

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: user
        });
    } catch (error) {
        if (error.message === 'User already exists') {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
};

module.exports = {
    getBusinesses,
    getUsers,
    approveBusiness,
    inviteUser
};
