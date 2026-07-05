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

const validateAuth = validate([
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
]);

const validateProfile = validate([
    body('fullName').trim().notEmpty().withMessage('Full name is required').escape(),
    body('companyName').trim().notEmpty().withMessage('Company name is required').escape(),
    body('companyUrl').trim().isURL().withMessage('Valid company URL is required').escape(),
]);

module.exports = { validate, validateCompetitor, validateIdParam, validateAuth, validateProfile };
