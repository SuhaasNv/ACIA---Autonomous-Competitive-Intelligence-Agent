const express = require('express');
const cors = require('cors');
const scanRoutes = require('./routes/scan.routes');

const app = express();

app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173'] }));
app.use(express.json());

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
