const errorMiddleware = (err, req, res, next) => {
    console.error(err.stack);

    // Only trust err.message when application code explicitly marked this as
    // a deliberate, client-safe error by setting BOTH statusCode and
    // isOperational=true. Checking statusCode alone isn't enough - third-party
    // SDK errors (e.g. Razorpay's own auth-failure error) also carry a numeric
    // statusCode mirroring the upstream HTTP status, which would otherwise slip
    // through as if it were a deliberate, safe-to-expose application error.
    // Everything else (Prisma errors, upstream SDK errors, bugs) gets a fixed
    // generic message so internals never leak to the client.
    const isKnownSafeError = typeof err.statusCode === 'number' && err.isOperational === true;
    const status = isKnownSafeError ? err.statusCode : 500;
    const message = isKnownSafeError ? err.message : 'Internal Server Error';

    res.status(status).json({
        success: false,
        status,
        message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
};

module.exports = { errorMiddleware };
