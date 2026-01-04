// ✅ CommonJS syntax - works with Netlify
const { Resend } = require("resend");

// Helper to send via SendGrid HTTP API if available
async function sendViaSendGrid(toEmail, name) {
  if (!process.env.SENDGRID_API_KEY) {
    return { ok: false, reason: 'no_sendgrid_key' };
  }
  const fromEmail = process.env.FROM_EMAIL || 'LVJST <noreply@lvjst.org>';
  const subject = '🙏 Thank you for joining LVJST!';
  const text = `Dear ${name || 'Volunteer'},\n\nWe’ve successfully received your registration for LVJST Membership. Our team will review your details and contact you soon.\n\n— LVJST Team`;
  const html = `<div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">` +
    `<h2>Dear ${name || 'Volunteer'},</h2>` +
    `<p>We’ve successfully received your registration for <strong>LVJST Membership</strong>.</p>` +
    `<p>Our team will review your details and contact you soon.</p>` +
    `<br><p>With gratitude,<br><b>Labdhi Vikram Jan Seva Trust (LVJST)</b><br><a href="https://lvjst.org">lvjst.org</a></p></div>`;

  const body = {
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
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const details = await resp.text().catch(() => null);
    return { ok: false, status: resp.status, details };
  }
  return { ok: true };
}

exports.handler = async (event) => {
  try {
    const { email, name } = JSON.parse(event.body || '{}');

    if (!email) {
      console.error('❌ Missing recipient email in request body');
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing email' }) };
    }

    // Prefer Resend if configured
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      try {
        const data = await resend.emails.send({
          from: process.env.FROM_EMAIL || 'LVJST <onboarding@resend.dev>',
          to: email,
            subject: '🙏 Thank you for joining LVJST!',
              html: `${generateTemplateHtml(name)}`
        });
        console.log('✅ Email sent via Resend', data);
        return { statusCode: 200, body: JSON.stringify({ message: 'Email sent via Resend' }) };
      } catch (err) {
        console.error('❌ Resend send error:', err);
        // fall through to try SendGrid if available
      }
    }

    // If Resend not configured or failed, try SendGrid
    if (process.env.SENDGRID_API_KEY) {
      const sg = await sendViaSendGrid(email, name);
      if (sg.ok) {
        return { statusCode: 200, body: JSON.stringify({ message: 'Email sent via SendGrid' }) };
      }
      console.error('❌ SendGrid send failed:', sg);
      return { statusCode: 500, body: JSON.stringify({ error: 'sendgrid_failed', details: sg }) };
    }

    console.warn('No email provider configured (RESEND_API_KEY or SENDGRID_API_KEY)');
    return { statusCode: 200, body: JSON.stringify({ ok: false, skipped: 'email_not_configured' }) };

  } catch (err) {
    console.error('❌ send_email.js crash:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

// HTML email template generator — uses the provided design and inserts first name
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
          <!-- LOGO -->
<tr>
  <td align="center" style="padding:12px 20px 8px 20px;">
    <img 
      src="https://lvjst.netlify.app/assets/lvjst-logo.png"
      alt="LVJST Logo"
      style="max-width:80px; height:auto; display:block;"
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
