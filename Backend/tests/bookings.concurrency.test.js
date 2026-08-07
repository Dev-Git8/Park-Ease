// Mock the payments module so this test exercises the DB-level FOR UPDATE
// locking + overlap check without depending on a real Razorpay network call.
jest.mock('../src/modules/payments/payments.service', () => ({
    createOrderForBooking: jest.fn().mockResolvedValue({
        orderId: 'order_test',
        amount: 1000,
        currency: 'INR',
        keyId: 'rzp_test_key',
    }),
}));

const prisma = require('../src/config/prisma');
const bookingsService = require('../src/modules/bookings/bookings.service');

const OWNER_EMAIL = 'jest_owner_concurrency@example.com';
const CUSTOMER_EMAIL = 'jest_customer_concurrency@example.com';

let business, slot, customer;

beforeAll(async () => {
    const owner = await prisma.user.create({
        data: { name: 'Owner', email: OWNER_EMAIL, password: 'hash', role: 'business' },
    });
    customer = await prisma.user.create({
        data: { name: 'Customer', email: CUSTOMER_EMAIL, password: 'hash', role: 'customer' },
    });
    business = await prisma.business.create({
        data: { ownerId: owner.id, name: 'Concurrency Test Biz', address: 'Addr', status: 'approved', pricePerHour: 10 },
    });
    slot = await prisma.slot.create({
        data: { businessId: business.id, slotNumber: 'JEST-C1', status: 'available' },
    });
});

afterAll(async () => {
    await prisma.booking.deleteMany({ where: { businessId: business.id } });
    await prisma.slot.deleteMany({ where: { businessId: business.id } });
    await prisma.business.deleteMany({ where: { id: business.id } });
    await prisma.user.deleteMany({ where: { email: { in: [OWNER_EMAIL, CUSTOMER_EMAIL] } } });
    await prisma.$disconnect();
});

describe('createBookingHold - double-booking concurrency regression', () => {
    it('allows exactly one of two simultaneous overlapping requests on the same slot', async () => {
        const start = new Date(Date.now() + 3600000).toISOString();
        const end = new Date(Date.now() + 7200000).toISOString();

        const results = await Promise.allSettled([
            bookingsService.createBookingHold(customer.id, business.id, slot.id, start, end),
            bookingsService.createBookingHold(customer.id, business.id, slot.id, start, end),
        ]);

        const fulfilled = results.filter((r) => r.status === 'fulfilled');
        const rejected = results.filter((r) => r.status === 'rejected');

        expect(fulfilled.length).toBe(1);
        expect(rejected.length).toBe(1);
        expect(rejected[0].reason.message).toBe('Slot is already booked for an overlapping time range');
    });

    it('allows two non-overlapping future bookings on the same slot', async () => {
        const start1 = new Date(Date.now() + 10 * 3600000).toISOString();
        const end1 = new Date(Date.now() + 11 * 3600000).toISOString();
        const start2 = new Date(Date.now() + 12 * 3600000).toISOString();
        const end2 = new Date(Date.now() + 13 * 3600000).toISOString();

        const results = await Promise.allSettled([
            bookingsService.createBookingHold(customer.id, business.id, slot.id, start1, end1),
            bookingsService.createBookingHold(customer.id, business.id, slot.id, start2, end2),
        ]);

        expect(results.every((r) => r.status === 'fulfilled')).toBe(true);
    });
});
