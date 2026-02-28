const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { getLatestReportHandler } = require('../controllers/report.controller');

const router = express.Router();

router.get('/latest', requireAuth, getLatestReportHandler);

module.exports = router;
