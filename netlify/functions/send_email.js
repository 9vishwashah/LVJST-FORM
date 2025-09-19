import nodemailer from "nodemailer";

export async function handler(event, context) {
  try {
    const body = JSON.parse(event.body);
    const userEmail = body.email;
    const userName = body.name || "Friend";

    if (!userEmail) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Email is required" }),
      };
    }

    // Gmail SMTP setup
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER, // your Gmail address
        pass: process.env.EMAIL_PASS, // 16-digit App Password
      },
    });

    const mailOptions = {
      from: `"LVJST" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: "Welcome to LVJST ✨",
      html: `
        <h2>Hi ${userName},</h2>
        <p>Thank you for registering for <b>Rushabhayan 2.0</b>!</p>
        <p>We are excited to have you onboard 🚀</p>
        <br/>
        <p>Warm regards,<br/>LVJST Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Confirmation email sent successfully!" }),
    };
  } catch (err) {
    console.error("Email send error:", err); // log full error to Netlify logs
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
