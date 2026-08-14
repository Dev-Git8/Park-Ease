const bcrypt = require('bcrypt');
const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');
const { hashToken } = require('../src/utils/token.utils');

const TEST_EMAIL = 'jest_set_password@example.com';
let userId;

beforeAll(async () => {
    const user = await prisma.user.create({
        data: { name: 'Set Password Test', email: TEST_EMAIL, password: await bcrypt.hash('unusable', 10), role: 'business' },
    });
    userId = user.id;
});

afterAll(async () => {
    await prisma.passwordSetupToken.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
    await prisma.$disconnect();
});

const makeToken = async (overrides = {}) => {
    const rawToken = 'raw-test-token-' + Math.random();
    await prisma.passwordSetupToken.create({
        data: {
            userId,
            tokenHash: hashToken(rawToken),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            ...overrides,
        },
    });
    return rawToken;
};

describe('POST /api/auth/set-password', () => {
    it('sets the password for a valid, unused, unexpired token', async () => {
        const rawToken = await makeToken();

        const res = await request(app).post('/api/auth/set-password').send({ token: rawToken, password: 'brandNewPassword123' });

        expect(res.status).toBe(200);

        const updated = await prisma.user.findUnique({ where: { id: userId } });
        const matches = await bcrypt.compare('brandNewPassword123', updated.password);
        expect(matches).toBe(true);

        const record = await prisma.passwordSetupToken.findUnique({ where: { tokenHash: hashToken(rawToken) } });
        expect(record.usedAt).not.toBeNull();
    });

    it('rejects an already-used token', async () => {
        const rawToken = await makeToken({ usedAt: new Date() });

        const res = await request(app).post('/api/auth/set-password').send({ token: rawToken, password: 'anotherPassword123' });

        expect(res.status).toBe(400);
    });

    it('rejects an expired token', async () => {
        const rawToken = await makeToken({ expiresAt: new Date(Date.now() - 1000) });

        const res = await request(app).post('/api/auth/set-password').send({ token: rawToken, password: 'anotherPassword123' });

        expect(res.status).toBe(400);
    });

    it('rejects an unknown token', async () => {
        const res = await request(app).post('/api/auth/set-password').send({ token: 'never-issued-token', password: 'anotherPassword123' });

        expect(res.status).toBe(400);
    });
});
