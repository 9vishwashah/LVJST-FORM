// netlify/functions/adminLogin.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// debug block — temporary
const missing = [];
['ADMIN_ID','ADMIN_PASSWORD_HASH','ADMIN_JWT_SECRET','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY'].forEach(k=>{
  if (!process.env[k]) missing.push(k);
});
console.log('DEBUG env missing =>', missing);
if (missing.length) {
  return { statusCode: 500, body: JSON.stringify({ error: 'server_misconfigured', missing }) };
}




exports.handler = async function (event) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Only POST allowed' }) };
    }

    if (!process.env.ADMIN_ID || !process.env.ADMIN_PASSWORD_HASH || !process.env.ADMIN_JWT_SECRET) {
      console.error('Admin env not configured');
      return { statusCode: 500, body: JSON.stringify({ error: 'server_misconfigured' }) };
    }

    let body = {};
    try {
      body = JSON.parse(event.body || '{}');
    } catch (err) {
      return { statusCode: 400, body: JSON.stringify({ error: 'invalid_json' }) };
    }

    const { id, password } = body;
    if (!id || !password) {
      return { statusCode: 400, body: JSON.stringify({ error: 'missing_credentials' }) };
    }

    if (id !== process.env.ADMIN_ID) {
      return { statusCode: 401, body: JSON.stringify({ error: 'invalid_credentials' }) };
    }

    const ok = bcrypt.compareSync(password, process.env.ADMIN_PASSWORD_HASH);
    if (!ok) {
      return { statusCode: 401, body: JSON.stringify({ error: 'invalid_credentials' }) };
    }

    const token = jwt.sign(
      { sub: id, role: 'admin' },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: '1h' }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, token, expiresIn: 3600 })
    };
  } catch (err) {
    console.error('adminLogin error', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'server_error', details: String(err) }) };
  }
};
