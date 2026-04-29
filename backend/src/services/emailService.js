const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  debug: true, // Show debug output
  logger: true // Log information in console
});

// Verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error("TRANSPORTER VERIFICATION FAILED:", error);
  } else {
    console.log("Server is ready to take our messages");
  }
});


const sendInviteEmail = async (email, inviteLink) => {
  try {
    await transporter.sendMail({
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

  } catch (error) {
    console.error("EMAIL ERROR:", error);
    throw error;
  }
};

module.exports = { sendInviteEmail };
