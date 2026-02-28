-- Paste this into your Supabase SQL Editor

-- Table for Competitors
CREATE TABLE IF NOT EXISTS public.competitors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for Reports
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  delta JSONB,
  insight TEXT,
  classification TEXT,
  last_scan_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies (if using direct client access, but your backend uses Service Role so no strict required unless desired)
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only read and manage their own competitors" 
ON public.competitors FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only read and manage their own reports" 
ON public.reports FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);
