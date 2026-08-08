const prisma = require('../config/prisma');

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // Every hour
let intervalId = null;

const cleanupExpiredSessions = async () => {
    try {
        const result = await prisma.session.deleteMany({
            where: { expiresAt: { lte: new Date() } },
        });
        if (result.count > 0) {
            console.log(`[SessionCleanup] Purged ${result.count} expired session(s).`);
        }
    } catch (error) {
        console.error('[SessionCleanup] Error purging expired sessions:', error.message);
    }
};

const startSessionCleanupScheduler = () => {
    console.log(`[SessionCleanup] Scheduler started (checking every ${CHECK_INTERVAL_MS / 1000 / 60}m)`);
    cleanupExpiredSessions();
    intervalId = setInterval(cleanupExpiredSessions, CHECK_INTERVAL_MS);
};

const stopSessionCleanupScheduler = () => {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        console.log('[SessionCleanup] Scheduler stopped.');
    }
};

module.exports = {
    startSessionCleanupScheduler,
    stopSessionCleanupScheduler,
};
