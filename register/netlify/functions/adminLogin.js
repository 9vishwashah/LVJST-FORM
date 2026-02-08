// netlify/functions/adminLogin.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const REQUIRED_ENVS = ['ADMIN_ID','ADMIN_PASSWORD_HASH','ADMIN_JWT_SECRET','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY'];
const missing = REQUIRED_ENVS.filter(k => !process.env[k]);
if (missing.length) {
  console.error('Missing env:', missing);
  // return a body synchronously is tricky in modules; just let handler handle it.
}

exports.handler = async function(event) {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Only POST allowed' }) };

    if (missing.length) {
      return { statusCode: 500, body: JSON.stringify({ error: 'server_misconfigured', missing }) };
    }

    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch(e) { return { statusCode: 400, body: JSON.stringify({ error: 'invalid_json' }) }; }

    const { id, password } = body;
    if (!id || !password) return { statusCode: 400, body: JSON.stringify({ error: 'missing_credentials' }) };

    if (id !== process.env.ADMIN_ID) return { statusCode: 401, body: JSON.stringify({ error: 'invalid_credentials' }) };

    const ok = bcrypt.compareSync(password, process.env.ADMIN_PASSWORD_HASH);
    if (!ok) return { statusCode: 401, body: JSON.stringify({ error: 'invalid_credentials' }) };

    const token = jwt.sign({ sub: id, role: 'admin' }, process.env.ADMIN_JWT_SECRET, { expiresIn: '1h' });

    return { statusCode: 200, body: JSON.stringify({ ok: true, token, expiresIn: 3600 }) };
  } catch (err) {
    console.error('adminLogin error', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'server_error', details: String(err) }) };
  }
};
