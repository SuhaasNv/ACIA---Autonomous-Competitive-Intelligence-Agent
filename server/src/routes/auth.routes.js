const express = require('express');
const rateLimit = require('express-rate-limit');
const { requireAuth } = require('../middleware/auth.middleware');
const { validateAuth } = require('../middleware/validator.middleware');
const { registerHandler, loginHandler, meHandler } = require('../controllers/auth.controller');

const router = express.Router();

// Security Hardening: aggressive rate limit on auth routes to slow brute-force/credential-stuffing
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Too many auth requests from this IP, please try again later',
});

router.post('/register', authLimiter, validateAuth, registerHandler);
router.post('/login', authLimiter, validateAuth, loginHandler);
router.get('/me', requireAuth, meHandler);

module.exports = router;
