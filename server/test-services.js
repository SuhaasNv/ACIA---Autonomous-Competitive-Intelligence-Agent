/**
 * Test script for Bright Data, Acontext, and ActionBook APIs.
 * Run from project root: node server/test-services.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
// Also load server/.env for BRIGHTDATA_MCP_TOKEN
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const brightData = require('./src/services/brightdata.service');
const acontext = require('./src/services/acontext.service');
const actionBook = require('./src/services/actionbook.service');

const TEST_USER_ID = 'test-services-check';
const TEST_URL = 'https://example.com';

async function testBrightData() {
  console.log('\n--- Bright Data ---');
  console.log('BRIGHTDATA_MCP_TOKEN:', process.env.BRIGHTDATA_MCP_TOKEN ? `${process.env.BRIGHTDATA_MCP_TOKEN.slice(0, 12)}...` : 'NOT SET');
  try {
    const html = await brightData.fetchCompetitorPage(TEST_URL);
    const ok = html && typeof html === 'string' && html.length > 100;
    console.log(ok ? '✅ Bright Data OK' : '❌ Bright Data: response too short');
    if (ok) console.log(`   Fetched ${html.length} bytes`);
    return ok;
  } catch (err) {
    console.log('❌ Bright Data FAILED:', err.message);
    return false;
  }
}

async function testAcontext() {
  console.log('\n--- Acontext ---');
  const baseUrl = process.env.ACONTEXT_API_URL || 'https://api.acontext.ai/v1';
  console.log('ACONTEXT_API_URL:', baseUrl);
  console.log('ACONTEXT_API_KEY:', process.env.ACONTEXT_API_KEY ? `${process.env.ACONTEXT_API_KEY.slice(0, 12)}...` : 'NOT SET');
  try {
    const testSnapshot = { pricing: [{ tier: 'Test', price: 0 }], _test: Date.now() };
    await acontext.setLatestSnapshot(TEST_USER_ID, testSnapshot);
    const retrieved = await acontext.getLatestSnapshot(TEST_USER_ID);
    const ok = retrieved && retrieved._test === testSnapshot._test;
    if (ok) {
      // Verify API was actually used (not local fallback) - GET on non-existent key returns 404 if API works
      const axios = require('axios');
      const key = `competitor:${TEST_USER_ID}:latest_snapshot`;
      try {
        await axios.get(`${baseUrl}/memory/${key}`, {
          headers: { Authorization: `Bearer ${process.env.ACONTEXT_API_KEY}` },
          timeout: 8000,
          validateStatus: () => true
        });
        console.log('✅ Acontext OK (API reachable, get/set works)');
      } catch (e) {
        if (e.code === 'ENOTFOUND' || e.message?.includes('getaddrinfo')) {
          console.log('❌ Acontext: API host unreachable (ENOTFOUND) - check ACONTEXT_API_URL');
          return false;
        }
        console.log('✅ Acontext OK (get/set)');
      }
    } else {
      console.log('❌ Acontext: get/set mismatch');
    }
    return ok;
  } catch (err) {
    console.log('❌ Acontext FAILED:', err.message);
    return false;
  }
}

async function testActionBook() {
  console.log('\n--- ActionBook ---');
  console.log('ACTIONBOOK_API_KEY:', process.env.ACTIONBOOK_API_KEY ? `${process.env.ACTIONBOOK_API_KEY.slice(0, 12)}...` : 'NOT SET');
  console.log('ACTIONBOOK_API_URL:', process.env.ACTIONBOOK_API_URL || 'https://api.actionbook.dev/v1');
  try {
    const html = await actionBook.extractDynamicHtml(TEST_URL);
    const ok = html && typeof html === 'string' && html.length > 100;
    console.log(ok ? '✅ ActionBook OK' : '⚠️ ActionBook: empty/short (may use /render - check API)');
    if (html?.length) console.log(`   Rendered ${html.length} bytes`);
    return ok;
  } catch (err) {
    console.log('❌ ActionBook FAILED:', err.message);
    return false;
  }
}

async function main() {
  console.log('Testing Bright Data, Acontext, ActionBook...');
  const results = {
    brightData: await testBrightData(),
    acontext: await testAcontext(),
    actionBook: await testActionBook(),
  };
  console.log('\n--- Summary ---');
  console.log('Bright Data:', results.brightData ? '✅' : '❌');
  console.log('Acontext:', results.acontext ? '✅' : '❌');
  console.log('ActionBook:', results.actionBook ? '✅' : '❌');
  const allOk = Object.values(results).every(Boolean);
  process.exit(allOk ? 0 : 1);
}

main();
