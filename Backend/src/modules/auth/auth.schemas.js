const { z } = require('zod');

const registerSchema = z.object({
    name: z.string().trim().min(1).max(100),
    email: z.string().trim().email().max(100),
    password: z.string().min(8).max(100),
    // Deliberately not a strict enum: the controller already whitelists
    // role to customer/business and silently downgrades anything else
    // (logging a probe warning) rather than rejecting the request outright.
    // This schema's job is just to validate shape, not re-decide that policy.
    role: z.string().optional(),
}).strict();

const loginSchema = z.object({
    email: z.string().trim().email().max(100),
    password: z.string().min(1),
}).strict();

module.exports = { registerSchema, loginSchema };
