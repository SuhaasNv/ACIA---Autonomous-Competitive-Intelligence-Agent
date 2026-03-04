const { body, validationResult } = require('express-validator');

// Create a generic validation handler
const validate = (validations) => {
    return async (req, res, next) => {
        // execute all validations
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        const msg = errors.array().map(e => e.msg).join('; ') || 'Validation failed';
        res.status(400).json({ status: 'error', error: msg, errors: errors.array() });
    };
};

const validateCompetitor = validate([
    body('name').trim().notEmpty().withMessage('Name is required').escape(),
    body('url').trim().isURL().withMessage('Valid URL is required').escape(),
]);

const validateIdParam = validate([
    // If you need path param validations
]);

module.exports = { validate, validateCompetitor, validateIdParam };
