const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { validateCompetitor } = require('../middleware/validator.middleware');
const { createCompetitorHandler, getCompetitorHandler, updateCompetitorHandler } = require('../controllers/competitor.controller');

const router = express.Router();

router.post('/', requireAuth, validateCompetitor, createCompetitorHandler);
router.get('/', requireAuth, getCompetitorHandler);
router.put('/:id', requireAuth, validateCompetitor, updateCompetitorHandler);

module.exports = router;
