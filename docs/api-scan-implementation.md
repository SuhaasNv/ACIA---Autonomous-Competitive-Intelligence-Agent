# Backend Implementation: `/api/scan` Endpoint (Signal MVP)

This document details the minimal, strict, and production-safe implementation of the `/api/scan` endpoint for the Signal hackathon MVP. It adheres to all constraints, including credit efficiency and the use of Gemini 2.5 Flash conditionally based on local delta computation.

## 1. Folder Structure

```text
server/
├── app.js                 # Express app setup and middleware
├── server.js              # Server entry point
├── config/
│   └── env.js             # Environment variable validation
├── middleware/
│   └── auth.middleware.js # Supabase JWT verification
├── routes/
│   └── scan.routes.js     # Route definitions
├── controllers/
│   └── scan.controller.js # Orchestration logic for /api/scan
└── services/
    ├── supabase.service.js   # DB interactions (fetch competitor, save report)
    ├── brightdata.service.js # MCP integration for static HTML fetch
    ├── actionbook.service.js # Dynamic extraction fallback
    ├── acontext.service.js   # Memory layer for snapshots
    ├── diff.service.js       # Local delta computation (%)
    ├── parser.service.js     # HTML pricing parsing
    └── gemini.service.js     # LLM for insights (Gemini 2.5 Flash)
```

## 2. Express Server Setup (`server/app.js`)

```javascript
const express = require('express');
const cors = require('cors');
const scanRoutes = require('./routes/scan.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/scan', scanRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;
```

## 3. Auth Middleware (`server/src/middleware/auth.middleware.js`)

```javascript
const { createClient } = require('@supabase/supabase-js');
const { env } = require('../config/env');

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { requireAuth };
```

## 4. Bright Data Service (`server/src/services/brightdata.service.js`)

```javascript
const axios = require('axios');
const { env } = require('../config/env');

async function fetchCompetitorPage(url) {
  try {
    // Only 1 request permitted per scan.
    const response = await axios.get(url, {
      proxy: {
        protocol: 'http',
        host: env.BRIGHTDATA_PROXY_HOST,
        port: env.BRIGHTDATA_PROXY_PORT,
        auth: {
          username: env.BRIGHTDATA_USERNAME,
          password: env.BRIGHTDATA_PASSWORD
        }
      },
      rejectUnauthorized: false
    });
    
    return response.data; // Raw HTML
  } catch (error) {
    console.error('[BrightData Error]', error.message);
    throw new Error('Failed to fetch competitor page');
  }
}

module.exports = { fetchCompetitorPage };
```

## 5. ActionBook Service Wrapper (`server/src/services/actionbook.service.js`)

```javascript
const axios = require('axios');
const { env } = require('../config/env');

async function extractDynamicPricing(url) {
  // Use ONLY if static parsing fails
  const response = await axios.post(`${env.ACTIONBOOK_API_URL}/extract`, {
    url,
    prompt: "Extract pricing tiers. Return exactly this JSON format: { pricing: [{ tier: string, price: number }] }"
  }, {
    headers: { 'Authorization': `Bearer ${env.ACTIONBOOK_API_KEY}` }
  });

  return response.data.pricing || [];
}

module.exports = { extractDynamicPricing };
```

## 6. Pricing Parser (`server/src/services/parser.service.js`)

```javascript
const cheerio = require('cheerio');

function parsePricingFromHtml(html) {
  const $ = cheerio.load(html);
  const pricing = [];

  // Minimal heuristic suitable for MVP/hackathon
  $('.pricing-tier, [data-test="pricing-card"], .pricing-card').each((i, el) => {
    const tier = $(el).find('.tier-name, .plan-name, h3').text().trim() || 'Unknown';
    const priceText = $(el).find('.price, .amount').text().trim();
    
    const priceMatch = priceText.match(/\d+(\.\d{2})?/);
    const price = priceMatch ? parseFloat(priceMatch[0]) : null;

    if (price !== null) {
      pricing.push({ tier, price });
    }
  });

  return { pricing };
}

module.exports = { parsePricingFromHtml };
```

