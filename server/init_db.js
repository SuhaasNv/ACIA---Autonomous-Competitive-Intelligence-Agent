const { Client } = require('pg');

async function createTables() {
  const client = new Client({
    connectionString: "postgresql://postgres.gltfjbxvhpgydwbjttei:Sireesha1973%23@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres",
    connectionTimeoutMillis: 10000,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("Connecting to Supabase on port 6543 with ssl rejectUnauthorized:false ...");
    await client.connect();
    console.log("Connected! Creating tables...");

    // Create Competitors Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.competitors (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create Reports Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.reports (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
        user_id UUID NOT NULL,
        delta JSONB,
        insight TEXT,
        classification TEXT,
        last_scan_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Reload Schema Cache so PostgREST picks up the new tables immediately
    await client.query(`NOTIFY pgrst, 'reload schema';`);

    console.log("Supabase Tables successfully created and schema cache reloaded.");
  } catch (error) {
    console.error("Execution error:", error);
  } finally {
    try {
      await client.end();
      console.log("Connection closed.");
    } catch (e) {
      console.error("Error closing connection:", e);
    }
    process.exit(0);
  }
}

createTables();
