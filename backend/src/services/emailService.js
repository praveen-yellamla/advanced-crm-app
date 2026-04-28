const { Resend } = require('resend');

// Initialize Resend
// Note: You must add RESEND_API_KEY to your .env file
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_key_if_none_provided');

const sendInviteEmail = async (email, inviteLink) => {
  try {
    console.log("=== EMAIL DEBUG START ===");
    console.log("API KEY:", process.env.RESEND_API_KEY ? "LOADED" : "MISSING");
    console.log("Sending to:", email);

    const response = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "You're invited to CRM",
      html: `
    <h2>Welcome to CRM</h2>
    <p>Click below to join:</p>
    <a href="${inviteLink}">Accept Invite</a>
  `
    });

    console.log("RESEND FULL RESPONSE:", JSON.stringify(response, null, 2));

    if (response.error) {
      console.log("RESEND ERROR:", response.error);
      throw new Error(response.error.message || "Resend failed");
    }

    console.log("=== EMAIL SENT SUCCESS ===");

    return response;
  } catch (err) {
    console.error("EMAIL SEND FAILED:", err);
    throw err;
  }
};

module.exports = {
  sendInviteEmail
};
