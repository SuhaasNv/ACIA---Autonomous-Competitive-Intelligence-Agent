const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const hpp = require('hpp');
const scanRoutes = require('./routes/scan.routes');

const app = express();

// Security Hardening: Set HTTP headers
app.use(helmet());

// Security Hardening: Rate limiting to prevent brute-force & DDoS
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api', limiter);

app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173'] }));
// Security: limit body payload size to prevent DOS
app.use(express.json({ limit: '10kb' }));

// Security Hardening: Sanitize data against XSS
app.use(xss());

// Security Hardening: Prevent HTTP Parameter Pollution
app.use(hpp());

// Routes
app.use('/api/scan', scanRoutes);
app.use('/api/competitors', require('./routes/competitor.routes'));
app.use('/api/reports', require('./routes/report.routes'));

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[Error]', err.message);
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Internal Server Error'
    });
});

module.exports = app;
