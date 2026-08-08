require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// 1. Defensive Environment Validation
const REQUIRED_ENV = ["DATABASE_URL", "JWT_SECRET", "REFRESH_TOKEN_SECRET"];
REQUIRED_ENV.forEach((key) => {
    if (!process.env[key]) {
        throw new Error(`Critical Error: ${key} is not defined in .env`);
    }
});

// 2. Setup Driver Adapter (Prisma 7)
// This server's default session timezone isn't UTC (e.g. Asia/Calcutta),
// and raw timestamptz results (via $queryRaw) come back with that offset
// silently dropped instead of converted - NOW() ends up read back as if
// it were 5:30 ahead of real UTC. Every scheduler sweep compares
// timestamps with raw SQL (created_at <= NOW() - INTERVAL ...), so every
// pooled connection is pinned to UTC as a startup option (applied
// atomically as part of connection setup, before Prisma can run anything
// on it - a plain `client.query("SET TIME ZONE ...")` after connecting
// would race with Prisma's own setup query on the same fresh connection).
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    options: '-c TimeZone=UTC',
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// 3. Configuration Object
const config = {
    JWT_SECRET: process.env.JWT_SECRET,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
    PORT: process.env.PORT || 5000,
    DATABASE_URL: process.env.DATABASE_URL
};

// 4. Manual Connection Utility
async function connectDB() {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
}

module.exports = prisma;
module.exports.connectDB = connectDB;
module.exports.config = config;
