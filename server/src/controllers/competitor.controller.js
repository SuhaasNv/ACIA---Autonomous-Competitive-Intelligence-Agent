const supabaseService = require('../services/supabase.service');

async function createCompetitorHandler(req, res, next) {
    try {
        const userId = req.user.id;
        const { name, url } = req.body;

        if (!name || !url) {
            return res.status(400).json({ error: 'Name and url are required' });
        }

        const data = await supabaseService.createCompetitor(userId, name, url);

        return res.status(201).json({
            status: 'success',
            data
        });
    } catch (error) {
        if (error.message.includes('Limit reached')) {
            return res.status(403).json({ error: error.message });
        }
        next(error);
    }
}
async function getCompetitorHandler(req, res, next) {
    try {
        const userId = req.user.id;
        const competitor = await supabaseService.getCompetitorForUser(userId);
        if (!competitor) {
            return res.status(404).json({ error: 'No competitor configured' });
        }
        return res.status(200).json({ status: 'success', data: competitor });
    } catch (error) {
        next(error);
    }
}

async function updateCompetitorHandler(req, res, next) {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { name, url } = req.body;

        if (!name || !url) {
            return res.status(400).json({ error: 'Name and url are required' });
        }

        const data = await supabaseService.updateCompetitor(userId, id, name, url);

        return res.status(200).json({
            status: 'success',
            data
        });
    } catch (error) {
        if (error.message.includes('not found') || error.message.includes('access denied')) {
            return res.status(404).json({ error: error.message });
        }
        next(error);
    }
}

module.exports = { createCompetitorHandler, getCompetitorHandler, updateCompetitorHandler };
