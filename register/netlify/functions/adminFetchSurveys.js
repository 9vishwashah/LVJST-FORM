// netlify/functions/adminFetchSurveys.js
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

function verifyAuth(event) {
    const authHeader = event.headers?.authorization || event.headers?.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.slice('Bearer '.length);
    try {
        const payload = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
        return payload;
    } catch (err) {
        return null;
    }
}

exports.handler = async (event) => {
    try {
        // verify token
        const payload = verifyAuth(event);
        if (!payload || payload.role !== 'admin') {
            return { statusCode: 401, body: JSON.stringify({ error: 'unauthorized' }) };
        }

        // Use PRE-SURVEY specific env vars
        const SUPABASE_URL = process.env.SUPABASE_URL_PRE_SURVEY;
        const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY_PRE_SURVEY;

        if (!SUPABASE_URL || !SUPABASE_KEY) {
            console.error('Missing Pre-Survey Supabase env vars');
            return { statusCode: 500, body: JSON.stringify({ error: 'server_misconfigured' }) };
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: { persistSession: false }
        });

        // fetch surveys
        const { data, error } = await supabase
            .from('temple_surveys')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase fetch error', error);
            return { statusCode: 500, body: JSON.stringify({ error: 'db_error', details: error }) };
        }

        // build some quick analytics
        const rows = data || [];
        const total = rows.length;
        // Simple analytics: Count by City
        const byCity = rows.reduce((acc, r) => {
            const c = r.filler_city || 'Unknown';
            acc[c] = (acc[c] || 0) + 1;
            return acc;
        }, {});

        // Simple analytics: Count by District
        const byDistrict = rows.reduce((acc, r) => {
            const d = r.district || 'Unknown';
            acc[d] = (acc[d] || 0) + 1;
            return acc;
        }, {});

        return {
            statusCode: 200,
            body: JSON.stringify({ ok: true, rows, analytics: { total, byCity, byDistrict } })
        };

    } catch (err) {
        console.error(err);
        return { statusCode: 500, body: JSON.stringify({ error: 'server_error', details: String(err) }) };
    }
};
