const prisma = require('../../config/prisma');
const bcrypt = require('bcrypt');
const { hashToken } = require('../../utils/token.utils');

const VALID_ROLES = ['customer', 'business', 'admin'];

const createUser = async (name, email, password, role) => {
    // Defense-in-depth: the public register controller already whitelists to
    // customer/business. This second gate covers legitimate admin-created
    // callers (e.g. the admin-invite endpoint) while still rejecting garbage.
    const safeRole = VALID_ROLES.includes(role) ? role : 'customer';
    const hashedPassword = await bcrypt.hash(password, 10);
    return await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role: safeRole,
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
        },
    });
};

const findUserByEmail = async (email) => {
    return await prisma.user.findUnique({
        where: { email },
    });
};

const findUserById = async (id) => {
    return await prisma.user.findUnique({
        where: { id: parseInt(id) },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
        },
    });
};

const createSession = async (userId, token, userAgent, ipAddress) => {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    return await prisma.$transaction(async (tx) => {
        // Enforce max 5 devices limit
        const sessionCount = await tx.session.count({
            where: { userId: parseInt(userId) }
        });

        if (sessionCount >= 5) {
            const oldestSession = await tx.session.findFirst({
                where: { userId: parseInt(userId) },
                orderBy: { createdAt: 'asc' }
            });
            
            if (oldestSession) {
                await tx.session.delete({
                    where: { id: oldestSession.id }
                });
            }
        }

        // Create new session
        return await tx.session.create({
            data: {
                userId: parseInt(userId),
                token,
                userAgent,
                ipAddress,
                expiresAt: sevenDaysFromNow
            }
        });
    });
};

const validateSession = async (token) => {
    const session = await prisma.session.findUnique({
        where: { token },
        include: { user: true }
    });

    if (!session) return null;

    // Check expiration
    if (new Date() > session.expiresAt) {
        await prisma.session.delete({ where: { id: session.id } });
        return null;
    }

    return session;
};

// Rotates a refresh token: deletes the old session row and creates a new one
// in a single transaction, so a stolen token is only ever usable once.
const rotateSession = async (oldToken, newToken, userId, userAgent, ipAddress) => {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    return await prisma.$transaction(async (tx) => {
        await tx.session.deleteMany({ where: { token: oldToken } });

        return await tx.session.create({
            data: {
                userId: parseInt(userId),
                token: newToken,
                userAgent,
                ipAddress,
                expiresAt: sevenDaysFromNow,
            },
        });
    });
};

const deleteSession = async (token) => {
    try {
        await prisma.session.delete({
            where: { token }
        });
    } catch (error) {
        // Ignore if already deleted
    }
};

const clearAllUserSessions = async (userId) => {
    await prisma.session.deleteMany({
        where: { userId: parseInt(userId) }
    });
};

const setPasswordViaToken = async (rawToken, newPassword) => {
    const tokenHash = hashToken(rawToken);
    const record = await prisma.passwordSetupToken.findUnique({ where: { tokenHash } });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
        return false;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
        prisma.user.update({ where: { id: record.userId }, data: { password: hashedPassword } }),
        prisma.passwordSetupToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ]);

    return true;
};

module.exports = {
    createUser,
    findUserByEmail,
    findUserById,
    createSession,
    validateSession,
    rotateSession,
    deleteSession,
    clearAllUserSessions,
    setPasswordViaToken,
};
