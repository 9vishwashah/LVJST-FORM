// netlify/functions/adminLogin.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Only POST' }) };
    }
    const body = JSON.parse(event.body || '{}');
    const { id, password } = body;

    if (!process.env.ADMIN_ID || !process.env.ADMIN_PASSWORD_HASH || !process.env.ADMIN_JWT_SECRET) {
      console.error('Admin env not configured');
      return { statusCode: 500, body: JSON.stringify({ error: 'server_misconfigured' }) };
    }

    if (!id || !password) {
      return { statusCode: 400, body: JSON.stringify({ error: 'missing_credentials' }) };
    }

    if (id !== process.env.ADMIN_ID) {
      return { statusCode: 401, body: JSON.stringify({ error: 'invalid_credentials' }) };
    }

    const hash = process.env.ADMIN_PASSWORD_HASH;
    const ok = bcrypt.compareSync(password, hash);
    if (!ok) {
      return { statusCode: 401, body: JSON.stringify({ error: 'invalid_credentials' }) };
    }

    // Create JWT (short expiry)
    const token = jwt.sign(
      { sub: id, role: 'admin' },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: '1h' }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, token, expiresIn: 3600 }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'server_error' }) };
  }
};
