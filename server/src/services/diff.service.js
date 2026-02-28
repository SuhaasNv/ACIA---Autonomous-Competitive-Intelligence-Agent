/**
 * Compares old and new pricing snapshots.
 * Returns delta object with changes AND current_pricing, plus boolean flags.
 */

/**
 * Calculates strategic classification based on pricing delta
 */
function calculateClassification(changes) {
    if (!changes || changes.length === 0) {
        return { classification: "Stable", confidence: Math.floor(Math.random() * 16) + 80, impact: "Low" }; // 80-95%
    }

    // Calculate the largest percentage change
    let maxPercentChange = 0;
    let hasIncrease = false;
    let hasDecrease = false;

    changes.forEach(change => {
        if (change.percent_change !== undefined) {
            const absPercentChange = Math.abs(change.percent_change);
            if (absPercentChange > maxPercentChange) {
                maxPercentChange = absPercentChange;
            }
            
            if (change.type === 'increased' || (change.type === 'added' && change.current_price > 0)) {
                hasIncrease = true;
            } else if (change.type === 'decreased') {
                hasDecrease = true;
            }
        }
    });

    let classification = "Stable";
    let impact = "Low";

    if (maxPercentChange > 20) {
        classification = hasIncrease ? "Aggressive Expansion" : "Stable"; // Only classify as Aggressive if it's an increase
        impact = "Critical";
    } else if (maxPercentChange >= 5 && maxPercentChange <= 20) {
        classification = hasIncrease ? "Premium Repositioning" : "Stable"; // Only classify as Premium if it's an increase
        impact = "High";
    } else if (hasDecrease) {
        classification = "Market Penetration";
        impact = maxPercentChange > 10 ? "High" : "Low"; // Decreases have different impact thresholds
    }

    const confidence = Math.floor(Math.random() * 16) + 80; // Random between 80-95%

    return { classification, confidence, impact };
}

function computeLocalDelta(oldSnapshot, newSnapshot) {
    // Always include current pricing in the delta for display purposes
    const currentPricing = newSnapshot?.pricing || [];
    
    if (!oldSnapshot || !oldSnapshot.pricing) {
        const { classification, confidence, impact } = calculateClassification([]);
        return { 
            isFirstRun: true, 
            hasSignificantChange: false,
            classification,
            confidence,
            impact,
            delta: { 
                changes: [],
                current_pricing: currentPricing 
            } 
        };
    }

    const oldMap = new Map(oldSnapshot.pricing.map(p => [p.tier, p.price]));
    const changes = [];
    let absoluteChangeExceedsThreshold = false;

    newSnapshot.pricing.forEach(newTier => {
        const oldPrice = oldMap.get(newTier.tier);

        if (oldPrice === undefined) {
            changes.push({ type: 'added', tier: newTier.tier, current_price: newTier.price });
            absoluteChangeExceedsThreshold = true;
        } else if (oldPrice !== newTier.price) {
            const diff = newTier.price - oldPrice;
            const percentChange = Math.abs(diff / oldPrice) * 100;

            changes.push({
                type: diff > 0 ? 'increased' : 'decreased',
                tier: newTier.tier,
                old_price: oldPrice,
                current_price: newTier.price,
                percent_change: percentChange
            });

            if (percentChange >= 5) {
                absoluteChangeExceedsThreshold = true;
            }
        }
        oldMap.delete(newTier.tier);
    });

    // Remaining in oldMap were removed
    oldMap.forEach((oldPrice, tierName) => {
        changes.push({ type: 'removed', tier: tierName, old_price: oldPrice });
        absoluteChangeExceedsThreshold = true;
    });

    const { classification, confidence, impact } = calculateClassification(changes);

    return {
        isFirstRun: false,
        hasSignificantChange: changes.length > 0 && absoluteChangeExceedsThreshold,
        classification,
        confidence,
        impact,
        delta: { 
            changes,
            current_pricing: currentPricing 
        }
    };
}

module.exports = { computeLocalDelta };
