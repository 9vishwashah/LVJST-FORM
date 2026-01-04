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
      attend_orientation,
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

    // Allow bypassing reCAPTCHA checks for local/dev when explicitly requested.
    // Set DISABLE_RECAPTCHA_CHECK=true in Netlify dev env to skip server-side verification.
    const disableRecaptcha = String(process.env.DISABLE_RECAPTCHA_CHECK || '').toLowerCase() === 'true';
    if (disableRecaptcha) {
      console.log('reCAPTCHA verification skipped because DISABLE_RECAPTCHA_CHECK=true');
    } else if (process.env.RECAPTCHA_SECRET) {
      const recResult = await verifyRecaptcha(recaptchaToken, process.env.RECAPTCHA_SECRET);
      if (!recResult || !recResult.success) {
        return {
          statusCode: 403,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'recaptcha_failed', details: recResult })
        };
      }
      // Optional: for v3, you can check recResult.score >= 0.4 here
    } else {
      // No RECAPTCHA_SECRET and not disabled — nothing to validate.
      console.log('No RECAPTCHA_SECRET configured; skipping server-side verification');
    }

    // Create Supabase client using service role (server-side only)
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    // No sendgrid package required — we'll call SendGrid HTTP API directly if API key is provided

    const insertPayload = {
      full_name: String(full_name).trim(),
      email: String(email).trim(),
      mobile_number: String(mobile_number).trim(),
      gender: gender ? String(gender).trim() : null,
      education: education ? String(education).trim() : null,
      city: city ? String(city).trim() : null,
      address: address ? String(address).trim() : null,
      skills: skills || null, // expects array/object that fits your jsonb column
      attend_orientation: attend_orientation ? String(attend_orientation).trim() : null,
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

    // Attempt to send acknowledgement email (non-blocking — failures won't fail the request)
    let emailResult = null;
    try {
      const fromEmail = process.env.FROM_EMAIL || process.env.SENDGRID_FROM || 'noreply@lvjst.org';
      const toEmail = String(email).trim();
      if (process.env.SENDGRID_API_KEY && toEmail) {
        const subject = `Thanks for registering with LVJST — ${insertPayload.full_name}`;
        const text = `Dear ${insertPayload.full_name},\n\nThank you for registering as a volunteer with LVJST. We will reach out to you shortly.\n\n— LVJST Team`;
        const html = generateTemplateHtml(insertPayload.full_name);

        const sgBody = {
          personalizations: [{ to: [{ email: toEmail }], subject }],
          from: { email: fromEmail },
          content: [
            { type: 'text/plain', value: text },
            { type: 'text/html', value: html }
          ]
        };

        const resp = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(sgBody)
        });

        if (!resp.ok) {
          const txt = await resp.text();
          console.error('SendGrid HTTP error:', resp.status, txt);
          emailResult = { ok: false, status: resp.status, details: txt };
        } else {
          emailResult = { ok: true };
        }
      }
    } catch (e) {
      console.error('SendGrid send error:', e);
      emailResult = { ok: false, error: String(e) };
    }

    // return created row and email send status
    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, row: data && data[0] ? data[0] : data, email: emailResult })
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

// HTML email template generator (same design used in send_email.js)
function generateTemplateHtml(firstName) {
  const name = firstName || 'Volunteer';
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Thank You for Registering with LVJST</title>
</head>

<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, Helvetica, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:30px 10px;">

        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden;">

          <!-- LOGO -->
          <tr>
            <td align="center" style="padding:25px;">
              <img 
                src="https://lvjst.netlify.app/assets/lvjst-logo.png"
                alt="LVJST Logo"
                style="max-width:200px; height:auto;"
              />
            </td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td style="padding:30px; color:#333333; font-size:15px; line-height:1.6;">

              <p><strong>Dear ${escapeHtml(name)},</strong></p>

              <p>
                Thank you for registering for <strong>Labdhi Vikram Jan Seva Trust (LVJST)</strong> Membership.
              </p>

              <p>
                We have successfully received your registration details. Our team will review the information submitted and contact you shortly regarding the next steps.
              </p>

              <p>
                We appreciate your interest in joining LVJST and supporting our initiatives dedicated to service, research, and community welfare.
              </p>

              <hr style="border:none; border-top:1px solid #e6e6e6; margin:30px 0;">

              <p style="font-weight:bold; margin-bottom:15px;">
                Stay Connected with LVJST
              </p>

              <!-- BUTTONS -->
              <table cellpadding="0" cellspacing="0">

                <tr>
                  <td style="padding-bottom:10px;">
                    <a href="https://lvjst.netlify.app"
                       style="display:inline-block; padding:10px 20px; background:#2c3e50; color:#ffffff; text-decoration:none; border-radius:4px; font-size:14px;">
                      Visit Website
                    </a>
                  </td>
                </tr>

                <tr>
                  <td style="padding-bottom:10px;">
                    <a href="https://www.instagram.com/lvjst_org/"
                       style="display:inline-block; padding:10px 20px; background:#c13584; color:#ffffff; text-decoration:none; border-radius:4px; font-size:14px;">
                      Follow on Instagram
                    </a>
                  </td>
                </tr>

                <tr>
                  <td>
                    <a href="https://chat.whatsapp.com/IRvseAYqwi4Kroani5YbvW"
                       style="display:inline-block; padding:10px 20px; background:#25D366; color:#ffffff; text-decoration:none; border-radius:4px; font-size:14px;">
                      Join WhatsApp Group
                    </a>
                  </td>
                </tr>

              </table>

              <p style="margin-top:30px;">
                If you have any questions, feel free to reply to this email.
              </p>

              <p>
                With gratitude,<br>
                <strong>Labdhi Vikram Jan Seva Trust (LVJST)</strong><br>
                <a href="https://lvjst.org" style="color:#2c3e50; text-decoration:none;">
                  lvjst.org
                </a>
              </p>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding:15px; background:#f0f2f4; font-size:12px; color:#777;">
              © Labdhi Vikram Jan Seva Trust (LVJST)
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
