const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { createCompetitorHandler, getCompetitorHandler, updateCompetitorHandler } = require('../controllers/competitor.controller');

const router = express.Router();

router.post('/', requireAuth, createCompetitorHandler);
router.get('/', requireAuth, getCompetitorHandler);
router.put('/:id', requireAuth, updateCompetitorHandler);

module.exports = router;
