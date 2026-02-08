// netlify/functions/adminFetchVolunteers.js
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

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing supabase env');
      return { statusCode: 500, body: JSON.stringify({ error: 'server_misconfigured' }) };
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });

    // fetch volunteers (adjust columns as needed)
    const { data, error } = await supabase
      .from('volunteers')
      .select('*')
      .order('Timestamp', { ascending: false });

    if (error) {
      console.error('Supabase fetch error', error);
      return { statusCode: 500, body: JSON.stringify({ error: 'db_error', details: error }) };
    }

    // ensure contribution_text is present on each row (fallbacks) and log a sample for debugging
    const rows = data.map(r => ({
      ...r,
      contribution_text: (r.contribution_text || r.contribution || r.contributionText || '').toString()
    }));

    // build some quick analytics
    const total = rows.length;
    const byCity = rows.reduce((acc, r) => { const c = r.city || 'Unknown'; acc[c] = (acc[c] || 0) + 1; return acc; }, {});
    const byGender = rows.reduce((acc, r) => { const g = r.gender || 'Unknown'; acc[g] = (acc[g] || 0) + 1; return acc; }, {});

    // debug: output first 3 contribution values (will appear in function logs)
    try {
      console.log('sample contributions:', rows.slice(0,3).map(x => x.contribution_text));
    } catch(e){}

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, rows, analytics: { total, byCity, byGender } })
    };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'server_error', details: String(err) }) };
  }
};
