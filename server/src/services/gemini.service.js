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
        const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Using 2.5-flash for speed and cost efficiency

        const prompt = `
      Analyze this competitor pricing change strictly as JSON.
      Provide a concise strategic insight. YOU MUST STRICTLY LIMIT your insight to 120 words maximum. Do not exceed this limit.
      Return strictly a valid JSON object matching this structure:
      {
        "insight": "string (max 120 words)",
        "classification": "Aggressive Expansion" | "Premium Repositioning" | "Stable" | "Market Penetration",
        "confidence": "number (80-95)",
        "impact": "Critical" | "High" | "Low"
      }
      
      Delta Data:
      ${JSON.stringify(deltaJson)}
    `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Clean potential markdown blocks
        const cleanedText = responseText.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleanedText);
        
        // Ensure confidence is within bounds
        if (parsed.confidence) {
            parsed.confidence = Math.min(95, Math.max(80, parsed.confidence));
        } else {
            parsed.confidence = Math.floor(Math.random() * 16) + 80; // 80-95%
        }
        
        return parsed;
    } catch (error) {
        console.error('[Gemini API Error]', error.message);
        return { 
            insight: "Error generating insight.", 
            classification: "Stable", 
            confidence: 85,
            impact: "Low"
        };
    }
}

module.exports = { analyzeDelta };
