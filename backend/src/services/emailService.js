const { Resend } = require('resend');

// Initialize Resend
// Note: You must add RESEND_API_KEY to your .env file
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_key_if_none_provided');

const sendInviteEmail = async (email, inviteLink) => {
  try {
    const data = await resend.emails.send({
      from: "CRM <onboarding@resend.dev>",
      to: email,
      subject: "You're invited to CRM",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #0F172A;">
          <h2>Welcome to CRM</h2>
          <p>You have been officially invited to join our platform.</p>
          <a href="${inviteLink}" style="display:inline-block; padding: 14px 28px; background: #0F172A; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">Accept Invite</a>
          <p style="font-size: 12px; color: #64748B;">This link will expire in 24 hours.</p>
        </div>
      `
    });
    
    console.log("Resend Email successful:", data);
    return data;
  } catch (error) {
    console.error("Email send error:", error);
    throw new Error("Failed to send email");
  }
};

module.exports = {
  sendInviteEmail
};
