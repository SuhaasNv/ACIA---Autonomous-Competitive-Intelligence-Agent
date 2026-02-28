const axios = require('axios');
const { env } = require('../config/env');

const ACTIONBOOK_KEY = env.ACTIONBOOK_API_KEY || 'ak_1aff2e696d0998d1dc9439ab49d51e9ce9443cbcf1daf2a72acc814f23347814';
const BASE_URL = env.ACTIONBOOK_API_URL || 'https://api.actionbook.dev/v1';

async function extractDynamicHtml(url) {
    if (!ACTIONBOOK_KEY) {
        console.warn('[ActionBook] Missing API Key. Returning empty HTML.');
        return "";
    }

    try {
        console.log(`[ActionBook] Elevating context for ${url}`);
        // Send navigation task to retrieve rendered HTML via ActionBook
        const response = await axios.post(`${BASE_URL}/render`, {
            url,
            wait_for_selector: '.pricing-card, [data-test="pricing"], .tier',
            timeout: 10000
        }, {
            headers: { 'Authorization': `Bearer ${ACTIONBOOK_KEY}` }
        });

        // Strict return of the rendered HTML payload block
        const renderedHtml = response.data.html || response.data || "";
        return renderedHtml;
    } catch (err) {
        console.error('[ActionBook Error]', err.message);
        // Return empty string instead of throwing, allowing parser to fail gracefully into 422
        return "";
    }
}

module.exports = { extractDynamicHtml };
