/**
 * Quick endpoint connectivity test.
 * Run: node server/test-endpoints.js
 * Requires: Backend running on port 3001
 */
const http = require('http');

const BASE = 'http://localhost:3001/api';

async function fetch(url, options = {}) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const req = http.request({
            hostname: u.hostname,
            port: u.port || 80,
            path: u.pathname,
            method: options.method || 'GET',
            headers: options.headers || {}
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

async function main() {
    console.log('Testing ACIA API endpoints...\n');

    // 1. Health (no auth)
    const health = await fetch(`${BASE}/health`);
    const healthOk = health.status === 200;
    console.log(healthOk ? '✅ GET /api/health' : '❌ GET /api/health', `(${health.status})`);

    // 2. Competitors (expect 401 without token)
    const comp = await fetch(`${BASE}/competitors`);
    const compOk = comp.status === 401;
    console.log(compOk ? '✅ GET /api/competitors (auth required)' : '❌ GET /api/competitors', `(${comp.status})`);

    // 3. Reports (expect 401)
    const rep = await fetch(`${BASE}/reports/latest`);
    const repOk = rep.status === 401;
    console.log(repOk ? '✅ GET /api/reports/latest (auth required)' : '❌ GET /api/reports/latest', `(${rep.status})`);

    // 4. Scan (expect 401)
    const scan = await fetch(`${BASE}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
    });
    const scanOk = scan.status === 401;
    console.log(scanOk ? '✅ POST /api/scan (auth required)' : '❌ POST /api/scan', `(${scan.status})`);

    const allOk = healthOk && compOk && repOk && scanOk;
    console.log('\n' + (allOk ? 'All endpoints reachable.' : 'Some endpoints failed.'));
    process.exit(allOk ? 0 : 1);
}

main().catch(e => {
    console.error('Failed:', e.message);
    process.exit(1);
});
