const supabaseService = require('../services/supabase.service');
const brightData = require('../services/brightdata.service');
const actionBook = require('../services/actionbook.service');
const parser = require('../services/parser.service');
const acontext = require('../services/acontext.service');
const diffEngine = require('../services/diff.service');
const gemini = require('../services/gemini.service');

// Minimum tiers required before triggering additional strategies
const MIN_TIERS_THRESHOLD = 2;

// Common pricing page path patterns
const PRICING_PATH_PATTERNS = ['/pricing', '/plans', '/price', '/packages', '/subscriptions'];

/**
 * Intelligently determine the pricing page URL from a base URL
 */
function getPricingPageUrl(baseUrl) {
    try {
        const url = new URL(baseUrl);
        const pathname = url.pathname.toLowerCase();
        
        // Check if already a pricing page
        for (const pattern of PRICING_PATH_PATTERNS) {
            if (pathname.includes(pattern)) {
                console.log(`[Scan] URL already appears to be a pricing page`);
                return baseUrl;
            }
        }
        
        // Construct potential pricing URLs
        const baseOrigin = url.origin;
        return `${baseOrigin}/pricing`;
    } catch (e) {
        return null;
    }
}

/**
 * Check if URL looks like a pricing page
 */
function isPricingPage(url) {
    try {
        const pathname = new URL(url).pathname.toLowerCase();
        return PRICING_PATH_PATTERNS.some(p => pathname.includes(p));
    } catch (e) {
        return false;
    }
}

