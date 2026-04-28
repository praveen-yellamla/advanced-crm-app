const { Resend } = require('resend');

// Initialize Resend
// Note: You must add RESEND_API_KEY to your .env file
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_key_if_none_provided');

const sendInviteEmail = async (email, inviteLink) => {
  try {
    console.log("CALLING RESEND for:", email);

    const response = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "CRM Invitation",
      html: `       <h2>You are invited</h2>       <p>Click below to join:</p>       <a href="${inviteLink}">Accept Invite</a>
    `
    });
    
    console.log("RESEND RESPONSE:", response);
    
    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.data || response;
  } catch (error) {
    console.error("EMAIL ERROR:", error);
    throw error;
  }
};

module.exports = {
  sendInviteEmail
};
