require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: "yp.yadav0786@gmail.com",
    pass: "edonkxqdzdisfedf",
  },
  tls: {
    rejectUnauthorized: false
  }
});

async function testEmail() {
  try {
    console.log("Verifying connection...");
    await transporter.verify();
    console.log("Connection verified successfully!");
    
    const info = await transporter.sendMail({
      from: '"Test" <yp.yadav0786@gmail.com>',
      to: "yp.yadav0786@gmail.com",
      subject: "Test Email from Local Script",
      text: "This is a test to verify SMTP credentials.",
    });
    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Error connecting or sending email:", error);
  }
}

testEmail();
