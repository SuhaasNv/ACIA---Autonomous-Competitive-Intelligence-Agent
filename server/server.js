require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const app = require('./src/app');
const port = process.env.PORT || 3001;

if (!process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.VITE_SUPABASE_ANON_KEY) {
    console.warn('[Server] ⚠️  SUPABASE_SERVICE_ROLE_KEY not set. Add it from Supabase Dashboard → Settings → API for backend to work.');
}

app.listen(port, () => {
    console.log(`[Server] ACIA MVP API listening on port ${port}`);
    console.log(`[Server] Health: http://localhost:${port}/api/health`);
});
