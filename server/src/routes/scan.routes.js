const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { runScan } = require('../controllers/scan.controller');

const router = express.Router();

router.post('/', requireAuth, runScan);

module.exports = router;
