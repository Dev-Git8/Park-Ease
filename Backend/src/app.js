const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
require('dotenv').config();

const { errorMiddleware } = require('./middlewares/error.middleware');
const { globalLimiter } = require('./middlewares/rateLimit.middleware');

const app = express();

const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no Origin header (server-to-server, curl, mobile apps)
        if (!origin || CORS_ORIGINS.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(hpp());
app.use(cookieParser());
app.use(globalLimiter);

// Razorpay signature verification needs the raw, unparsed body. This MUST
// be registered before the global bodyParser.json() below - middleware
// order is what matters here, not where the route is declared.
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Parking Management API is running' });
});

// Import Routes
const authRoutes = require('./modules/auth/auth.routes');
const businessRoutes = require('./modules/business/business.routes');
const slotsRoutes = require('./modules/slots/slots.routes');
const bookingsRoutes = require('./modules/bookings/bookings.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const paymentsRoutes = require('./modules/payments/payments.routes');
const visitRequestsRoutes = require('./modules/visitRequests/visitRequests.routes');

app.use('/api/auth', authRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/slots', slotsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/visit-requests', visitRequestsRoutes);

// Error Handling Middleware
app.use(errorMiddleware);

module.exports = app;
