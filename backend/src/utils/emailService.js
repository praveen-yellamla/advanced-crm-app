const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // Brevo uses STARTTLS on 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  connectionTimeout: 10000,
  tls: {
    rejectUnauthorized: false
  }
});

// SMTP verification removed from startup to prevent non-fatal connection crashes.
// Mail operations will still log errors during actual transmission attempts.

/**
 * Sends a clean, user-friendly invite email to a new agent.
 * @param {string} toEmail - Recipient email
 * @param {string} inviteLink - The unique /accept-invite/:token URL
 * @param {string} name - Name of the person being invited
 * @param {string} role - Role they are being invited for
 * @throws {Error} - Throws exact SMTP error if sending fails
 */
const sendInviteEmail = async (toEmail, inviteLink, name = "Agent", role = "Agent") => {
  try {
    console.log(`[SMTP] Sending invite to: ${toEmail}`);
    
    await transporter.sendMail({
      from: `"Advanced CRM" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: toEmail,
      subject: `Action Required: Join Advanced CRM as ${role}`,
      text: `Hello ${name},\n\nYou have been invited to join Advanced CRM as a ${role}.\n\nClick the link below to accept your invitation:\n${inviteLink}\n\nThis link expires in 24 hours.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>CRM Invitation</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0; }
            .header { background-color: #0f172a; padding: 30px 20px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }
            .content { padding: 40px 30px; }
            .greeting { color: #1e293b; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 20px; }
            .message { color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 30px; }
            .role-badge { display: inline-block; background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 4px 12px; border-radius: 20px; font-weight: 600; color: #334155; font-size: 14px; }
            .button-container { text-align: center; margin: 40px 0; }
            .button { background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block; transition: background-color 0.2s; }
            .button:hover { background-color: #1d4ed8; }
            .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; }
            .footer p { color: #64748b; font-size: 13px; margin: 0; }
            @media only screen and (max-width: 600px) {
              .container { margin: 0; border-radius: 0; border: none; }
              .content { padding: 30px 20px; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Advanced CRM</h1>
            </div>
            <div class="content">
              <p class="greeting">Hello ${name},</p>
              <p class="message">
                You have been invited to join the Advanced CRM platform. You've been assigned the role of <span class="role-badge">${role}</span>.
              </p>
              <p class="message">
                To activate your account and set up your workspace, please accept the invitation below.
              </p>
              <div class="button-container">
                <a href="${inviteLink}" class="button">Accept Invitation</a>
              </div>
              <p class="message" style="font-size: 14px; margin-bottom: 0;">
                If you have trouble clicking the button, copy and paste this link into your browser:<br>
                <a href="${inviteLink}" style="color: #2563eb; word-break: break-all;">${inviteLink}</a>
              </p>
            </div>
            <div class="footer">
              <p>This invitation expires in 24 hours.</p>
              <p style="margin-top: 8px;">If you weren't expecting this invitation, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    console.log(`[SMTP SUCCESS] Invite successfully sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error("[SMTP CRITICAL FAILURE] Exact Error:", error.message);
    console.error("[SMTP RAW ERROR]", error);
    // Throwing so the controller can send the exact error to the client
    throw new Error(`SMTP Error: ${error.message}`);
  }
};

/**
 * Sends a notification email when a task is assigned to an agent.
 * @param {string} toEmail - Agent email
 * @param {string} taskTitle - Title of the task
 * @param {string} priority - Priority of the task
 * @param {string} dueDate - Deadline
 * @param {string} name - Agent name
 */
const sendTaskAssignmentEmail = async (toEmail, taskTitle, priority, dueDate, name = "Agent") => {
  try {
    console.log(`[SMTP] Sending task notification to: ${toEmail}`);
    
    await transporter.sendMail({
      from: `"Advanced CRM" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: toEmail,
      subject: `Strategic Assignment: ${taskTitle}`,
      text: `Hello ${name},\n\nA new strategic task has been assigned to you: ${taskTitle}.\nPriority: ${priority}\nDeadline: ${dueDate}\n\nPlease login to your dashboard to review the details.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; }
            .header { background-color: #0f172a; padding: 40px 20px; text-align: center; }
            .badge { display: inline-block; background-color: #2563eb; color: #ffffff; padding: 4px 12px; border-radius: 20px; font-weight: 900; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; }
            .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 900; text-transform: uppercase; italic; }
            .content { padding: 40px 30px; }
            .priority-box { background-color: ${priority === 'Urgent' ? '#fff1f2' : '#f1f5f9'}; border: 1px solid ${priority === 'Urgent' ? '#fda4af' : '#cbd5e1'}; padding: 15px 20px; border-radius: 16px; margin: 20px 0; }
            .priority-text { color: ${priority === 'Urgent' ? '#e11d48' : '#334155'}; font-weight: 900; text-transform: uppercase; font-size: 11px; }
            .button { background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 800; font-size: 14px; display: inline-block; text-transform: uppercase; letter-spacing: 1px; }
            .footer { padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <span class="badge">Operational Alert</span>
              <h1>Task Assigned</h1>
            </div>
            <div class="content">
              <p style="color: #1e293b; font-size: 18px; font-weight: 700;">Hello ${name},</p>
              <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                A new strategic objective has been added to your queue. Efficiency in execution is paramount.
              </p>
              <div class="priority-box">
                <p class="priority-text">${priority} Priority</p>
                <p style="color: #0f172a; font-size: 18px; font-weight: 900; margin: 10px 0;">${taskTitle}</p>
                <p style="color: #64748b; font-size: 13px; font-weight: 600; margin-bottom: 0;">Deadline: ${dueDate || 'Not specified'}</p>
              </div>
              <div style="text-align: center; margin-top: 40px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/agent/dashboard" class="button">Access Cockpit</a>
              </div>
            </div>
            <div class="footer">
              Advanced CRM Strategic Engine • Automated Transmission
            </div>
          </div>
        </body>
        </html>
      `
    });

    console.log(`[SMTP SUCCESS] Task notification sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error("[SMTP ERROR] Task Notification Failed:", error.message);
    return false; // Don't crash the server for task notifications
  }
};

module.exports = {
  sendInviteEmail,
  sendTaskAssignmentEmail
};
