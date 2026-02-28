/**
 * Quick test script to verify Gemini API connectivity.
 * Run from project root: node server/test-gemini.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const gemini = require('./src/services/gemini.service');

const mockDelta = {
  changes: [
    { type: 'increased', tier: 'Pro', old_price: 79, current_price: 99, percent_change: 25.3 },
    { type: 'added', tier: 'Enterprise', current_price: 249 }
  ],
  current_pricing: [
    { tier: 'Starter', price: 29 },
    { tier: 'Pro', price: 99 },
    { tier: 'Enterprise', price: 249 }
  ]
};

async function test() {
  console.log('Testing Gemini API...\n');
  console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.slice(0, 10)}...` : 'NOT SET');
  console.log('GEMINI_MODEL:', process.env.GEMINI_MODEL || 'gemini-2.5-flash');
  console.log('\nSending mock delta to Gemini...\n');

  try {
    const result = await gemini.analyzeDelta(mockDelta);
    console.log('✅ SUCCESS - Gemini responded:\n');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n---');
    if (result.insight?.includes('Gemini API key not configured')) {
      console.log('⚠️  WARNING: Using placeholder - API key may not be loaded correctly');
    } else if (result.insight?.includes('Pricing intelligence unavailable')) {
      console.log('⚠️  WARNING: Gemini returned an error - check API key validity');
    } else {
      console.log('✅ Gemini is returning real AI-generated insights');
    }
  } catch (err) {
    console.error('❌ FAILED:', err.message);
    process.exit(1);
  }
}

test();
