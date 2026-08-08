const { redisClient, isRedisConnected } = require('../config/redis');
const { getIO } = require('../config/socket');

const emitSlotsUpdated = (businessId) => {
    try {
        const io = getIO();
        io.to(`business_${businessId}`).emit('slotsUpdated', { businessId });
    } catch (err) {
        console.error('Failed to emit slotsUpdated event:', err.message);
    }
};

const invalidateSlotsCache = async (businessId) => {
    if (!isRedisConnected()) return;
    try {
        await redisClient.del(`slots:${businessId}`);
    } catch (err) {
        console.error('Failed to invalidate Redis cache:', err.message);
    }
};

module.exports = { emitSlotsUpdated, invalidateSlotsCache };
