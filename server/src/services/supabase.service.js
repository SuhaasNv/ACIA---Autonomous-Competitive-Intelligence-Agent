const { createClient } = require('@supabase/supabase-js');
const { env } = require('../config/env');

// We use service_role for backend operations to bypass RLS, 
// using anon key as a fallback if service role isn't provided locally.
const adminKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
const supabaseAdmin = createClient(env.SUPABASE_URL, adminKey);

async function getCompetitorForUser(userId) {
    const { data, error } = await supabaseAdmin
        .from('competitors')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 indicates no rows returned
        console.error('[Supabase Error] getCompetitorForUser:', error);
        throw new Error('Failed to fetch competitor');
    }

    return data;
}

async function saveReport(reportData) {
    const { error } = await supabaseAdmin
        .from('reports')
        .insert([reportData]);

    if (error) {
        console.error('[Supabase Error] saveReport:', error);
        throw new Error('Failed to save report');
    }
}

async function createCompetitor(userId, name, url) {
    const existing = await getCompetitorForUser(userId);
    if (existing) {
        throw new Error('Limit reached: Single competitor only.');
    }

    const { data, error } = await supabaseAdmin
        .from('competitors')
        .insert([{ user_id: userId, name, url }])
        .select()
        .single();

    if (error) {
        console.error('[Supabase Error] createCompetitor:', error);
        throw new Error('Failed to create competitor');
    }

    return data;
}

async function getLatestReport(userId) {
    // First get the latest report
    const { data: latestReport, error: latestError } = await supabaseAdmin
        .from('reports')
        .select(`
            *,
            competitor:competitors ( name, url )
        `)
        .eq('user_id', userId)
        .order('last_scan_time', { ascending: false })
        .limit(1)
        .single();

    if (latestError && latestError.code !== 'PGRST116') {
        console.error('[Supabase Error] getLatestReport:', latestError);
        throw new Error('Failed to fetch latest report');
    }

    if (!latestReport) {
        return null;
    }

    // Check if this is the first report for the competitor by counting total reports
    const { count, error: countError } = await supabaseAdmin
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    if (countError) {
        console.error('[Supabase Error] getLatestReport count:', countError);
        // If count fails, just return the report without isFirstRun
        return latestReport;
    }

    // Add isFirstRun property based on whether this is the first report
    latestReport.isFirstRun = count === 1;

    return latestReport;
}

async function updateCompetitor(userId, competitorId, name, url) {
    // Verify competitor belongs to user
    const { data: existing, error: fetchError } = await supabaseAdmin
        .from('competitors')
        .select('*')
        .eq('id', competitorId)
        .eq('user_id', userId)
        .single();

    if (fetchError || !existing) {
        throw new Error('Competitor not found or access denied');
    }

    const { data, error } = await supabaseAdmin
        .from('competitors')
        .update({ name, url })
        .eq('id', competitorId)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) {
        console.error('[Supabase Error] updateCompetitor:', error);
        throw new Error('Failed to update competitor');
    }

    return data;
}

module.exports = { getCompetitorForUser, saveReport, createCompetitor, getLatestReport, updateCompetitor };
