const cheerio = require('cheerio');

/**
 * Intelligent multi-strategy pricing parser
 * Attempts multiple extraction strategies to find accurate pricing data
 */
function parsePricingFromHtml(html) {
    if (!html) return { pricing: [] };

    const $ = cheerio.load(html);
    let pricing = [];

    console.log('[Parser] Starting intelligent pricing extraction...');

    // Strategy 1: Find pricing cards/containers with expanded selectors
    pricing = extractFromPricingCards($);
    if (pricing.length >= 2) {
        console.log(`[Parser] Strategy 1 (Pricing Cards): Found ${pricing.length} tiers`);
        return { pricing: deduplicatePricing(pricing) };
    }

    // Strategy 2: Find grid/flex containers with multiple pricing items
    pricing = extractFromGridContainers($);
    if (pricing.length >= 2) {
        console.log(`[Parser] Strategy 2 (Grid Containers): Found ${pricing.length} tiers`);
        return { pricing: deduplicatePricing(pricing) };
    }

    // Strategy 3: Find sibling elements with tier names and prices
    pricing = extractFromSiblingElements($);
    if (pricing.length >= 2) {
        console.log(`[Parser] Strategy 3 (Sibling Elements): Found ${pricing.length} tiers`);
        return { pricing: deduplicatePricing(pricing) };
    }

    // Strategy 4: Pattern-based extraction from structured text
    pricing = extractFromStructuredText($);
    if (pricing.length >= 2) {
        console.log(`[Parser] Strategy 4 (Structured Text): Found ${pricing.length} tiers`);
        return { pricing: deduplicatePricing(pricing) };
    }

    // Strategy 5: Full page regex scan for tier-price patterns
    pricing = extractFromPageText($);
    if (pricing.length >= 1) {
        console.log(`[Parser] Strategy 5 (Page Text): Found ${pricing.length} tiers`);
        return { pricing: deduplicatePricing(pricing) };
    }

    console.log('[Parser] All strategies exhausted - no pricing found');
    return { pricing: [] };
}

/**
 * Strategy 1: Extract from common pricing card patterns
 */
function extractFromPricingCards($) {
    const pricing = [];
    
    // Expanded list of common pricing card selectors
    const cardSelectors = [
        // Class-based
        '[class*="pricing"]',
        '[class*="plan"]',
        '[class*="tier"]',
        '[class*="package"]',
        '[class*="subscription"]',
        '[class*="price-card"]',
        '[class*="priceCard"]',
        // Data attributes
        '[data-pricing]',
        '[data-plan]',
        '[data-tier]',
        // Common component patterns
        '.card',
        '.pricing-table > *',
        '.plans > *',
        '.tiers > *'
    ];

    for (const selector of cardSelectors) {
        const cards = $(selector);
        if (cards.length >= 2) {
            cards.each((_, card) => {
                const result = extractTierAndPriceFromElement($, card);
                if (result) {
                    pricing.push(result);
                }
            });
            
            if (pricing.length >= 2) {
                return pricing;
            }
        }
    }

    return pricing;
}

/**
 * Strategy 2: Find grid/flex containers that hold pricing items
 */
function extractFromGridContainers($) {
    const pricing = [];
    
    // Look for containers with multiple children that might be pricing cards
    const containerSelectors = [
        'main',
        'section',
        '[class*="container"]',
        '[class*="wrapper"]',
        '[class*="grid"]',
        '[class*="flex"]',
        '[class*="row"]',
        '[class*="cards"]'
    ];

    for (const selector of containerSelectors) {
        $(selector).each((_, container) => {
            const children = $(container).children();
            
            // Look for containers with 2-5 similar children (typical pricing layout)
            if (children.length >= 2 && children.length <= 6) {
                const tempPricing = [];
                
                children.each((_, child) => {
                    const result = extractTierAndPriceFromElement($, child);
                    if (result) {
                        tempPricing.push(result);
                    }
                });
                
                // If we found multiple tiers in this container, use them
                if (tempPricing.length >= 2) {
                    pricing.push(...tempPricing);
                    return false; // break .each loop
                }
            }
        });
        
        if (pricing.length >= 2) {
            return pricing;
        }
    }

    return pricing;
}

