jest.mock('../src/services/email.service', () => ({
    sendVisitRejectedEmail: jest.fn().mockResolvedValue(undefined),
    sendVisitApprovedExistingAccountEmail: jest.fn().mockResolvedValue(undefined),
    sendVisitApprovedNewAccountEmail: jest.fn().mockResolvedValue(undefined),
}));

const bcrypt = require('bcrypt');
const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');
const emailService = require('../src/services/email.service');
const { generateAccessToken } = require('../src/utils/jwt.utils');

const EXISTING_EMAIL = 'jest_visit_existing@example.com';
const NEW_EMAIL = 'jest_visit_new@example.com';
const ADMIN_EMAIL = 'jest_visit_admin@example.com';

let adminToken;

beforeAll(async () => {
    await prisma.user.create({
        data: { name: 'Existing Owner', email: EXISTING_EMAIL, password: 'hash', role: 'business' },
    });
    const admin = await prisma.user.create({
        data: { name: 'Test Admin', email: ADMIN_EMAIL, password: await bcrypt.hash('password123', 10), role: 'admin' },
    });
    adminToken = generateAccessToken(admin);
});

afterAll(async () => {
    const users = await prisma.user.findMany({ where: { email: { in: [EXISTING_EMAIL, NEW_EMAIL, ADMIN_EMAIL] } } });
    await prisma.passwordSetupToken.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
    await prisma.user.deleteMany({ where: { email: { in: [EXISTING_EMAIL, NEW_EMAIL, ADMIN_EMAIL] } } });
    await prisma.visitRequest.deleteMany({ where: { email: { in: [EXISTING_EMAIL, NEW_EMAIL] } } });
    await prisma.$disconnect();
});

afterEach(() => jest.clearAllMocks());

describe('POST /api/visit-requests', () => {
    it('creates a pending visit request from an unauthenticated request', async () => {
        const res = await request(app)
            .post('/api/visit-requests')
            .send({ name: 'Jamie Fox', email: NEW_EMAIL, message: 'I have a 10-space lot' });

        expect(res.status).toBe(201);
        expect(res.body.data.status).toBe('pending');
        expect(res.body.data.email).toBe(NEW_EMAIL);
    });

    it('rejects a payload missing a required field', async () => {
        const res = await request(app).post('/api/visit-requests').send({ email: NEW_EMAIL });
        expect(res.status).toBe(400);
    });
});

describe('GET /api/visit-requests', () => {
    it('is blocked for unauthenticated callers', async () => {
        const res = await request(app).get('/api/visit-requests');
        expect(res.status).toBe(401);
    });

    it('lists requests for an admin', async () => {
        const res = await request(app).get('/api/visit-requests').set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });
});

describe('PUT /api/visit-requests/:id/status', () => {
    it('rejecting sends a decline email and creates no account', async () => {
        const created = await prisma.visitRequest.create({ data: { name: 'Reject Me', email: 'jest_visit_reject@example.com' } });

        const res = await request(app)
            .put(`/api/visit-requests/${created.id}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'rejected' });

        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('rejected');
        expect(emailService.sendVisitRejectedEmail).toHaveBeenCalledWith('jest_visit_reject@example.com', 'Reject Me');

        await prisma.visitRequest.delete({ where: { id: created.id } });
    });

    it('approving for an email that already has an account sends the existing-account email and creates no new user', async () => {
        const created = await prisma.visitRequest.create({ data: { name: 'Existing Owner', email: EXISTING_EMAIL } });
        const usersBefore = await prisma.user.count({ where: { email: EXISTING_EMAIL } });

        const res = await request(app)
            .put(`/api/visit-requests/${created.id}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'approved' });

        expect(res.status).toBe(200);
        expect(emailService.sendVisitApprovedExistingAccountEmail).toHaveBeenCalledWith(EXISTING_EMAIL, 'Existing Owner');
        expect(emailService.sendVisitApprovedNewAccountEmail).not.toHaveBeenCalled();

        const usersAfter = await prisma.user.count({ where: { email: EXISTING_EMAIL } });
        expect(usersAfter).toBe(usersBefore);

        await prisma.visitRequest.delete({ where: { id: created.id } });
    });

    it('approving for a brand-new email creates a business account and a password-setup token, and emails the set-password link', async () => {
        const created = await prisma.visitRequest.create({ data: { name: 'Jamie Fox', email: NEW_EMAIL } });

        const res = await request(app)
            .put(`/api/visit-requests/${created.id}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'approved' });

        expect(res.status).toBe(200);
        expect(emailService.sendVisitApprovedNewAccountEmail).toHaveBeenCalledWith(
            NEW_EMAIL,
            'Jamie Fox',
            expect.stringContaining('/set-password?token=')
        );

        const newUser = await prisma.user.findUnique({ where: { email: NEW_EMAIL } });
        expect(newUser.role).toBe('business');

        const token = await prisma.passwordSetupToken.findFirst({ where: { userId: newUser.id } });
        expect(token).not.toBeNull();
        expect(token.usedAt).toBeNull();
    });

    it('rejects re-deciding an already-resolved request', async () => {
        const created = await prisma.visitRequest.create({
            data: { name: 'Already Done', email: 'jest_visit_done@example.com', status: 'approved' },
        });

        const res = await request(app)
            .put(`/api/visit-requests/${created.id}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'rejected' });

        expect(res.status).toBe(400);

        await prisma.visitRequest.delete({ where: { id: created.id } });
    });
});
