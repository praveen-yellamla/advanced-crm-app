const { Resend } = require('resend');

// Initialize Resend
// Note: You must add RESEND_API_KEY to your .env file

const sendInviteEmail = async (email, inviteLink) => {
  try {
    console.log("=== EMAIL DEBUG START ===");
    const apiKey = process.env.RESEND_API_KEY;
    console.log("API KEY (masked):", apiKey ? apiKey.substring(0, 10) + "..." : "MISSING");
    console.log("Sending to:", email);
    console.log("Invite link:", inviteLink);

    if (!apiKey || apiKey === 're_placeholder_key_if_none_provided') {
       throw new Error("RESEND_API_KEY is missing or invalid in environment variables.");
    }

    const resend = new Resend(apiKey);

    const response = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "You're invited to CRM",
      html: `
    <div style="font-family: sans-serif; padding: 20px;">
      <h2>Welcome to CRM</h2>
      <p>Click below to join our platform and set up your account:</p>
      <a href="${inviteLink}" style="display:inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Accept Invite</a>
      <p style="margin-top: 20px; font-size: 12px; color: #64748B;">If the button doesn't work, copy and paste this link: ${inviteLink}</p>
    </div>
  `
    });

    console.log("RESEND FULL RESPONSE:", JSON.stringify(response, null, 2));

    if (response.error) {
      console.log("RESEND API ERROR:", response.error);
      throw new Error(`Resend API Error: ${response.error.message || JSON.stringify(response.error)}`);
    }

    console.log("=== EMAIL SENT SUCCESS ===");
    return response;
  } catch (err) {
    console.error("CRITICAL EMAIL FAILURE:", err);
    throw err;
  }
};

module.exports = {
  sendInviteEmail
};
