const { z } = require('zod');

const verifyPaymentSchema = z.object({
    orderId: z.string().min(1),
    paymentId: z.string().min(1),
    signature: z.string().min(1),
}).strict();

module.exports = { verifyPaymentSchema };
