const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

const TEST_EMAIL = 'jest_role_escalation_test@example.com';

afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
    await prisma.$disconnect();
});

describe('POST /api/auth/register - role escalation regression', () => {
    it('silently downgrades a self-registered role of "admin" to "customer"', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Would-be Admin',
                email: TEST_EMAIL,
                password: 'password123',
                role: 'admin',
            });

        expect(res.status).toBe(201);
        expect(res.body.data.role).toBe('customer');
        expect(res.body.data.password).toBeUndefined(); // no bcrypt hash leak

        const stored = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
        expect(stored.role).toBe('customer');
    });
});
