const prisma = require('../src/config/prisma');
const bookingsService = require('../src/modules/bookings/bookings.service');

const OWNER_A_EMAIL = 'jest_owner_a@example.com';
const OWNER_B_EMAIL = 'jest_owner_b@example.com';
const CUSTOMER_EMAIL = 'jest_customer_ownership@example.com';

let businessA, ownerB, customer;

beforeAll(async () => {
    const ownerA = await prisma.user.create({
        data: { name: 'Owner A', email: OWNER_A_EMAIL, password: 'hash', role: 'business' },
    });
    ownerB = await prisma.user.create({
        data: { name: 'Owner B', email: OWNER_B_EMAIL, password: 'hash', role: 'business' },
    });
    customer = await prisma.user.create({
        data: { name: 'Customer', email: CUSTOMER_EMAIL, password: 'hash', role: 'customer' },
    });

    businessA = await prisma.business.create({
        data: { ownerId: ownerA.id, name: 'Business A', address: 'Addr A', status: 'approved', pricePerHour: 5 },
    });

    const slotA = await prisma.slot.create({
        data: { businessId: businessA.id, slotNumber: 'JEST-A1', status: 'available' },
    });

    await prisma.booking.create({
        data: {
            userId: customer.id,
            businessId: businessA.id,
            slotId: slotA.id,
            startTime: new Date(Date.now() + 3600000),
            endTime: new Date(Date.now() + 7200000),
            totalPrice: 5,
            status: 'booked',
        },
    });
});

afterAll(async () => {
    await prisma.booking.deleteMany({ where: { businessId: businessA.id } });
    await prisma.slot.deleteMany({ where: { businessId: businessA.id } });
    await prisma.business.deleteMany({ where: { id: businessA.id } });
    await prisma.user.deleteMany({
        where: { email: { in: [OWNER_A_EMAIL, OWNER_B_EMAIL, CUSTOMER_EMAIL] } },
    });
    await prisma.$disconnect();
});

describe('getBookingsByBusiness - ownership leak regression', () => {
    it('rejects a different business owner requesting another business\'s bookings', async () => {
        await expect(
            bookingsService.getBookingsByBusiness(businessA.id, ownerB.id)
        ).rejects.toThrow('Unauthorized');
    });

    it('returns bookings (including customer PII) to the actual owner', async () => {
        const ownerA = await prisma.user.findUnique({ where: { email: OWNER_A_EMAIL } });
        const bookings = await bookingsService.getBookingsByBusiness(businessA.id, ownerA.id);

        expect(bookings.length).toBe(1);
        expect(bookings[0].user.email).toBe(CUSTOMER_EMAIL);
    });

    it('404s for a business that does not exist', async () => {
        await expect(
            bookingsService.getBookingsByBusiness(999999999, ownerB.id)
        ).rejects.toThrow('Business not found');
    });
});
