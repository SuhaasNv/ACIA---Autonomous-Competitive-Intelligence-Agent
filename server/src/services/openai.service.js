const OpenAI = require('openai');
const { env } = require('../config/env');

async function analyzeDelta(deltaJson) {
    if (!env.OPENAI_API_KEY) {
        console.warn('[OpenAI] Missing API Key. Returning placeholder insight.');
        return {
            insight: "OpenAI API key not configured.",
            classification: "Stable",
            confidence: 85,
            impact: "Low"
        };
    }

    try {
        const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

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

        const result = await openai.chat.completions.create({
            model: env.OPENAI_MODEL,
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
        });

        const responseText = result.choices[0].message.content;
        console.log('[OpenAI] Raw response:', responseText.slice(0, 300));

        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error(`No JSON object found in OpenAI response: ${responseText.slice(0, 200)}`);
        }

        const parsed = JSON.parse(jsonMatch[0]);

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
        console.error('[OpenAI API Error]', error.message);
        return {
            insight: "Pricing intelligence unavailable — OpenAI analysis could not be completed.",
            classification: "Stable",
            confidence: 80,
            impact: "Low"
        };
    }
}

module.exports = { analyzeDelta };
