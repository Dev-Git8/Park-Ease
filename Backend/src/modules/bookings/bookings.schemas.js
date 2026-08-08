const { z } = require('zod');

// .strict() is the concrete mechanism enforcing "no client-supplied
// totalPrice": any extra field (including a spoofed totalPrice) is a hard
// 400 here, not silently dropped.
const createBookingSchema = z.object({
    businessId: z.coerce.number().int().positive(),
    slotId: z.coerce.number().int().positive(),
    startTime: z.string().min(1),
    endTime: z.string().min(1),
}).strict();

module.exports = { createBookingSchema };
