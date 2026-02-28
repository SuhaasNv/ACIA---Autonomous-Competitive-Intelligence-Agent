const cheerio = require('cheerio');

function parsePricingFromHtml(html) {
    if (!html) return { pricing: [] };

    const $ = cheerio.load(html);
    const pricing = [];

    // Minimal heuristic for hackathon: look for common pricing card classifiers
    const selectors = [
        '.pricing-tier',
        '.pricing-card',
        '[data-test="pricing-card"]',
        '.plan-card',
        '.tier'
    ];

    let foundElements = [];
    for (const sel of selectors) {
        const els = $(sel);
        if (els.length > 0) {
            foundElements = els.toArray();
            break;
        }
    }

    foundElements.forEach(el => {
        const tierName = $(el).find('h3, h2, .tier-name, .plan-name').first().text().trim() || 'Starter';
        const priceText = $(el).find('.price, .amount, h4').text().trim();

        // Extract numeral format like "$29" -> 29
        const priceMatch = priceText.match(/\d+(\.\d{2})?/);
        const price = priceMatch ? parseFloat(priceMatch[0]) : null;

        if (price !== null) {
            pricing.push({ tier: tierName, price });
        }
    });

    // Fallback if no specific cards found (grab the first h tags and amounts closely situated)
    if (pricing.length === 0) {
        // very basic fallback, e.g if there's text "Starter $29"
        const bodyText = $('body').text();
        const fallbackMatch = bodyText.match(/(Starter|Pro|Enterprise|Basic|Premium).*?\$?(\d+)/gi);
        if (fallbackMatch && fallbackMatch.length > 0) {
            fallbackMatch.forEach(match => {
                const tierMatch = match.match(/(Starter|Pro|Enterprise|Basic|Premium)/i);
                const pMatch = match.match(/\d+/);
                if (tierMatch && pMatch) {
                    pricing.push({ tier: tierMatch[0], price: parseFloat(pMatch[0]) });
                }
            });
        }
    }

    // Deduplicate if needed, keep unique tiers
    const uniquePricing = [];
    const seen = new Set();
    for (const p of pricing) {
        if (!seen.has(p.tier)) {
            seen.add(p.tier);
            uniquePricing.push(p);
        }
    }

    return { pricing: uniquePricing };
}

module.exports = { parsePricingFromHtml };
