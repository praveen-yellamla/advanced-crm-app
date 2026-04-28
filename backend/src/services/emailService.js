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
      html: `<a href="${inviteLink}">Accept Invite</a>`
    });

    console.log("RESEND SUCCESS:", response);
    return response;
  } catch (err) {
    console.error("RESEND ERROR:", err);
    throw err;
  }
};

module.exports = {
  sendInviteEmail
};
