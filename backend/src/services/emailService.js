const { Resend } = require('resend');

// Initialize Resend
// Note: You must add RESEND_API_KEY to your .env file
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_key_if_none_provided');

const sendInviteEmail = async (email, inviteLink) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is missing");
  }

  console.log("Sending email to:", email);
  console.log("Invite link:", inviteLink);

  try {
    const response = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "You're invited to CRM Platform",
      html: `         <h2>Welcome to CRM</h2>         <p>You have been invited to join the platform.</p>         <a href="${inviteLink}" target="_blank">Accept Invitation</a>
      `
    });

    console.log("Resend response:", response);

    if (!response || (!response.id && !response.data?.id)) {
      throw new Error("Email not accepted by Resend");
    }

    return response.data || response;
  } catch (error) {
    console.error("Resend failed:", error);
    throw error;
  }
};

module.exports = {
  sendInviteEmail
};
