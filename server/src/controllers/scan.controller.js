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

    // Detailed steps for agent thought trace (visible in frontend)
    const agentSteps = [];
    const addStep = (type, message, detail = null) => {
        agentSteps.push({ 
            type, 
            message, 
            detail,
            timestamp: Date.now() - scanStart 
        });
        console.log(`[Scan] [Step] ${message}${detail ? ` (${detail})` : ''}`);
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

        addStep('init', 'Initializing scan', competitor.name);

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
            urlsToTry.push({ url: providedUrl, label: 'provided pricing URL' });
            addStep('detect', 'URL identified as pricing page', providedUrl);
        } else {
            const pricingUrl = getPricingPageUrl(providedUrl);
            if (pricingUrl && pricingUrl !== providedUrl) {
                urlsToTry.push({ url: pricingUrl, label: 'auto-detected pricing page' });
                addStep('detect', 'Auto-detected pricing page URL', pricingUrl);
            }
            urlsToTry.push({ url: providedUrl, label: 'homepage' });
            addStep('fetch', 'Fetching homepage', providedUrl);
        }

        console.log(`\n[Scan] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`[Scan] 📡 STAGE 1: Smart URL Fetching`);
        console.log(`[Scan] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        // Try each URL until we get good pricing data
        for (const { url, label } of urlsToTry) {
            console.log(`\n[Scan] 🔄 Attempting to fetch ${label}...`);
            
            try {
                fetchedHtml = await brightData.fetchCompetitorPage(url);
                const bytes = fetchedHtml?.length || 0;
                console.log(`[Scan] ✅ Fetched ${bytes} bytes from ${label}`);
                addStep('loaded', `Page loaded successfully`, `${(bytes / 1024).toFixed(1)}KB`);
                
                // Parse pricing
                console.log(`[Scan] 🔍 Parsing pricing from HTML...`);
                const parsed = parser.parsePricingFromHtml(fetchedHtml);
                const tierCount = parsed.pricing?.length || 0;
                
                console.log(`[Scan] 📊 Found ${tierCount} tier(s) from ${label}`);
                
                if (tierCount >= MIN_TIERS_THRESHOLD) {
                    newSnapshot = parsed;
                    pricingPageUrl = url;
                    dataSource = 'brightdata';
                    addStep('extract', `Extracted ${tierCount} pricing tiers`, parsed.pricing.map(p => p.tier).join(', '));
                    console.log(`[Scan] ✅ SUCCESS: Good pricing data found!`);
                    break;
                } else if (tierCount > 0 && newSnapshot.pricing.length === 0) {
                    newSnapshot = parsed;
                    pricingPageUrl = url;
                    addStep('partial', `Found ${tierCount} tier(s), searching for more...`);
                } else {
                    addStep('search', 'No pricing found on this page, continuing search...');
                }
            } catch (fetchError) {
                console.warn(`[Scan] ⚠️ Failed to fetch ${label}: ${fetchError.message}`);
                addStep('error', `Failed to fetch ${label}`, fetchError.message);
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
            
            addStep('agent', '🤖 Activating autonomous web agent');
            addStep('navigate', 'Agent navigating to find pricing page...', providedUrl);
            
            try {
                const navResult = await actionBook.navigateToPricing(providedUrl);
                
                if (navResult && navResult.html) {
                    pricingPageUrl = navResult.pricingUrl;
                    console.log(`[Scan] ✅ Agent found pricing page: ${pricingPageUrl}`);
                    console.log(`[Scan] 📄 Retrieved ${navResult.html.length} bytes`);
                    
                    addStep('discover', `Pricing page discovered`, pricingPageUrl);
                    
                    // Re-parse pricing from the pricing page
                    console.log(`[Scan] 🔍 Re-parsing pricing from pricing page...`);
                    newSnapshot = parser.parsePricingFromHtml(navResult.html);
                    
                    if (newSnapshot.pricing && newSnapshot.pricing.length > 0) {
                        dataSource = 'actionbook-navigation';
                        addStep('extract', `Extracted ${newSnapshot.pricing.length} pricing tiers`, newSnapshot.pricing.map(p => p.tier).join(', '));
                        console.log(`[Scan] ✅ SUCCESS: Found ${newSnapshot.pricing.length} tier(s) after navigation`);
                        newSnapshot.pricing.forEach((tier, idx) => {
                            console.log(`[Scan]    ${idx + 1}. ${tier.tier}: $${tier.price}`);
                        });
                    } else {
                        console.log(`[Scan] ⚠️ Pricing page found but no tiers extracted`);
                        addStep('warn', 'Pricing page found but parsing failed');
                    }
                    
                    stages.agentNavigating.status = 'complete';
                } else {
                    console.log(`[Scan] ⚠️ Agent navigation did not return pricing page`);
                    addStep('warn', 'Agent could not locate pricing page');
                    stages.agentNavigating.status = 'error';
                }
                
                stages.agentNavigating.endTime = Date.now();
                
            } catch (navError) {
                console.warn(`[Scan] ❌ Agent navigation failed: ${navError.message}`);
                addStep('error', 'Agent navigation failed', navError.message);
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
            addStep('fallback', 'Using synthetic demo data');
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
        
        // Add pricing summary step
        const pricesSummary = newSnapshot.pricing.map(p => `${p.tier}: $${p.price}`).join(', ');
        addStep('pricing', `Final pricing: ${newSnapshot.pricing.length} tiers`, pricesSummary);
        
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

        addStep('compare', 'Comparing against baseline snapshot');

        // Retrieve previous state from Acontext
        console.log(`[Scan] 📥 Retrieving previous snapshot from Acontext...`);
        const oldSnapshot = await acontext.getLatestSnapshot(userId);
        
        if (oldSnapshot) {
            console.log(`[Scan] 📋 Previous snapshot found with ${oldSnapshot.pricing?.length || 0} tier(s)`);
            addStep('baseline', 'Previous baseline loaded', `${oldSnapshot.pricing?.length || 0} tiers`);
        } else {
            console.log(`[Scan] 📋 No previous snapshot - this is first run`);
            addStep('baseline', 'No previous baseline - establishing first snapshot');
        }

        // Compute strict local diff
        const { isFirstRun, hasSignificantChange, delta, classification: deltaClassification, confidence: deltaConfidence, impact: deltaImpact } = diffEngine.computeLocalDelta(oldSnapshot, newSnapshot);
        
        console.log(`[Scan] 📊 Delta Result:`);
        console.log(`[Scan]    - First Run: ${isFirstRun}`);
        console.log(`[Scan]    - Significant Change (≥5%): ${hasSignificantChange}`);
        console.log(`[Scan]    - Classification: ${deltaClassification}`);
        console.log(`[Scan]    - Confidence: ${deltaConfidence}%`);
        console.log(`[Scan]    - Impact: ${deltaImpact}`);
        
        if (hasSignificantChange) {
            const changeCount = delta?.changes?.length || 0;
            addStep('delta', `Detected ${changeCount} significant change(s)`, '≥5% threshold');
        } else if (isFirstRun) {
            addStep('delta', 'First run - baseline established');
        } else {
            addStep('delta', 'No significant changes detected', '<5% threshold');
        }
        
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

        let llmInsight = { 
            insight: "No material changes detected.", 
            classification: deltaClassification,
            confidence: deltaConfidence,
            impact: deltaImpact
        };

        if (hasSignificantChange) {
            console.log(`[Scan] 🔥 Significant change detected - calling Gemini for analysis...`);
            addStep('ai', 'Generating AI strategic insight...');
            llmInsight = await gemini.analyzeDelta(delta);
            addStep('insight', `Classification: ${llmInsight.classification}`);
            console.log(`[Scan] ✅ Gemini analysis complete`);
            console.log(`[Scan]    - Classification: ${llmInsight.classification}`);
            console.log(`[Scan]    - Confidence: ${llmInsight.confidence}%`);
            console.log(`[Scan]    - Impact: ${llmInsight.impact}`);
        } else if (isFirstRun) {
            console.log(`[Scan] 📌 First run - establishing baseline (skipping Gemini)`);
            addStep('insight', 'Initial baseline established', `Classification: ${deltaClassification}`);
            llmInsight = { 
                insight: "Initial baseline established.", 
                classification: deltaClassification,
                confidence: deltaConfidence,
                impact: deltaImpact
            };
        } else {
            console.log(`[Scan] ⏭️  No significant changes - skipping Gemini analysis`);
            addStep('insight', 'No material changes', `Classification: ${deltaClassification}`);
        }
        
        stages.generatingInsight.status = 'complete';
        stages.generatingInsight.endTime = Date.now();

        // ============================================================
        // STAGE 6: Store & Save Report
        // ============================================================
        console.log(`\n[Scan] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`[Scan] 💾 STAGE 6: Storing Snapshot & Saving Report`);
        console.log(`[Scan] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        addStep('save', 'Saving report to database');

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

        addStep('complete', 'Analysis complete');

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
        console.log(`[Scan]    - Total Steps: ${agentSteps.length}`);

        // Return response with stage info and steps for frontend
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
                },
                // Detailed agent thought trace steps
                steps: agentSteps
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
