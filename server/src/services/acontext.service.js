const axios = require('axios');
const { env } = require('../config/env');

const ACONTEXT_KEY = env.ACONTEXT_API_KEY || 'sk-ac-pqlj3jgRV_KDktN2bspTc8bO1H-KXWP2uJGDGoaibgA';
const BASE_URL = env.ACONTEXT_API_URL || 'https://api.acontext.dev/v1';
const HEADERS = ACONTEXT_KEY ? { 'Authorization': `Bearer ${ACONTEXT_KEY}` } : {};

function getKey(userId) {
    return `competitor:${userId}:latest_snapshot`;
}

// Minimal in-memory fallback for deterministic execution in edge cases
const localMemoryFallback = new Map();

async function getLatestSnapshot(userId) {
    try {
        if (!ACONTEXT_KEY) {
            console.warn('[Acontext] Missing API Key. Using local process memory.');
            return localMemoryFallback.get(getKey(userId)) || null;
        }

        const res = await axios.get(`${BASE_URL}/memory/${getKey(userId)}`, { headers: HEADERS });
        return res.data.value; // Returns structural parsed JSON obj from memory
    } catch (err) {
        if (err.response && err.response.status === 404) return null; // 404 is valid first run
        console.error('[Acontext Get Error]', err.message);
        return localMemoryFallback.get(getKey(userId)) || null; // degrade gracefully to local map
    }
}

async function setLatestSnapshot(userId, snapshotData) {
    try {
        localMemoryFallback.set(getKey(userId), snapshotData);

        if (!ACONTEXT_KEY) return;

        await axios.post(`${BASE_URL}/memory`, {
            key: getKey(userId),
            value: snapshotData
        }, { headers: HEADERS });
    } catch (err) {
        console.error('[Acontext Set Error]', err.message);
    }
}

module.exports = { getLatestSnapshot, setLatestSnapshot };
