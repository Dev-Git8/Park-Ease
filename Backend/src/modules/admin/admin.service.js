const prisma = require('../../config/prisma');
const authService = require('../auth/auth.service');

const getAllBusinesses = async () => {
    return await prisma.business.findMany({
        include: {
            owner: {
                select: {
                    name: true,
                    email: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
};

const getAllUsers = async () => {
    return await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
    });
};

const updateBusinessStatus = async (id, status) => {
    return await prisma.business.update({
        where: { id: parseInt(id) },
        data: { status },
    });
};

// The one legitimate caller that may pass role='admin' to createUser - it's
// gated by roleMiddleware(['admin']) on the route, not by createUser itself.
const inviteUser = async (name, email, password, role) => {
    const existing = await authService.findUserByEmail(email);
    if (existing) {
        throw new Error('User already exists');
    }
    return await authService.createUser(name, email, password, role);
};

module.exports = {
    getAllBusinesses,
    getAllUsers,
    updateBusinessStatus,
    inviteUser
};
