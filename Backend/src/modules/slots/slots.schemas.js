const { z } = require('zod');

const addSlotsSchema = z.object({
    businessId: z.coerce.number().int().positive(),
    slotNumbers: z.array(z.string().trim().min(1).max(10)).min(1),
}).strict();

module.exports = { addSlotsSchema };