## 7. Delta Engine (`server/src/services/diff.service.js`)

```javascript
/**
 * Compares snapshots locally. No LLM used for diffing.
 */
function computeLocalDelta(oldSnapshot, newSnapshot) {
  if (!oldSnapshot || !oldSnapshot.pricing) {
    return { isFirstRun: true, hasSignificantChange: false, delta: newSnapshot };
  }

  const oldMap = new Map(oldSnapshot.pricing.map(p => [p.tier, p.price]));
  const changes = [];
  let absoluteChangeExceedsThreshold = false;

  newSnapshot.pricing.forEach(newTier => {
    const oldPrice = oldMap.get(newTier.tier);
    
    if (oldPrice === undefined) {
      changes.push({ type: 'added', tier: newTier.tier, current_price: newTier.price });
      absoluteChangeExceedsThreshold = true; // New tier is significant
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

  oldMap.forEach((oldPrice, tierName) => {
    changes.push({ type: 'removed', tier: tierName, old_price: oldPrice });
    absoluteChangeExceedsThreshold = true; // Removal is significant
  });

  return {
    isFirstRun: false,
    hasSignificantChange: changes.length > 0 && absoluteChangeExceedsThreshold,
    delta: { changes }
  };
}

module.exports = { computeLocalDelta };
```

## 8. Acontext Service (`server/src/services/acontext.service.js`)

```javascript
const axios = require('axios');
const { env } = require('../config/env');

const BASE_URL = env.ACONTEXT_API_URL;
const HEADERS = { 'Authorization': `Bearer ${env.ACONTEXT_API_KEY}` };

function getKey(userId) {
  return `competitor:${userId}:latest_snapshot`;
}

async function getLatestSnapshot(userId) {
  try {
    const res = await axios.get(`${BASE_URL}/memory/${getKey(userId)}`, { headers: HEADERS });
    return res.data.value; // Retrieved JSON block
  } catch (err) {
    if (err.response && err.response.status === 404) return null;
    return null; // Graceful degrade
  }
}

async function setLatestSnapshot(userId, snapshotData) {
  try {
    await axios.post(`${BASE_URL}/memory`, {
      key: getKey(userId),
      value: snapshotData // Overwrites previous due to key collision
    }, { headers: HEADERS });
  } catch (err) {
    console.error('[Acontext Set Error]', err.message);
  }
}

module.exports = { getLatestSnapshot, setLatestSnapshot };
```

## 9. Gemini 2.5 Flash Service (`server/src/services/gemini.service.js`)

```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { env } = require('../config/env');

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
// STRICT requirement: Gemini 2.5 Flash
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function analyzeDelta(deltaJson) {
  const prompt = `
    Analyze this competitor pricing change strict structured JSON.
    Provide a concise, deterministic strategic insight (max 120 words).
    Return strictly JSON: { "insight": "string", "classification": "Critical" | "Warning" | "Info" }
    
    Delta Data (Changes >= 5% or new/removed tiers):
    ${JSON.stringify(deltaJson)}
  `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    const cleanedText = responseText.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('[Gemini API Error]', error.message);
    return { insight: "Error generating insight fallback.", classification: "Unknown" };
  }
}

module.exports = { analyzeDelta };
```

## 10. Route Orchestration (`server/src/routes/scan.routes.js`)

```javascript
const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { runScan } = require('../controllers/scan.controller');

const router = express.Router();

router.post('/', requireAuth, runScan);

module.exports = router;
```

## 11. Final Scan Flow Pseudocode (`server/src/controllers/scan.controller.js`)

