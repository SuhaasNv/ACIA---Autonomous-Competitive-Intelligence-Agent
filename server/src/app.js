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

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    process.env.FRONTEND_URL,
    /\.vercel\.app$/, // Vercel preview deployments
].filter(Boolean);
app.use(cors({
    origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        const allowed = allowedOrigins.some(o =>
            typeof o === 'string' ? o === origin : o.test(origin)
        );
        cb(null, allowed ? origin : false);
    }
}));
// Security: limit body payload size to prevent DOS
app.use(express.json({ limit: '10kb' }));

// Security Hardening: Sanitize data against XSS
app.use(xss());

// Security Hardening: Prevent HTTP Parameter Pollution
app.use(hpp());

// Health check (no auth required)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
            api: 'running'
        }
    });
});

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
