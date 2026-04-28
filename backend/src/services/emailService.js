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
    console.log("Preparing to send email via Gmail SMTP to:", email);
    
    const info = await transporter.sendMail({
      from: `"CRM Platform" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "You're invited to CRM",
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Welcome to CRM</h2>
          <p>Click below to join and set up your account:</p>
          <a href="${inviteLink}" style="
            display: inline-block;
            padding: 10px 20px;
            background: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
          ">Accept Invite</a>
          <p style="margin-top: 20px;">If the button doesn't work, use this link:</p>
          <p>${inviteLink}</p>
        </div>
      `,
    });

    console.log("Email sent successfully:", info.response);
    return true;

  } catch (error) {
    console.error("EMAIL ERROR:", error);
    throw error;
  }
};

module.exports = { sendInviteEmail };
