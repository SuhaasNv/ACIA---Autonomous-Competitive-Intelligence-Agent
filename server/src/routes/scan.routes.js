const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const rateLimit = require('express-rate-limit');
const { runScan } = require('../controllers/scan.controller');

// Security Hardening: Strict rate limiting for expensive AI scanning operations
const scanLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 AI scans per hour
    message: 'Too many scans initiated from this IP, please try again after an hour'
});

const router = express.Router();

router.post('/', requireAuth, scanLimiter, runScan);

module.exports = router;
