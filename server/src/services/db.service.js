const { Pool } = require('pg');
const { env } = require('../config/env');

const pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function createUser(email, passwordHash) {
    const { rows } = await pool.query(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
        [email, passwordHash]
    );
    return rows[0];
}

async function getUserByEmail(email) {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0] || null;
}

async function getUserById(id) {
    const { rows } = await pool.query('SELECT id, email, created_at FROM users WHERE id = $1', [id]);
    return rows[0] || null;
}

async function createProfile(userId, fullName, companyName, companyUrl) {
    const { rows } = await pool.query(
        `INSERT INTO profiles (user_id, full_name, company_name, company_url)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [userId, fullName, companyName, companyUrl]
    );
    return rows[0];
}

async function getProfile(userId) {
    const { rows } = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
    return rows[0] || null;
}

async function getCompetitorForUser(userId) {
    const { rows } = await pool.query('SELECT * FROM competitors WHERE user_id = $1', [userId]);
    return rows[0] || null;
}

async function createCompetitor(userId, name, url) {
    const existing = await getCompetitorForUser(userId);
    if (existing) {
        throw new Error('Limit reached: Single competitor only.');
    }

    const { rows } = await pool.query(
        'INSERT INTO competitors (user_id, name, url) VALUES ($1, $2, $3) RETURNING *',
        [userId, name, url]
    );
    return rows[0];
}

async function updateCompetitor(userId, competitorId, name, url) {
    const { rows: existingRows } = await pool.query(
        'SELECT * FROM competitors WHERE id = $1 AND user_id = $2',
        [competitorId, userId]
    );
    if (!existingRows[0]) {
        throw new Error('Competitor not found or access denied');
    }

    const { rows } = await pool.query(
        'UPDATE competitors SET name = $1, url = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
        [name, url, competitorId, userId]
    );
    return rows[0];
}

async function saveReport(reportData) {
    const { competitor_id, user_id, delta, insight, classification, last_scan_time } = reportData;
    await pool.query(
        `INSERT INTO reports (competitor_id, user_id, delta, insight, classification, last_scan_time)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [competitor_id, user_id, delta, insight, classification, last_scan_time]
    );
}

async function getLatestReport(userId) {
    const { rows } = await pool.query(
        `SELECT r.*, json_build_object('name', c.name, 'url', c.url) AS competitor
         FROM reports r
         JOIN competitors c ON c.id = r.competitor_id
         WHERE r.user_id = $1
         ORDER BY r.last_scan_time DESC
         LIMIT 1`,
        [userId]
    );

    const latestReport = rows[0];
    if (!latestReport) {
        return null;
    }

    const { rows: countRows } = await pool.query(
        'SELECT COUNT(*)::int AS count FROM reports WHERE user_id = $1',
        [userId]
    );

    latestReport.isFirstRun = countRows[0].count === 1;
    return latestReport;
}

module.exports = {
    createUser,
    getUserByEmail,
    getUserById,
    createProfile,
    getProfile,
    getCompetitorForUser,
    saveReport,
    createCompetitor,
    getLatestReport,
    updateCompetitor,
};