/**
 * Strategy 3: Find sibling elements containing tier names followed by prices
 */
function extractFromSiblingElements($) {
    const pricing = [];
    const tierNames = ['starter', 'pro', 'enterprise', 'basic', 'premium', 'free', 'business', 'team', 'individual', 'professional', 'plus', 'growth'];
    
    // Find all text nodes containing tier names
    tierNames.forEach(tierName => {
        $('*').each((_, el) => {
            const text = $(el).clone().children().remove().end().text().trim().toLowerCase();
            
            if (text === tierName || text.includes(tierName)) {
                // Look for price in parent or nearby siblings
                const parent = $(el).parent();
                const parentText = parent.text();
                const priceMatch = parentText.match(/\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/);
                
                if (priceMatch) {
                    const price = parseFloat(priceMatch[1].replace(',', ''));
                    if (price > 0 && price < 10000) { // Sanity check
                        const displayName = tierName.charAt(0).toUpperCase() + tierName.slice(1);
                        pricing.push({ tier: displayName, price });
                    }
                }
            }
        });
    });

    return pricing;
}

/**
 * Strategy 4: Extract from structured text patterns
 */
function extractFromStructuredText($) {
    const pricing = [];
    
    // Find elements that look like they contain both tier name and price
    $('div, section, article, li').each((_, el) => {
        const text = $(el).text().trim();
        
        // Skip if too long (probably a container)
        if (text.length > 500) return;
        
        // Look for patterns like "Starter $29" or "$29/month" near "Pro"
        const tierMatch = text.match(/\b(Starter|Pro|Enterprise|Basic|Premium|Free|Business|Team|Professional|Plus|Growth|Individual)\b/i);
        const priceMatch = text.match(/\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/);
        
        if (tierMatch && priceMatch) {
            const tier = tierMatch[1];
            const price = parseFloat(priceMatch[1].replace(',', ''));
            
            // Validate price is reasonable
            if (price > 0 && price < 10000) {
                pricing.push({ tier, price });
            }
        }
    });

    return pricing;
}

/**
 * Strategy 5: Full page text regex extraction
 */
function extractFromPageText($) {
    const pricing = [];
    const bodyText = $('body').text();
    
    // Common tier names to look for
    const tierPatterns = [
        { name: 'Starter', regex: /Starter[^$]*?\$\s*(\d+(?:\.\d{2})?)/i },
        { name: 'Pro', regex: /\bPro\b[^$]*?\$\s*(\d+(?:\.\d{2})?)/i },
        { name: 'Enterprise', regex: /Enterprise[^$]*?\$\s*(\d+(?:\.\d{2})?)/i },
        { name: 'Basic', regex: /Basic[^$]*?\$\s*(\d+(?:\.\d{2})?)/i },
        { name: 'Premium', regex: /Premium[^$]*?\$\s*(\d+(?:\.\d{2})?)/i },
        { name: 'Free', regex: /\bFree\b[^$]*?\$\s*(\d+(?:\.\d{2})?)/i },
        { name: 'Business', regex: /Business[^$]*?\$\s*(\d+(?:\.\d{2})?)/i },
        { name: 'Team', regex: /\bTeam\b[^$]*?\$\s*(\d+(?:\.\d{2})?)/i },
        { name: 'Professional', regex: /Professional[^$]*?\$\s*(\d+(?:\.\d{2})?)/i },
        { name: 'Plus', regex: /\bPlus\b[^$]*?\$\s*(\d+(?:\.\d{2})?)/i },
        { name: 'Growth', regex: /Growth[^$]*?\$\s*(\d+(?:\.\d{2})?)/i }
    ];

    // Also try reverse pattern: $XX ... TierName
    const reverseTierPatterns = [
        { name: 'Starter', regex: /\$\s*(\d+(?:\.\d{2})?)[^a-z]*Starter/i },
        { name: 'Pro', regex: /\$\s*(\d+(?:\.\d{2})?)[^a-z]*\bPro\b/i },
        { name: 'Enterprise', regex: /\$\s*(\d+(?:\.\d{2})?)[^a-z]*Enterprise/i },
        { name: 'Basic', regex: /\$\s*(\d+(?:\.\d{2})?)[^a-z]*Basic/i },
        { name: 'Premium', regex: /\$\s*(\d+(?:\.\d{2})?)[^a-z]*Premium/i },
    ];

    // Try forward patterns first
    for (const pattern of tierPatterns) {
        const match = bodyText.match(pattern.regex);
        if (match) {
            const price = parseFloat(match[1]);
            if (price > 0 && price < 10000) {
                pricing.push({ tier: pattern.name, price });
            }
        }
    }

    // If not enough found, try reverse patterns
    if (pricing.length < 2) {
        for (const pattern of reverseTierPatterns) {
            const match = bodyText.match(pattern.regex);
            if (match && !pricing.find(p => p.tier === pattern.name)) {
                const price = parseFloat(match[1]);
                if (price > 0 && price < 10000) {
                    pricing.push({ tier: pattern.name, price });
                }
            }
        }
    }

    return pricing;
}

