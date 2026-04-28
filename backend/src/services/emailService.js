const { Resend } = require('resend');

// Initialize Resend
// Note: You must add RESEND_API_KEY to your .env file
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_key_if_none_provided');

const sendInviteEmail = async (email, inviteLink) => {
  try {
    const response = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "You're invited to join CRM",
      html: `         <h2>Welcome to CRM</h2>         <p>You have been invited to join the platform.</p>         <p>Click below to activate your account:</p>         <a href="${inviteLink}" style="padding:10px 20px;background:#2563eb;color:white;text-decoration:none;border-radius:5px;">
          Accept Invitation         </a>
      `
    });
    
    console.log("EMAIL SENT:", response);
    return response;
  } catch (error) {
    console.error("EMAIL ERROR:", error);
    throw error;
  }
};

module.exports = {
  sendInviteEmail
};
