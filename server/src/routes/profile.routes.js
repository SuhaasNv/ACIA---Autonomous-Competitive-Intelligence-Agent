const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { validateProfile } = require('../middleware/validator.middleware');
const { createProfileHandler, getProfileHandler } = require('../controllers/profile.controller');

const router = express.Router();

router.post('/', requireAuth, validateProfile, createProfileHandler);
router.get('/', requireAuth, getProfileHandler);

module.exports = router;
