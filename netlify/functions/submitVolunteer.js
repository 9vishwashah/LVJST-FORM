import { createClient } from '@supabase/supabase-js';
console.log('RUNTIME ENV:', Object.keys(process.env));

async function verifyRecaptcha(token, secret) {
  if (!token || !secret) return { success: false, error: 'missing_token_or_secret' };
  const params = new URLSearchParams();
  params.append('secret', secret);
  params.append('response', token);

  const resp = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    body: params
  });
  return resp.json(); // returns { success, score, action, ... }
}

export async function handler (event, context) {

  console.log('ENV CHECK', {
  SUPABASE_URL: !!process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  RECAPTCHA_SECRET: !!process.env.RECAPTCHA_SECRET
});

  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Only POST allowed' })
      };
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'server_misconfigured' })
      };
    }

    const payload = JSON.parse(event.body || '{}');

    const {
      full_name,
      email,
      mobile_number,
      gender,
      education,
      city,
      address,
      skills,
      contribution_text,
      reference,
      age,
      recaptchaToken
    } = payload;

    // Basic validation
    if (!full_name || !email || !mobile_number || !reference) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required fields: full_name, email, mobile_number, or reference' })
      };
    }

    // Validate age if present
    if (age !== undefined && age !== null) {
      const n = Number(age);
      if (Number.isNaN(n) || n < 1 || n > 120) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Invalid age value' })
        };
      }
    }

    // If RECAPTCHA_SECRET is provided in env, validate token
    if (process.env.RECAPTCHA_SECRET) {
      const recResult = await verifyRecaptcha(recaptchaToken, process.env.RECAPTCHA_SECRET);
      if (!recResult || !recResult.success) {
        return {
          statusCode: 403,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'recaptcha_failed', details: recResult })
        };
      }
      // Optional: for v3, you can check recResult.score >= 0.4 here
    }

    // Create Supabase client using service role (server-side only)
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    const insertPayload = {
      full_name: String(full_name).trim(),
      email: String(email).trim(),
      mobile_number: String(mobile_number).trim(),
      gender: gender ? String(gender).trim() : null,
      education: education ? String(education).trim() : null,
      city: city ? String(city).trim() : null,
      address: address ? String(address).trim() : null,
      skills: skills || null, // expects array/object that fits your jsonb column
      contribution_text: contribution_text ? String(contribution_text).trim() : null,
      reference: String(reference).trim(),
      age: age ? Number(age) : null,
      Timestamp: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('volunteers')
      .insert([insertPayload])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'db_insert_failed', details: error })
      };
    }

    // return created row
    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, row: data && data[0] ? data[0] : data })
    };

  } catch (err) {
    console.error('Function error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'server_error', details: String(err) })
    };
  }
}
