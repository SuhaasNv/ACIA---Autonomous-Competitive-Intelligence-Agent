const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const rateLimit = require('express-rate-limit');
const { runScan } = require('../controllers/scan.controller');

// Security Hardening: Rate limiting for AI scanning (relaxed for demo: 20/hour)
const scanLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: process.env.DEMO_MODE === 'true' ? 50 : 20,
    message: 'Too many scans initiated from this IP, please try again after an hour'
});

const router = express.Router();

router.post('/', requireAuth, scanLimiter, runScan);

module.exports = router;
