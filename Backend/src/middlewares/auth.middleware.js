const { verifyAccessToken } = require('../utils/jwt.utils');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Authorization token missing' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyAccessToken(token);
        
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};

const roleMiddleware = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Forbidden: Only ${roles.join(' or ')} can access this resource`
            });
        }
        next();
    };
};

module.exports = { authMiddleware, roleMiddleware };
