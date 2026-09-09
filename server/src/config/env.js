// Load env variables from multiple possible locations
const path = require('path');

// Try server/.env first, then root .env
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const trim = (v) => (typeof v === 'string' ? v.trim() : v);

const env = {
    PORT: process.env.PORT || 3001,
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATABASE_URL: trim(process.env.DATABASE_URL),
    JWT_SECRET: trim(process.env.JWT_SECRET),
    BRIGHTDATA_MCP_TOKEN: process.env.BRIGHTDATA_MCP_TOKEN,
    BRIGHTDATA_MCP_URL: process.env.BRIGHTDATA_MCP_URL,
    BRIGHTDATA_PROXY_HOST: process.env.BRIGHTDATA_PROXY_HOST,
    BRIGHTDATA_PROXY_PORT: process.env.BRIGHTDATA_PROXY_PORT || 22225,
    BRIGHTDATA_USERNAME: process.env.BRIGHTDATA_USERNAME,
    BRIGHTDATA_PASSWORD: process.env.BRIGHTDATA_PASSWORD,
    ACTIONBOOK_API_URL: process.env.ACTIONBOOK_API_URL || 'https://api.actionbook.dev/v1',
    ACTIONBOOK_API_KEY: process.env.ACTIONBOOK_API_KEY,
    ACONTEXT_API_URL: process.env.ACONTEXT_API_URL || 'https://api.acontext.ai/v1',
    ACONTEXT_API_KEY: process.env.ACONTEXT_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_FROM: process.env.SMTP_FROM,
    FRONTEND_URL: process.env.FRONTEND_URL,
};

if (!env.DATABASE_URL) {
    console.warn('[Config] DATABASE_URL not set. Database calls will fail until it is configured.');
}
if (!env.JWT_SECRET) {
    console.warn('[Config] JWT_SECRET not set. Set a strong secret in Railway Variables before going to production.');
}

module.exports = { env };
