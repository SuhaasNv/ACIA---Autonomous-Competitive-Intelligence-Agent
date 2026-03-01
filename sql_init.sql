CREATE TABLE IF NOT EXISTS competitors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Harden Supabase: Enable Row Level Security (RLS)
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view their own competitors"
ON competitors FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own competitors"
ON competitors FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own competitors"
ON competitors FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own competitors"
ON competitors FOR DELETE
USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  delta JSONB,
  insight TEXT,
  classification TEXT,
  last_scan_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Harden Supabase: Enable Row Level Security (RLS)
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view their own reports"
ON reports FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reports"
ON reports FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports"
ON reports FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports"
ON reports FOR DELETE
USING (auth.uid() = user_id);
