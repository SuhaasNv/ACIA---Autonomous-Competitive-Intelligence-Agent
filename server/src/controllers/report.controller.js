const db = require('../services/db.service');

async function getLatestReportHandler(req, res, next) {
    try {
        const userId = req.user.id;
        const report = await db.getLatestReport(userId);

        if (!report) {
            return res.status(404).json({ error: 'No report found.' });
        }

        return res.status(200).json({
            status: 'success',
            data: report
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { getLatestReportHandler };
