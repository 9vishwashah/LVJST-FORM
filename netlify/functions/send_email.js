// netlify/functions/send_email.js
import { Resend } from 'resend';

export const handler = async (event) => {
  try {
    const { email, name } = JSON.parse(event.body);

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'LVJST Team <noreply@lvjst.org>',
      to: email,
      subject: 'Thank you for joining LVJST!',
      html: `
        <div style="font-family:Arial,sans-serif;padding:20px;">
          <h2>🙏 Namaste ${name},</h2>
          <p>We’ve successfully received your registration for <b>LVJST Membership</b>.</p>
          <p>Our team will review your details and contact you soon with further information.</p>
          <br>
          <p>Warm regards,</p>
          <strong>LVJST Team</strong><br>
          <a href="https://lvjst.org">lvjst.org</a>
        </div>
      `,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Email sent successfully' }),
    };
  } catch (error) {
    console.error('Email sending failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send email' }),
    };
  }
};
