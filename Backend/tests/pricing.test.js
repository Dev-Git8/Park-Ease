const { computeBookingPrice, toPaise, computeOverduePenalty } = require('../src/utils/pricing.utils');
const { createBookingSchema } = require('../src/modules/bookings/bookings.schemas');

describe('computeBookingPrice - server-side price recalculation', () => {
    it('computes price from pricePerHour x duration, ignoring anything else', () => {
        const start = new Date('2026-01-01T10:00:00.000Z');
        const end = new Date('2026-01-01T12:30:00.000Z'); // 2.5 hours
        expect(computeBookingPrice(10, start, end)).toBe(25);
    });

    it('rounds to 2 decimal places', () => {
        const start = new Date('2026-01-01T10:00:00.000Z');
        const end = new Date('2026-01-01T10:20:00.000Z'); // 1/3 hour
        expect(computeBookingPrice(9, start, end)).toBe(3);
    });
});

describe('toPaise', () => {
    it('converts a rupee amount to integer paise', () => {
        expect(toPaise(25.5)).toBe(2550);
    });
});

describe('computeOverduePenalty', () => {
    it('is zero when now is before or at endTime', () => {
        const end = new Date('2026-01-01T12:00:00.000Z');
        expect(computeOverduePenalty(10, end, new Date('2026-01-01T11:00:00.000Z'))).toBe(0);
    });

    it('charges the 1.5x hourly rate for time past endTime', () => {
        const end = new Date('2026-01-01T12:00:00.000Z');
        const now = new Date('2026-01-01T13:00:00.000Z'); // 1 hour overdue
        expect(computeOverduePenalty(10, end, now)).toBe(15);
    });
});

describe('createBookingSchema - client-controlled pricing regression', () => {
    it('rejects a client-supplied totalPrice field outright (.strict())', () => {
        const result = createBookingSchema.safeParse({
            businessId: 1,
            slotId: 1,
            startTime: '2026-01-01T10:00:00.000Z',
            endTime: '2026-01-01T11:00:00.000Z',
            totalPrice: 99999,
        });
        expect(result.success).toBe(false);
    });

    it('accepts a well-formed request with no totalPrice', () => {
        const result = createBookingSchema.safeParse({
            businessId: 1,
            slotId: 1,
            startTime: '2026-01-01T10:00:00.000Z',
            endTime: '2026-01-01T11:00:00.000Z',
        });
        expect(result.success).toBe(true);
    });
});
