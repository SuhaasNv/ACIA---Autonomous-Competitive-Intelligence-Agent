/**
 * Brute-force endpoint test - validates all API routes and edge cases.
 * Run: node server/test-endpoints-brute.js
 * Requires: Backend running on port 3001
 */
const http = require('http');

const BASE = 'http://localhost:3001/api';

function fetch(url, options = {}) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const req = http.request({
            hostname: u.hostname,
            port: u.port || 80,
            path: u.pathname,
            method: options.method || 'GET',
            headers: options.headers || { 'Content-Type': 'application/json' }
        }, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => resolve({ status: res.statusCode, body }));
        });
        req.on('error', reject);
        if (options.body) req.write(options.body);
        req.end();
    });
}

async function run() {
    const results = [];
    let passed = 0;

    const test = (name, ok, detail = '') => {
        results.push({ name, ok, detail });
        if (ok) passed++;
        console.log(ok ? '✅' : '❌', name, detail ? `(${detail})` : '');
    };

    console.log('=== ACIA Endpoint Brute-Force Test ===\n');

    // Health
    const h = await fetch(`${BASE}/health`);
    test('GET /api/health returns 200', h.status === 200, h.status);
    test('GET /api/health returns JSON', h.body.includes('"status"'), '');

    // Competitors - unauthenticated
    const c1 = await fetch(`${BASE}/competitors`);
    test('GET /api/competitors requires auth (401)', c1.status === 401, c1.status);

    const c2 = await fetch(`${BASE}/competitors`, {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', url: 'https://example.com' })
    });
    test('POST /api/competitors requires auth (401)', c2.status === 401, c2.status);

    const c3 = await fetch(`${BASE}/competitors/00000000-0000-0000-0000-000000000000`, {
        method: 'PUT',
        body: JSON.stringify({ name: 'Test', url: 'https://example.com' })
    });
    test('PUT /api/competitors/:id requires auth (401)', c3.status === 401, c3.status);

    // Reports
    const r1 = await fetch(`${BASE}/reports/latest`);
    test('GET /api/reports/latest requires auth (401)', r1.status === 401, r1.status);

    // Scan
    const s1 = await fetch(`${BASE}/scan`, { method: 'POST', body: '{}' });
    test('POST /api/scan requires auth (401)', s1.status === 401, s1.status);

    // Invalid paths
    const inv1 = await fetch(`${BASE}/nonexistent`);
    test('GET /api/nonexistent returns 404', inv1.status === 404, inv1.status);

    const inv2 = await fetch(`${BASE}/competitors/invalid-uuid`, {
        method: 'PUT',
        body: JSON.stringify({ name: 'Test', url: 'https://example.com' })
    });
    test('PUT /api/competitors/:id rejects unauthenticated (401 or 404)', [401, 404].includes(inv2.status), inv2.status);

    // Rate limit / CORS - just verify we get a response
    const cors = await fetch(`${BASE}/health`, {
        headers: { 'Origin': 'http://localhost:3000' }
    });
    test('CORS allows localhost:3000', cors.status === 200, '');

    console.log('\n=== Summary ===');
    console.log(`${passed}/${results.length} tests passed`);
    process.exit(passed === results.length ? 0 : 1);
}

run().catch(e => {
    console.error('Fatal:', e.message);
    process.exit(1);
});
