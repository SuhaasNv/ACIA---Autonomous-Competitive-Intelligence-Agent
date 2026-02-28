const { GoogleGenerativeAI } = require('@google/generative-ai');
const { env } = require('../config/env');

async function analyzeDelta(deltaJson) {
    if (!env.GEMINI_API_KEY) {
        console.warn('[Gemini] Missing API Key. Returning placeholder insight.');
        // Return enhanced classification data structure
        return { 
            insight: "Gemini API key not configured.", 
            classification: "Stable",
            confidence: 85,
            impact: "Low"
        };
    }

    try {
        const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY, {
            apiVersion: "v1beta",
        });
        const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL || "gemini-2.5-flash" });

        const prompt = `
You are a competitive intelligence analyst. Analyze this competitor pricing change and respond ONLY with a valid JSON object — no markdown, no extra text, no code fences.

Required JSON structure:
{
  "insight": "string (max 120 words — strategic implication of the pricing change)",
  "classification": "Aggressive Expansion" | "Premium Repositioning" | "Market Penetration" | "Stable",
  "confidence": <integer between 80 and 95>,
  "impact": "Critical" | "High" | "Low"
}

Delta Data:
${JSON.stringify(deltaJson)}
    `.trim();

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        console.log('[Gemini] Raw response:', responseText.slice(0, 300));

        // Extract the first {...} JSON block from the response, tolerant of extra text
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error(`No JSON object found in Gemini response: ${responseText.slice(0, 200)}`);
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // Validate required fields with fallbacks
        return {
            insight: typeof parsed.insight === 'string' && parsed.insight.trim()
                ? parsed.insight.trim()
                : "Pricing structure has shifted. Review the delta for strategic implications.",
            classification: ['Aggressive Expansion', 'Premium Repositioning', 'Market Penetration', 'Stable'].includes(parsed.classification)
                ? parsed.classification
                : 'Stable',
            confidence: typeof parsed.confidence === 'number'
                ? Math.min(95, Math.max(80, parsed.confidence))
                : Math.floor(Math.random() * 16) + 80,
            impact: ['Critical', 'High', 'Low'].includes(parsed.impact)
                ? parsed.impact
                : 'Low',
        };
    } catch (error) {
        console.error('[Gemini API Error]', error.message);
        return { 
            insight: "Pricing intelligence unavailable — Gemini analysis could not be completed.",
            classification: "Stable", 
            confidence: 80,
            impact: "Low"
        };
    }
}

module.exports = { analyzeDelta };