```javascript
const supabaseService = require('../services/supabase.service');
const brightData = require('../services/brightdata.service');
const actionBook = require('../services/actionbook.service');
const parser = require('../services/parser.service');
const acontext = require('../services/acontext.service');
const diffEngine = require('../services/diff.service');
const gemini = require('../services/gemini.service');

async function runScan(req, res, next) {
  try {
    const userId = req.user.id;

    // 1. Fetch user's SINGLE specified competitor
    const competitor = await supabaseService.getCompetitorForUser(userId);
    if (!competitor) return res.status(404).json({ error: 'No competitor configured' });

    // 2. Fetch HTML via Bright Data (Strict: 1 request only)
    let rawHtml = await brightData.fetchCompetitorPage(competitor.url);
    
    // 3. Parse structurally
    let newSnapshot = parser.parsePricingFromHtml(rawHtml);

    // 4. Fallback to ActionBook ONLY if static HTML yields nothing
    if (!newSnapshot.pricing || newSnapshot.pricing.length === 0) {
      newSnapshot = { pricing: await actionBook.extractDynamicPricing(competitor.url) };
    }

    // 5. Retrieve previous state (latest only)
    const oldSnapshot = await acontext.getLatestSnapshot(userId);

    // 6. Compute strict local diff
    const { isFirstRun, hasSignificantChange, delta } = diffEngine.computeLocalDelta(oldSnapshot, newSnapshot);

    // Default assume stable/no material change
    let llmInsight = { insight: "No material changes detected.", classification: "Stable" };

    // 7. Conditional Gemini Cost Control (Gemini 2.5 Flash)
    if (hasSignificantChange) {
       llmInsight = await gemini.analyzeDelta(delta);
    } else if (isFirstRun) {
       llmInsight = { insight: "Initial baseline established.", classification: "Stable" };
    }

    // 8. Overwrite Acontext memory (Latest state only)
    await acontext.setLatestSnapshot(userId, newSnapshot);

    // 9. Store Report for frontend rendering
    const finalReport = {
      competitor_id: competitor.id,
      user_id: userId,
      delta: hasSignificantChange ? delta : null,
      insight: llmInsight.insight,
      classification: llmInsight.classification,
      last_scan_time: new Date().toISOString()
    };
    await supabaseService.saveReport(finalReport);

    // 10. Return deterministic response
    return res.status(200).json({
      status: "completed",
      isFirstRun,
      hasSignificantChange,
      delta,
      insight: llmInsight.insight,
      classification: llmInsight.classification
    });

  } catch (error) {
    next(error);
  }
}

module.exports = { runScan };
```

## 12. Required Environment Variables (`.env`)

```env
# Server
PORT=3001
NODE_ENV=production

# Supabase Auth & DB
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Bright Data (Proxy)
BRIGHTDATA_PROXY_HOST=brd.superproxy.io
BRIGHTDATA_PROXY_PORT=22225
BRIGHTDATA_USERNAME=your_zone_username
BRIGHTDATA_PASSWORD=your_zone_password

# ActionBook
ACTIONBOOK_API_URL=https://api.actionbook.io/v1
ACTIONBOOK_API_KEY=your_actionbook_key

# Acontext (Memory)
ACONTEXT_API_URL=https://api.acontext.ai/v1
ACONTEXT_API_KEY=your_acontext_key

# Gemini AI (Requires Gemini 2.5 Flash access)
GEMINI_API_KEY=your_gemini_api_key
```

## 13. Example Request & Response Format

### Request
```http
POST /api/scan
Authorization: Bearer <SUPABASE_JWT>
Content-Type: application/json
```

### Response (No Material Change - Gemini Skipped)
```json
{
  "status": "completed",
  "isFirstRun": false,
  "hasSignificantChange": false,
  "delta": {
    "changes": []
  },
  "insight": "No material changes detected.",
  "classification": "Stable"
}
```

### Response (Significant Change - Gemini 2.5 Flash Analyzed)
```json
{
  "status": "completed",
  "isFirstRun": false,
  "hasSignificantChange": true,
  "delta": {
    "changes": [
      {
        "type": "increased",
        "tier": "Pro",
        "old_price": 49,
        "current_price": 59,
        "percent_change": 20.4
      }
    ]
  },
  "insight": "Competitor raised Pro tier by $10 (20%). Suggest examining feature additions that justified this increase or launching a targeted counter-campaign.",
  "classification": "Warning"
}
```
