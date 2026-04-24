const nodemailer = require('nodemailer');

/**
 * Utility to send emails using Nodemailer
 * @param {Object} options - Email options (email, subject, message)
 */
const sendEmail = async (options) => {
  // Create a transporter
  // For production, use service like Gmail, SendGrid, Mailgun, etc.
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Define email options
  const mailOptions = {
    from: `"Advanced CRM" <${process.env.EMAIL_FROM}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  // Send email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
