const EventSource = require("eventsource");
const axios = require('axios');
const { env } = require('../config/env');

global.EventSource = EventSource;

const TIMEOUT_MS = 30000; // 30 second timeout
const MAX_RETRIES = 2;

/**
 * Validate URL format
 */
function isValidUrl(urlString) {
    try {
        const url = new URL(urlString);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create axios instance with robust configuration
 */
function createAxiosClient() {
    return axios.create({
        timeout: TIMEOUT_MS,
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 400,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0',
        }
    });
}

/**
 * Strategy 1: Bright Data MCP
 */
async function fetchViaMcp(url) {
    const token = env.BRIGHTDATA_MCP_TOKEN;
    if (!token) {
        throw new Error('BRIGHTDATA_MCP_TOKEN not configured');
    }

    const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
    const { SSEClientTransport } = await import("@modelcontextprotocol/sdk/client/sse.js");

    const sseUrl = new URL(`https://mcp.brightdata.com/sse?token=${token}&groups=advanced_scraping,business`);
    const transport = new SSEClientTransport(sseUrl);
    const client = new Client({ name: "acia-server", version: "1.0.0" }, { capabilities: {} });

    // Wrap connection in timeout
    const connectPromise = client.connect(transport);
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('MCP connection timeout')), TIMEOUT_MS)
    );

    await Promise.race([connectPromise, timeoutPromise]);

    console.log(`[BrightData] Fetching HTML for ${url} via MCP`);

    const result = await client.callTool({
        name: "scrape_as_html",
        arguments: { url }
    });

    // Clean up connection
    try { await transport.close(); } catch { /* ignore */ }

    const htmlContent = result?.content?.[0]?.text;

    if (!htmlContent) {
        throw new Error('MCP returned empty content');
    }

    // Only check for specific MCP failure messages, not generic "error" word
    if (htmlContent.includes("execution failed") || 
        htmlContent.includes("scraping failed") ||
        htmlContent.includes("Unable to scrape")) {
        throw new Error('MCP scraping execution failed');
    }

    return htmlContent;
}

/**
 * Strategy 2: Bright Data Proxy (if configured)
 * Note: Requires https-proxy-agent package if you want to use this
 */
async function fetchViaBrightDataProxy(url) {
    const { BRIGHTDATA_PROXY_HOST, BRIGHTDATA_USERNAME, BRIGHTDATA_PASSWORD, BRIGHTDATA_PROXY_PORT } = env;

    if (!BRIGHTDATA_PROXY_HOST || !BRIGHTDATA_USERNAME || !BRIGHTDATA_PASSWORD) {
        throw new Error('BrightData proxy credentials not configured');
    }

    // Try to load https-proxy-agent dynamically
    let HttpsProxyAgent;
    try {
        HttpsProxyAgent = require('https-proxy-agent').HttpsProxyAgent;
    } catch {
        throw new Error('https-proxy-agent package not installed');
    }

    const proxyUrl = `http://${BRIGHTDATA_USERNAME}:${BRIGHTDATA_PASSWORD}@${BRIGHTDATA_PROXY_HOST}:${BRIGHTDATA_PROXY_PORT}`;

    console.log(`[BrightData] Fetching via proxy for ${url}`);

    const response = await axios.get(url, {
        timeout: TIMEOUT_MS,
        proxy: false,
        httpsAgent: new HttpsProxyAgent(proxyUrl),
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }
    });

    return response.data;
}

/**
 * Strategy 3: Direct axios fetch with robust headers
 */
async function fetchViaAxios(url) {
    console.log(`[BrightData] Fetching via direct axios for ${url}`);
    const client = createAxiosClient();
    const response = await client.get(url);
    return response.data;
}

/**
 * Main fetch function with multiple fallback strategies
 */
async function fetchCompetitorPage(url) {
    // Validate URL first
    if (!url || typeof url !== 'string') {
        throw new Error('Invalid URL: URL is required');
    }

    if (!isValidUrl(url)) {
        throw new Error(`Invalid URL format: ${url}`);
    }

    const strategies = [
        { name: 'MCP', fn: fetchViaMcp },
        { name: 'BrightData Proxy', fn: fetchViaBrightDataProxy },
        { name: 'Direct Axios', fn: fetchViaAxios },
    ];

    const errors = [];

    for (const strategy of strategies) {
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                console.log(`[BrightData] Trying ${strategy.name} (attempt ${attempt}/${MAX_RETRIES})...`);
                const html = await strategy.fn(url);

                // Validate we got actual HTML content
                if (html && typeof html === 'string' && html.length > 100) {
                    console.log(`[BrightData] Success via ${strategy.name}`);
                    return html;
                }

                throw new Error('Response too short or invalid');
            } catch (error) {
                const errorMsg = `${strategy.name} attempt ${attempt}: ${error.message}`;
                console.warn(`[BrightData] ${errorMsg}`);
                errors.push(errorMsg);

                // Wait before retry (exponential backoff)
                if (attempt < MAX_RETRIES) {
                    await sleep(1000 * attempt);
                }
            }
        }
    }

    // All strategies failed - throw comprehensive error
    const errorSummary = errors.join('; ');
    console.error(`[BrightData] All fetch strategies failed for ${url}`);
    throw new Error(`Failed to fetch competitor page. Tried: ${errorSummary}`);
}

module.exports = { fetchCompetitorPage };
