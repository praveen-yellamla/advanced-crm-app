const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS
  },
  connectionTimeout: 10000, // 10 sec timeout so it fails before Axios does
  tls: {
    rejectUnauthorized: false
  }
});

/**
 * Sends a clean, user-friendly invite email to a new agent.
 * @param {string} toEmail - Recipient email
 * @param {string} inviteLink - The unique /accept-invite/:token URL
 * @param {string} name - Name of the person being invited
 * @param {string} role - Role they are being invited for
 */
const sendInviteEmail = async (toEmail, inviteLink, name = "Agent", role = "Agent") => {
  try {
    console.log(`[SMTP] Sending invite to: ${toEmail}`);
    
    await transporter.sendMail({
      from: `"CRM Platform" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "You're invited to join CRM",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #1e293b;">Hello ${name},</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.5;">
            You have been invited to join our CRM platform as <b>${role}</b>.
          </p>
          <p style="color: #475569; font-size: 16px;">Click below to accept:</p>
          <div style="margin: 30px 0;">
            <a href="${inviteLink}" style="padding: 12px 24px; background-color: #2563eb; color: white; border-radius: 5px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 12px;">
            This link expires in 24 hours. If you did not expect this, please ignore this email.
          </p>
        </div>
      `
    });

    return true;
  } catch (error) {
    console.error("Email Error:", error);
    return false;
  }
};

module.exports = sendInviteEmail;
