const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { redisClient, isRedisConnected } = require('../config/redis');

// Sharing limits across instances via Redis only makes sense once Redis is
// actually connected; falling back to the in-memory store keeps rate
// limiting working (per-instance) even if Redis is down.
const makeStore = () => {
    if (!isRedisConnected()) return undefined;
    return new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
    });
};

const buildLimiter = ({ windowMs, max, message }) =>
    rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        message: { success: false, message },
        store: makeStore(),
    });

const loginLimiter = buildLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many login attempts. Please try again later.',
});

const registerLimiter = buildLimiter({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: 'Too many registration attempts. Please try again later.',
});

const refreshLimiter = buildLimiter({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: 'Too many token refresh attempts. Please try again later.',
});

const bookingCreateLimiter = buildLimiter({
    windowMs: 60 * 1000,
    max: 10,
    message: 'Too many booking attempts. Please slow down.',
});

const globalLimiter = buildLimiter({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: 'Too many requests. Please try again later.',
});

const paymentVerifyLimiter = buildLimiter({
    windowMs: 60 * 1000,
    max: 20,
    message: 'Too many payment verification attempts. Please slow down.',
});

module.exports = {
    loginLimiter,
    registerLimiter,
    refreshLimiter,
    bookingCreateLimiter,
    globalLimiter,
    paymentVerifyLimiter,
};
