const authService = require('./auth.service');
const { generateAccessToken, generateRefreshToken } = require('../../utils/jwt.utils');
const bcrypt = require('bcrypt');

const ALLOWED_SELF_REGISTER_ROLES = ['customer', 'business'];

const register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        let safeRole = 'customer';
        if (ALLOWED_SELF_REGISTER_ROLES.includes(role)) {
            safeRole = role;
        } else if (role) {
            console.warn(`[auth] Registration attempted with disallowed role "${role}" from IP ${req.ip}`);
        }

        const existingUser = await authService.findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const user = await authService.createUser(name, email, password, safeRole);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: user
        });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await authService.findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        await authService.createSession(
            user.id, 
            refreshToken, 
            req.headers['user-agent'], 
            req.ip
        );

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                accessToken
            }
        });
    } catch (error) {
        next(error);
    }
};

const refresh = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ success: false, message: 'Refresh token missing' });
        }

        const session = await authService.validateSession(refreshToken);
        if (!session) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }

        const user = session.user;

        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        // Rotate on every refresh: the old token is deleted and replaced,
        // so a stolen refresh token is only ever usable once.
        await authService.rotateSession(
            refreshToken,
            newRefreshToken,
            user.id,
            req.headers['user-agent'],
            req.ip
        );

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({
            success: true,
            accessToken: newAccessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(403).json({ success: false, message: 'Invalid refresh token' });
    }
};


const logout = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            await authService.deleteSession(refreshToken);
        }

        res.clearCookie('refreshToken');
        res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
};

const setPassword = async (req, res, next) => {
    try {
        const { token, password } = req.body;
        const ok = await authService.setPasswordViaToken(token, password);

        if (!ok) {
            return res.status(400).json({ success: false, message: 'This link is invalid or has expired.' });
        }

        res.status(200).json({ success: true, message: 'Password set successfully. You can now log in.' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    refresh,
    logout,
    setPassword,
};