/**
 * Extract tier name and price from a single element
 */
function extractTierAndPriceFromElement($, element) {
    const el = $(element);
    const fullText = el.text().trim();
    
    // Skip if element is too large (probably a container)
    if (fullText.length > 1000) return null;
    
    // Try to find tier name
    let tierName = null;
    const tierPatterns = ['starter', 'pro', 'enterprise', 'basic', 'premium', 'free', 'business', 'team', 'professional', 'plus', 'growth', 'individual'];
    
    // First try to find tier name in headings
    const headingText = el.find('h1, h2, h3, h4, h5, h6, [class*="title"], [class*="name"], [class*="heading"]').first().text().trim().toLowerCase();
    
    for (const pattern of tierPatterns) {
        if (headingText.includes(pattern)) {
            tierName = pattern.charAt(0).toUpperCase() + pattern.slice(1);
            break;
        }
    }
    
    // If not found in heading, search full text
    if (!tierName) {
        for (const pattern of tierPatterns) {
            if (fullText.toLowerCase().includes(pattern)) {
                tierName = pattern.charAt(0).toUpperCase() + pattern.slice(1);
                break;
            }
        }
    }
    
    // Find price - look for $XX pattern
    let price = null;
    
    // First try specific price containers
    const priceEl = el.find('[class*="price"], [class*="amount"], [class*="cost"]').first();
    let priceText = priceEl.length ? priceEl.text() : fullText;
    
    // Extract price with $ symbol
    const priceMatch = priceText.match(/\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    if (priceMatch) {
        price = parseFloat(priceMatch[1].replace(',', ''));
    }
    
    // Validate and return
    if (tierName && price && price > 0 && price < 10000) {
        return { tier: tierName, price };
    }
    
    return null;
}

/**
 * Remove duplicate tiers, keeping the first occurrence
 */
function deduplicatePricing(pricing) {
    const seen = new Set();
    const unique = [];
    
    for (const p of pricing) {
        const key = p.tier.toLowerCase();
        if (!seen.has(key)) {
            seen.add(key);
            unique.push(p);
        }
    }
    
    // Sort by price for consistent ordering
    unique.sort((a, b) => a.price - b.price);
    
    console.log('[Parser] Final extracted pricing:');
    unique.forEach((p, i) => {
        console.log(`[Parser]   ${i + 1}. ${p.tier}: $${p.price}`);
    });
    
    return unique;
}

module.exports = { parsePricingFromHtml };
