// Load env variables from multiple possible locations
const path = require('path');

// Try server/.env first, then root .env
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const env = {
    PORT: process.env.PORT || 3001,
    NODE_ENV: process.env.NODE_ENV || 'development',
    SUPABASE_URL: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    BRIGHTDATA_MCP_TOKEN: process.env.BRIGHTDATA_MCP_TOKEN,
    BRIGHTDATA_PROXY_HOST: process.env.BRIGHTDATA_PROXY_HOST,
    BRIGHTDATA_PROXY_PORT: process.env.BRIGHTDATA_PROXY_PORT || 22225,
    BRIGHTDATA_USERNAME: process.env.BRIGHTDATA_USERNAME,
    BRIGHTDATA_PASSWORD: process.env.BRIGHTDATA_PASSWORD,
    ACTIONBOOK_API_URL: process.env.ACTIONBOOK_API_URL || 'https://api.actionbook.dev/v1',
    ACTIONBOOK_API_KEY: process.env.ACTIONBOOK_API_KEY,
    ACONTEXT_API_URL: process.env.ACONTEXT_API_URL || 'https://api.acontext.ai/v1',
    ACONTEXT_API_KEY: process.env.ACONTEXT_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
};

module.exports = { env };
