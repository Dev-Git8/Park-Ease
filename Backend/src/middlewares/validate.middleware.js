const { ZodError } = require('zod');

// Generic validate(schema, source) factory - parses req[source] and replaces
// it with the parsed (type-coerced, stripped) result so controllers can
// trust it downstream.
const validate = (schema, source = 'body') => (req, res, next) => {
    try {
        req[source] = schema.parse(req[source]);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: error.issues.map((issue) => ({
                    path: issue.path.join('.'),
                    message: issue.message,
                })),
            });
        }
        next(error);
    }
};

module.exports = { validate };
