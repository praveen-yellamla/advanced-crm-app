const nodemailer = require('nodemailer');
require('dotenv').config();

console.log("Testing SMTP with host:", process.env.SMTP_HOST);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  connectionTimeout: 10000
});

transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP TEST FAILED:", error);
  } else {
    console.log("SMTP TEST SUCCESSFUL");
  }
  process.exit();
});
