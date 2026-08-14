const crypto = require('crypto');
const prisma = require('../../config/prisma');
const authService = require('../auth/auth.service');
const emailService = require('../../services/email.service');
const { hashToken } = require('../../utils/token.utils');

const PASSWORD_SETUP_TOKEN_TTL_HOURS = parseInt(process.env.PASSWORD_SETUP_TOKEN_TTL_HOURS) || 24;

const createVisitRequest = async (name, email, message) => {
    return await prisma.visitRequest.create({
        data: { name, email, message: message || null },
    });
};

const getAllVisitRequests = async () => {
    return await prisma.visitRequest.findMany({ orderBy: { createdAt: 'desc' } });
};

const issuePasswordSetupToken = async (userId) => {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + PASSWORD_SETUP_TOKEN_TTL_HOURS * 60 * 60 * 1000);

    await prisma.passwordSetupToken.create({
        data: { userId, tokenHash: hashToken(rawToken), expiresAt },
    });

    return rawToken;
};

const updateVisitRequestStatus = async (id, status) => {
    const existing = await prisma.visitRequest.findUnique({ where: { id: parseInt(id) } });
    if (!existing) {
        const err = new Error('Visit request not found');
        err.statusCode = 404;
        err.isOperational = true;
        throw err;
    }
    if (existing.status !== 'pending') {
        const err = new Error('This visit request has already been decided');
        err.statusCode = 400;
        err.isOperational = true;
        throw err;
    }

    const updated = await prisma.visitRequest.update({
        where: { id: parseInt(id) },
        data: { status },
    });

    let emailDelivered = true;
    try {
        if (status === 'rejected') {
            await emailService.sendVisitRejectedEmail(updated.email, updated.name);
        } else {
            const existingUser = await authService.findUserByEmail(updated.email);
            if (existingUser) {
                await emailService.sendVisitApprovedExistingAccountEmail(updated.email, updated.name);
            } else {
                const throwawayPassword = crypto.randomBytes(32).toString('hex');
                const newUser = await authService.createUser(updated.name, updated.email, throwawayPassword, 'business');
                const rawToken = await issuePasswordSetupToken(newUser.id);
                const setPasswordUrl = `${process.env.FRONTEND_URL}/set-password?token=${rawToken}`;
                await emailService.sendVisitApprovedNewAccountEmail(updated.email, updated.name, setPasswordUrl);
            }
        }
    } catch (err) {
        console.error('[VisitRequests] Failed to send status-update email:', err.message);
        emailDelivered = false;
    }

    return { visitRequest: updated, emailDelivered };
};

module.exports = {
    createVisitRequest,
    getAllVisitRequests,
    updateVisitRequestStatus,
};
