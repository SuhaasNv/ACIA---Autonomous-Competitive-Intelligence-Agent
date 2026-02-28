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
