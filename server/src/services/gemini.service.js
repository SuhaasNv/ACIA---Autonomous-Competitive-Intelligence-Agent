const { GoogleGenerativeAI } = require('@google/generative-ai');
const { env } = require('../config/env');

async function analyzeDelta(deltaJson) {
    if (!env.GEMINI_API_KEY) {
        console.warn('[Gemini] Missing API Key. Returning placeholder insight.');
        return { insight: "Gemini API key not configured.", classification: "Unknown" };
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
        "classification": "Critical" | "Warning" | "Info" | "Stable"
      }
      
      Delta Data:
      ${JSON.stringify(deltaJson)}
    `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Clean potential markdown blocks
        const cleanedText = responseText.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(cleanedText);
    } catch (error) {
        console.error('[Gemini API Error]', error.message);
        return { insight: "Error generating insight.", classification: "Unknown" };
    }
}

module.exports = { analyzeDelta };
