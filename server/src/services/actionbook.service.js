const axios = require('axios');
const { env } = require('../config/env');

const BASE_URL = env.ACTIONBOOK_API_URL || 'https://api.actionbook.dev/v1';
const TIMEOUT_MS = 15000; // 15 second timeout for ActionBook
const NAVIGATION_TIMEOUT_MS = 20000; // 20 second timeout for navigation tasks

/**
 * Extract dynamically rendered HTML from a URL using ActionBook.
 * This is a FALLBACK method - only called when static scraping fails.
 * 
 * Guarantees:
 * - Single request per call (no retries/polling)
 * - Timeout protected
 * - Returns empty string on any failure (never throws to caller)
 * 
 * @param {string} url - The URL to render
 * @returns {Promise<string>} - Rendered HTML or empty string on failure
 */
async function extractDynamicHtml(url) {
    const apiKey = env.ACTIONBOOK_API_KEY;
    
    if (!apiKey) {
        console.warn('[ActionBook] API key not configured - skipping');
        return "";
    }

    if (!url || typeof url !== 'string') {
        console.warn('[ActionBook] Invalid URL provided');
        return "";
    }

    const startTime = Date.now();
    console.log(`[ActionBook] Starting dynamic render for: ${url}`);

    try {
        const response = await axios.post(
            `${BASE_URL}/render`,
            {
                url,
                wait_for_selector: '.pricing, .price, [class*="pricing"], [class*="price"], .tier, .plan',
                timeout: 10000 // ActionBook internal timeout
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: TIMEOUT_MS // Axios request timeout
            }
        );

        const duration = Date.now() - startTime;
        const renderedHtml = response.data?.html || response.data || "";
        
        console.log(`[ActionBook] Completed in ${duration}ms - returned ${renderedHtml.length} bytes`);
        
        return renderedHtml;

    } catch (err) {
        const duration = Date.now() - startTime;
        
        if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
            console.error(`[ActionBook] Timeout after ${duration}ms`);
        } else if (err.response) {
            console.error(`[ActionBook] HTTP ${err.response.status} after ${duration}ms: ${err.response.statusText}`);
        } else {
            console.error(`[ActionBook] Failed after ${duration}ms: ${err.message}`);
        }
        
        // Return empty string - let caller handle fallback
        return "";
    }
}

/**
 * Autonomously navigate from homepage to pricing page and extract HTML.
 * Uses ActionBook's intelligent navigation to find and click pricing links.
 * 
 * Guarantees:
 * - Single navigation attempt (no retries)
 * - Timeout protected
 * - Returns object with { html, pricingUrl } or null on failure
 * 
 * @param {string} homepageUrl - The homepage URL to start from
 * @returns {Promise<{html: string, pricingUrl: string}|null>} - Result or null on failure
 */
async function navigateToPricing(homepageUrl) {
    const apiKey = env.ACTIONBOOK_API_KEY;
    
    if (!apiKey) {
        console.warn('[ActionBook] API key not configured - skipping navigation');
        return null;
    }

    if (!homepageUrl || typeof homepageUrl !== 'string') {
        console.warn('[ActionBook] Invalid homepage URL provided');
        return null;
    }

    const startTime = Date.now();
    console.log(`[ActionBook] 🤖 Agent starting autonomous navigation from: ${homepageUrl}`);
    console.log(`[ActionBook] 🔍 Searching for pricing page link...`);

    try {
        // Use ActionBook's navigate-and-extract capability
        // The agent will intelligently find and click on pricing-related links
        const response = await axios.post(
            `${BASE_URL}/navigate`,
            {
                start_url: homepageUrl,
                goal: 'Find and navigate to the pricing page',
                click_selectors: [
                    // Common pricing link patterns
                    'a[href*="pricing"]',
                    'a[href*="plans"]',
                    'a[href*="price"]',
                    'a:contains("Pricing")',
                    'a:contains("Plans")',
                    'a:contains("Price")',
                    '[data-nav="pricing"]',
                    'nav a[href*="pric"]',
                    'header a[href*="pric"]',
                    '.nav-link[href*="pric"]',
                    // Menu items
                    '[role="menuitem"]:contains("Pricing")',
                    '[role="menuitem"]:contains("Plans")'
                ],
                wait_for_navigation: true,
                wait_for_selector: '.pricing, .price, [class*="pricing"], [class*="price"], .tier, .plan, [class*="plan"]',
                timeout: 15000 // ActionBook internal timeout
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: NAVIGATION_TIMEOUT_MS
            }
        );

        const duration = Date.now() - startTime;
        const result = response.data;
        
        // Extract the rendered HTML and final URL
        const renderedHtml = result?.html || result?.content || "";
        const finalUrl = result?.final_url || result?.url || homepageUrl;
        
        if (renderedHtml && renderedHtml.length > 0) {
            console.log(`[ActionBook] ✅ Agent successfully navigated to pricing page in ${duration}ms`);
            console.log(`[ActionBook] 📍 Final URL: ${finalUrl}`);
            console.log(`[ActionBook] 📄 Retrieved ${renderedHtml.length} bytes of HTML`);
            
            return {
                html: renderedHtml,
                pricingUrl: finalUrl
            };
        }
        
        console.log(`[ActionBook] ⚠️ Agent navigation completed but no HTML returned`);
        return null;

    } catch (err) {
        const duration = Date.now() - startTime;
        
        if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
            console.error(`[ActionBook] ⏱️ Navigation timeout after ${duration}ms`);
        } else if (err.response) {
            console.error(`[ActionBook] ❌ HTTP ${err.response.status} after ${duration}ms: ${err.response.statusText}`);
        } else {
            console.error(`[ActionBook] ❌ Navigation failed after ${duration}ms: ${err.message}`);
        }
        
        return null;
    }
}

module.exports = { extractDynamicHtml, navigateToPricing };
