const { Resend } = require('resend');

// Initialize Resend
// Note: You must add RESEND_API_KEY to your .env file
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_key_if_none_provided');

const sendInviteEmail = async (email, inviteLink) => {
  console.log("STEP 1: Preparing to send email");

  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY missing in backend");
  }

  console.log("STEP 2: Calling Resend API");

  try {
    const response = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "CRM Invite",
      html: `<a href="${inviteLink}">Accept Invite</a>`
    });

    console.log("STEP 3: Resend response:", response);

    return response.data || response;
  } catch (error) {
    console.error("Resend failed:", error);
    throw error;
  }
};

module.exports = {
  sendInviteEmail
};
