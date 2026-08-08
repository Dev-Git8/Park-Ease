const { z } = require('zod');

const registerBusinessSchema = z.object({
    name: z.string().trim().min(1).max(100),
    address: z.string().trim().min(1),
    totalSlots: z.coerce.number().int().min(0).optional(),
    price: z.coerce.number().positive(),
}).strict();

const updateBusinessSchema = z.object({
    name: z.string().trim().min(1).max(100).optional(),
    address: z.string().trim().min(1).optional(),
    totalSlots: z.coerce.number().int().min(0).optional(),
    price: z.coerce.number().positive().optional(),
}).strict();

module.exports = { registerBusinessSchema, updateBusinessSchema };
