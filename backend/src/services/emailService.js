const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendInviteEmail = async (email, inviteLink) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "You're invited to CRM",
      html: `
        <h2>Welcome to CRM</h2>
        <p>Click below to join:</p>
        <a href="${inviteLink}">Accept Invite</a>
        <p>${inviteLink}</p>
      `,
    });

    console.log("SUCCESS EMAIL:", info);
    return true;

  } catch (error) {
    console.error("EMAIL ERROR FULL:", error);
    throw new Error(error.message);
  }
};

module.exports = { sendInviteEmail };
