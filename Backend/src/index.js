require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initializeSocket } = require('./config/socket');
const { connectRedis } = require('./config/redis');
const { connectDB } = require('./config/prisma');
const { startBookingScheduler } = require('./services/bookingScheduler');
const { startSessionCleanupScheduler } = require('./services/sessionCleanupScheduler');

const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

initializeSocket(server);
connectDB();
connectRedis();
startBookingScheduler();
startSessionCleanupScheduler();

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