async function runScan(req, res, next) {
    const scanStart = Date.now();
    let dataSource = 'none';

    // Track stages for frontend visibility
    const stages = {
        fetchingHomepage: { status: 'pending', startTime: null, endTime: null },
        agentNavigating: { status: 'skipped', startTime: null, endTime: null, used: false },
        extractingPricing: { status: 'pending', startTime: null, endTime: null },
        computingDelta: { status: 'pending', startTime: null, endTime: null },
        generatingInsight: { status: 'pending', startTime: null, endTime: null }
    };

    try {
        const userId = req.user.id;
        console.log(`[Scan] ========================================`);
        console.log(`[Scan] 🚀 Starting intelligent scan for user ${userId}`);
        console.log(`[Scan] ========================================`);

        // 1. Fetch user's competitor
        const competitor = await supabaseService.getCompetitorForUser(userId);
        if (!competitor) {
            console.log('[Scan] ❌ No competitor configured');
            return res.status(404).json({ error: 'No competitor configured' });
        }
        
        const providedUrl = competitor.url;
        console.log(`[Scan] 🎯 Target: ${competitor.name}`);
        console.log(`[Scan] 🔗 Provided URL: ${providedUrl}`);

        // ============================================================
        // STAGE 1: Smart URL Detection & Fetching
        // ============================================================
        stages.fetchingHomepage.status = 'active';
        stages.fetchingHomepage.startTime = Date.now();
        
        let fetchedHtml = null;
        let newSnapshot = { pricing: [] };
        let actionBookTriggered = false;
        let pricingPageUrl = null;
        let urlsToTry = [];

        // Build list of URLs to try
        if (isPricingPage(providedUrl)) {
            // If URL already looks like a pricing page, try it first
            urlsToTry.push({ url: providedUrl, label: 'provided pricing URL' });
        } else {
            // Try constructed pricing URL first, then homepage
            const pricingUrl = getPricingPageUrl(providedUrl);
            if (pricingUrl && pricingUrl !== providedUrl) {
                urlsToTry.push({ url: pricingUrl, label: 'auto-detected pricing page' });
            }
            urlsToTry.push({ url: providedUrl, label: 'homepage' });
        }

        console.log(`\n[Scan] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`[Scan] 📡 STAGE 1: Smart URL Fetching`);
        console.log(`[Scan] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`[Scan] 📋 Will try ${urlsToTry.length} URL(s):`);
        urlsToTry.forEach((u, i) => console.log(`[Scan]    ${i + 1}. ${u.label}: ${u.url}`));

        // Try each URL until we get good pricing data
        for (const { url, label } of urlsToTry) {
            console.log(`\n[Scan] 🔄 Attempting to fetch ${label}...`);
            
            try {
                fetchedHtml = await brightData.fetchCompetitorPage(url);
                console.log(`[Scan] ✅ Fetched ${fetchedHtml?.length || 0} bytes from ${label}`);
                
                // Parse pricing
                console.log(`[Scan] 🔍 Parsing pricing from HTML...`);
                const parsed = parser.parsePricingFromHtml(fetchedHtml);
                const tierCount = parsed.pricing?.length || 0;
                
                console.log(`[Scan] 📊 Found ${tierCount} tier(s) from ${label}`);
                
                if (tierCount >= MIN_TIERS_THRESHOLD) {
                    newSnapshot = parsed;
                    pricingPageUrl = url;
                    dataSource = 'brightdata';
                    console.log(`[Scan] ✅ SUCCESS: Good pricing data found!`);
                    break;
                } else if (tierCount > 0 && newSnapshot.pricing.length === 0) {
                    // Keep partial results in case we don't find better
                    newSnapshot = parsed;
                    pricingPageUrl = url;
                }
            } catch (fetchError) {
                console.warn(`[Scan] ⚠️ Failed to fetch ${label}: ${fetchError.message}`);
            }
        }
        
        stages.fetchingHomepage.status = newSnapshot.pricing.length > 0 ? 'complete' : 'error';
        stages.fetchingHomepage.endTime = Date.now();

        // ============================================================
        // STAGE 2: ActionBook Navigation (if needed)
        // Trigger if <2 tiers or no prices found on homepage
        // ============================================================
        const tiersFound = newSnapshot.pricing?.length || 0;
        
        if (tiersFound < MIN_TIERS_THRESHOLD) {
            actionBookTriggered = true;
            stages.agentNavigating.used = true;
            stages.agentNavigating.status = 'active';
            stages.agentNavigating.startTime = Date.now();
            
            console.log(`\n[Scan] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`[Scan] 🤖 STAGE 2: ActionBook Agent Navigation`);
            console.log(`[Scan] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`[Scan] 📋 Reason: Found ${tiersFound} tier(s), need at least ${MIN_TIERS_THRESHOLD}`);
            console.log(`[Scan] 🧭 Agent autonomously navigating to find pricing page...`);
            
            try {
                const navResult = await actionBook.navigateToPricing(providedUrl);
                
                if (navResult && navResult.html) {
                    pricingPageUrl = navResult.pricingUrl;
                    console.log(`[Scan] ✅ Agent found pricing page: ${pricingPageUrl}`);
                    console.log(`[Scan] 📄 Retrieved ${navResult.html.length} bytes`);
                    
                    // Re-parse pricing from the pricing page
                    console.log(`[Scan] 🔍 Re-parsing pricing from pricing page...`);
                    newSnapshot = parser.parsePricingFromHtml(navResult.html);
                    
                    if (newSnapshot.pricing && newSnapshot.pricing.length > 0) {
                        dataSource = 'actionbook-navigation';
                        console.log(`[Scan] ✅ SUCCESS: Found ${newSnapshot.pricing.length} tier(s) after navigation`);
                        newSnapshot.pricing.forEach((tier, idx) => {
                            console.log(`[Scan]    ${idx + 1}. ${tier.tier}: $${tier.price}`);
                        });
                    } else {
                        console.log(`[Scan] ⚠️ Pricing page found but no tiers extracted`);
                    }
                    
                    stages.agentNavigating.status = 'complete';
                } else {
                    console.log(`[Scan] ⚠️ Agent navigation did not return pricing page`);
                    stages.agentNavigating.status = 'error';
                }
                
                stages.agentNavigating.endTime = Date.now();
                
            } catch (navError) {
                console.warn(`[Scan] ❌ Agent navigation failed: ${navError.message}`);
                stages.agentNavigating.status = 'error';
                stages.agentNavigating.endTime = Date.now();
            }
        } else {
            dataSource = 'brightdata';
            console.log(`\n[Scan] ⏭️  STAGE 2: SKIPPED - Sufficient pricing data from homepage`);
        }

        // ============================================================
        // STAGE 3: Extract Pricing (finalize)
        // ============================================================
        stages.extractingPricing.status = 'active';
        stages.extractingPricing.startTime = Date.now();
        
        console.log(`\n[Scan] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`[Scan] 📊 STAGE 3: Finalizing Pricing Extraction`);
        console.log(`[Scan] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        // Synthetic fallback if all methods failed
        if (!newSnapshot.pricing || newSnapshot.pricing.length === 0) {
            dataSource = 'synthetic';
            console.warn(`[Scan] ⚠️ FALLBACK: All methods failed - using synthetic demo data`);
            newSnapshot = {
                pricing: [
                    { tier: "Starter", price: 29.99 },
                    { tier: "Pro", price: Math.random() > 0.5 ? 89.99 : 79.99 },
                    { tier: "Enterprise", price: 199.99 }
                ]
            };
        }

        console.log(`[Scan] 📈 Final pricing data (${newSnapshot.pricing.length} tiers):`);
        newSnapshot.pricing.forEach((tier, idx) => {
            console.log(`[Scan]    ${idx + 1}. ${tier.tier}: $${tier.price}`);
        });
        
        stages.extractingPricing.status = 'complete';
        stages.extractingPricing.endTime = Date.now();

        // ============================================================
        // STAGE 4: Compute Delta
        // ============================================================
        stages.computingDelta.status = 'active';
        stages.computingDelta.startTime = Date.now();
        
        console.log(`\n[Scan] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`[Scan] 🔄 STAGE 4: Computing Delta (Acontext Snapshot)`);
        console.log(`[Scan] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        // Retrieve previous state from Acontext
        console.log(`[Scan] 📥 Retrieving previous snapshot from Acontext...`);
        const oldSnapshot = await acontext.getLatestSnapshot(userId);
        
        if (oldSnapshot) {
            console.log(`[Scan] 📋 Previous snapshot found with ${oldSnapshot.pricing?.length || 0} tier(s)`);
        } else {
            console.log(`[Scan] 📋 No previous snapshot - this is first run`);
        }

        // Compute strict local diff
        const { isFirstRun, hasSignificantChange, delta } = diffEngine.computeLocalDelta(oldSnapshot, newSnapshot);
        
        console.log(`[Scan] 📊 Delta Result:`);
        console.log(`[Scan]    - First Run: ${isFirstRun}`);
        console.log(`[Scan]    - Significant Change (≥5%): ${hasSignificantChange}`);
        
        if (delta && hasSignificantChange) {
            console.log(`[Scan]    - Changes detected: ${JSON.stringify(delta)}`);
        }
        
        stages.computingDelta.status = 'complete';
        stages.computingDelta.endTime = Date.now();

        // ============================================================
        // STAGE 5: Generate Insight (Gemini - only if ≥5% change)
        // ============================================================
        stages.generatingInsight.status = 'active';
        stages.generatingInsight.startTime = Date.now();
        
        console.log(`\n[Scan] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`[Scan] 🧠 STAGE 5: Generating Strategic Insight`);
        console.log(`[Scan] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        let llmInsight = { insight: "No material changes detected.", classification: "Stable" };

        if (hasSignificantChange) {
            console.log(`[Scan] 🔥 Significant change detected - calling Gemini for analysis...`);
            llmInsight = await gemini.analyzeDelta(delta);
            console.log(`[Scan] ✅ Gemini analysis complete`);
            console.log(`[Scan]    - Classification: ${llmInsight.classification}`);
        } else if (isFirstRun) {
            console.log(`[Scan] 📌 First run - establishing baseline (skipping Gemini)`);
            llmInsight = { insight: "Initial baseline established.", classification: "Stable" };
        } else {
            console.log(`[Scan] ⏭️  No significant changes - skipping Gemini analysis`);
        }
        
        stages.generatingInsight.status = 'complete';
        stages.generatingInsight.endTime = Date.now();

        // ============================================================
        // STAGE 6: Store & Save Report
        // ============================================================
        console.log(`\n[Scan] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`[Scan] 💾 STAGE 6: Storing Snapshot & Saving Report`);
        console.log(`[Scan] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        // Store new snapshot to Acontext
        console.log(`[Scan] 📤 Storing snapshot to Acontext...`);
        await acontext.setLatestSnapshot(userId, newSnapshot);

        // Save report - always include delta with current_pricing
        const finalReport = {
            competitor_id: competitor.id,
            user_id: userId,
            delta: delta, // Always save delta (contains current_pricing)
            insight: llmInsight.insight,
            classification: llmInsight.classification,
            last_scan_time: new Date().toISOString()
        };
        await supabaseService.saveReport(finalReport);
        console.log(`[Scan] ✅ Report saved successfully`);

        // ============================================================
        // Complete
        // ============================================================
        const scanDuration = Date.now() - scanStart;
        
        console.log(`\n[Scan] ========================================`);
        console.log(`[Scan] ✅ SCAN COMPLETE in ${scanDuration}ms`);
        console.log(`[Scan] ========================================`);
        console.log(`[Scan] Summary:`);
        console.log(`[Scan]    - Data Source: ${dataSource}`);
        console.log(`[Scan]    - ActionBook Used: ${actionBookTriggered}`);
        console.log(`[Scan]    - Pricing Page URL: ${pricingPageUrl || 'N/A (homepage)'}`);
        console.log(`[Scan]    - Tiers Found: ${newSnapshot.pricing.length}`);
        console.log(`[Scan]    - Classification: ${llmInsight.classification}`);

        // Return response with stage info for frontend
        return res.status(200).json({
            isFirstRun,
            hasSignificantChange,
            classification: llmInsight.classification,
            insight: llmInsight.insight,
            delta: hasSignificantChange ? delta : null,
            last_scan_time: finalReport.last_scan_time,
            // Stage info for frontend UI
            scanMeta: {
                dataSource,
                actionBookUsed: actionBookTriggered,
                pricingPageUrl,
                tiersFound: newSnapshot.pricing.length,
                durationMs: scanDuration,
                stages: {
                    fetchingHomepage: stages.fetchingHomepage.status === 'complete',
                    agentNavigating: stages.agentNavigating.used ? stages.agentNavigating.status === 'complete' : null,
                    extractingPricing: stages.extractingPricing.status === 'complete',
                    computingDelta: stages.computingDelta.status === 'complete',
                    generatingInsight: stages.generatingInsight.status === 'complete'
                }
            }
        });

    } catch (error) {
        const scanDuration = Date.now() - scanStart;
        console.error(`\n[Scan] ========================================`);
        console.error(`[Scan] ❌ SCAN FAILED after ${scanDuration}ms`);
        console.error(`[Scan] ========================================`);
        console.error(`[Scan] Error: ${error.message}`);
        next(error);
    }
}

module.exports = { runScan };
