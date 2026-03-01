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

    // Harden Supabase: Enable RLS and setup policies for competitors
    await client.query(`
      ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
      
      DO $$ BEGIN
        CREATE POLICY "Users can view their own competitors" ON public.competitors FOR SELECT USING (auth.uid() = user_id);
      EXCEPTION WHEN duplicate_object THEN null; END $$;
      
      DO $$ BEGIN
        CREATE POLICY "Users can insert their own competitors" ON public.competitors FOR INSERT WITH CHECK (auth.uid() = user_id);
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE POLICY "Users can update their own competitors" ON public.competitors FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE POLICY "Users can delete their own competitors" ON public.competitors FOR DELETE USING (auth.uid() = user_id);
      EXCEPTION WHEN duplicate_object THEN null; END $$;
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

    // Harden Supabase: Enable RLS and setup policies for reports
    await client.query(`
      ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

      DO $$ BEGIN
        CREATE POLICY "Users can view their own reports" ON public.reports FOR SELECT USING (auth.uid() = user_id);
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE POLICY "Users can insert their own reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = user_id);
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE POLICY "Users can update their own reports" ON public.reports FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE POLICY "Users can delete their own reports" ON public.reports FOR DELETE USING (auth.uid() = user_id);
      EXCEPTION WHEN duplicate_object THEN null; END $$;
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
