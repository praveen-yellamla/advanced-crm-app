const nodemailer = require("nodemailer");

// Initialize transporter with Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Use Gmail App Password
  },
});

/**
 * Sends a production-grade invite email to a new agent.
 * @param {string} toEmail - Recipient email
 * @param {string} inviteLink - The unique /accept-invite/:token URL
 * @param {string} userName - Optional: Name of the person being invited
 */
const sendInviteEmail = async (toEmail, inviteLink, userName = "Agent") => {
  try {
    console.log(`[SMTP] Initializing invite sequence for: ${toEmail}`);
    
    const info = await transporter.sendMail({
      from: `"Advanced CRM Platform" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "Invitation to Join the Advanced CRM Ecosystem",
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f1f5f9; border-radius: 24px;">
          <div style="text-align: center; margin-bottom: 40px;">
             <h1 style="color: #0f172a; font-weight: 900; letter-spacing: -0.05em; margin: 0;">ADV.CRM</h1>
             <p style="color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; margin-top: 10px;">Authority Portal Access</p>
          </div>
          
          <h2 style="color: #0f172a; font-size: 24px; font-weight: 800; margin-bottom: 16px;">Welcome, ${userName}</h2>
          <p style="color: #475569; line-height: 1.6; margin-bottom: 32px;">You have been officially invited to join the <strong>Advanced CRM</strong> operations team. Your credentials and secure node access are ready for activation.</p>
          
          <div style="text-align: center;">
            <a href="${inviteLink}" style="display: inline-block; padding: 20px 40px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 900; font-size: 12px; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.1em; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.4);">
              Initialize Secure Access
            </a>
          </div>
          
          <p style="color: #94a3b8; font-size: 11px; margin-top: 40px; text-align: center; font-style: italic;">
            This link is valid for 24 hours. If you did not expect this invite, please ignore this transmission.
          </p>
        </div>
      `,
    });

    console.log(`[SMTP] Success: Message delivered to ${toEmail} | ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("[SMTP ERROR] Connection Failure or Authentication Denied:", error);
    return false;
  }
};

module.exports = sendInviteEmail;
