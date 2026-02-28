/**
 * Compares old and new pricing snapshots.
 * Returns delta object with changes AND current_pricing, plus boolean flags.
 */
function computeLocalDelta(oldSnapshot, newSnapshot) {
    // Always include current pricing in the delta for display purposes
    const currentPricing = newSnapshot?.pricing || [];
    
    if (!oldSnapshot || !oldSnapshot.pricing) {
        return { 
            isFirstRun: true, 
            hasSignificantChange: false, 
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

    return {
        isFirstRun: false,
        hasSignificantChange: changes.length > 0 && absoluteChangeExceedsThreshold,
        delta: { 
            changes,
            current_pricing: currentPricing 
        }
    };
}

module.exports = { computeLocalDelta };
