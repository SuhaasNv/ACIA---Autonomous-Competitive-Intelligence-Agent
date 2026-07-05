const db = require('../services/db.service');

async function createProfileHandler(req, res, next) {
    try {
        const userId = req.user.id;
        const { fullName, companyName, companyUrl } = req.body;

        if (!fullName || !companyName || !companyUrl) {
            return res.status(400).json({ error: 'fullName, companyName and companyUrl are required' });
        }

        const existing = await db.getProfile(userId);
        if (existing) {
            return res.status(409).json({ error: 'Profile already exists' });
        }

        const profile = await db.createProfile(userId, fullName, companyName, companyUrl);
        return res.status(201).json({ status: 'success', data: profile });
    } catch (error) {
        next(error);
    }
}

async function getProfileHandler(req, res, next) {
    try {
        const profile = await db.getProfile(req.user.id);
        if (!profile) {
            return res.status(404).json({ error: 'No profile found' });
        }
        return res.status(200).json({ status: 'success', data: profile });
    } catch (error) {
        next(error);
    }
}

module.exports = { createProfileHandler, getProfileHandler };
