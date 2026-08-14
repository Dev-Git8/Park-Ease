const { z } = require('zod');

const createVisitRequestSchema = z.object({
    name: z.string().trim().min(1).max(100),
    email: z.string().trim().email().max(100),
    message: z.string().trim().max(1000).optional(),
}).strict();

module.exports = { createVisitRequestSchema };
