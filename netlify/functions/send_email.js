// ✅ CommonJS syntax - works 100% with Netlify
const { Resend } = require("resend");

exports.handler = async (event) => {
  try {
    // Parse form payload
    const { email, name } = JSON.parse(event.body || "{}");

    if (!email) {
      console.error("❌ Missing recipient email in request body");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing email" }),
      };
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("❌ RESEND_API_KEY missing in environment");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "API key missing" }),
      };
    }

    // Initialize Resend client
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Send email
    const { data, error } = await resend.emails.send({
      from: "LVJST <onboarding@resend.dev>", // works with sandbox domain
      to: email,
      subject: "🙏 Thank you for joining LVJST!",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
          <h2>Dear ${name || "Volunteer"},</h2>
          <p>We’ve successfully received your registration for <strong>LVJST Membership</strong>.</p>
          <p>Our team will review your details and contact you soon.</p>
          <br>
          <p>With gratitude,<br><b>Labdhi Vikram Jan Seva Trust (LVJST)</b><br>
          <a href="https://lvjst.org">lvjst.org</a></p>
        </div>
      `,
    });

    if (error) {
      console.error("❌ Resend API Error:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      };
    }

    console.log("✅ Email sent successfully via Resend:", data);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Email sent successfully" }),
    };
  } catch (err) {
    console.error("❌ send_email.js crash:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
