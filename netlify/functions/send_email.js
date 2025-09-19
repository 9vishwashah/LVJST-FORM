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

    // Transporter (using Gmail SMTP)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // set in Netlify environment
        pass: process.env.EMAIL_PASS, // use Gmail App Password
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
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
