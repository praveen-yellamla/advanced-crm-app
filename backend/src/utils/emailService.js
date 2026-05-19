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

const sendAgentInvitationEmail = async (toEmail, inviteLink, name = "there", adminName, teamName) => {
  try {
    console.log(`[SMTP] Sending agent invite to: ${toEmail}`);
    await transporter.sendMail({
      from: `"CRM.PRO" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: toEmail,
      subject: `You're invited to join ${teamName} on CRM.PRO`,
      text: `Hi ${name},\n\n${adminName} has invited you to join ${teamName} on CRM.PRO.\n\nAccept your invitation & set up your account here: ${inviteLink}\n\nThis invitation expires in 72 hours.\n\nIf you didn't expect this, ignore this email.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>CRM.PRO Invitation</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 0; }
            .container { max-width: 550px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
            .logo-header { background-color: #0f172a; padding: 32px; text-align: center; }
            .logo-text { font-size: 28px; font-weight: 800; color: #ffffff; margin: 0; letter-spacing: -0.5px; }
            .logo-accent { color: #3b82f6; }
            .body-content { padding: 40px; }
            .headline { font-size: 22px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px; }
            .text-content { font-size: 15px; color: #475569; line-height: 1.625; margin-bottom: 24px; }
            .btn-holder { text-align: center; margin: 36px 0; }
            .btn-cta { background-color: #3b82f6; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2); transition: background-color 0.2s; }
            .btn-cta:hover { background-color: #2563eb; }
            .meta-info { border-top: 1px solid #f1f5f9; padding-top: 24px; font-size: 13px; color: #94a3b8; line-height: 1.5; }
            .footer-branding { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px; text-align: center; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo-header">
              <h1 class="logo-text">CRM<span class="logo-accent">.PRO</span></h1>
            </div>
            <div class="body-content">
              <h2 class="headline">Hi ${name || 'there'},</h2>
              <p class="text-content">
                <strong>${adminName}</strong> has invited you to join the <strong>${teamName}</strong> team on CRM.PRO.
              </p>
              <p class="text-content">
                To accept this invitation and complete your registration, click the button below:
              </p>
              <div class="btn-holder">
                <a href="${inviteLink}" class="btn-cta">Accept Invitation & Set Up Your Account</a>
              </div>
              <p class="text-content" style="font-size: 13px; color: #94a3b8; word-break: break-all;">
                Or copy and paste this link in your browser: <br>
                <a href="${inviteLink}" style="color: #3b82f6; text-decoration: none;">${inviteLink}</a>
              </p>
              <div class="meta-info">
                <p style="margin: 0 0 6px 0;">⌛ This invitation link is unique to you and will expire in <strong>72 hours</strong>.</p>
                <p style="margin: 0;">🔒 If you did not expect this invitation, you can safely ignore this email.</p>
              </div>
            </div>
            <div class="footer-branding">
              &copy; ${new Date().getFullYear()} CRM.PRO Enterprise Inc. All rights reserved.
            </div>
          </div>
        </body>
        </html>
      `
    });
    console.log(`[SMTP SUCCESS] Invite successfully sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error("[SMTP CRITICAL FAILURE] sendAgentInvitationEmail Error:", error.message);
    throw new Error(`SMTP Error: ${error.message}`);
  }
};

const sendWelcomeAgentEmail = async (toEmail, name = "there") => {
  try {
    console.log(`[SMTP] Sending welcome email to: ${toEmail}`);
    const loginLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
    await transporter.sendMail({
      from: `"CRM.PRO" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: toEmail,
      subject: `Welcome to CRM.PRO — Your account is ready!`,
      text: `Hi ${name},\n\nWelcome to CRM.PRO! Your agent workspace is ready.\n\nLogin Email: ${toEmail}\nLogin here: ${loginLink}\n\nQuick Start Tips:\n1. Update your profile and notification preferences.\n2. Access your dedicated Agent dashboard for real-time lead analytics.\n3. Make calls and log client activities on your cockpit.\n\nGood luck!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to CRM.PRO</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 0; }
            .container { max-width: 550px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
            .logo-header { background-color: #0f172a; padding: 32px; text-align: center; }
            .logo-text { font-size: 28px; font-weight: 800; color: #ffffff; margin: 0; letter-spacing: -0.5px; }
            .logo-accent { color: #3b82f6; }
            .body-content { padding: 40px; }
            .headline { font-size: 22px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px; }
            .text-content { font-size: 15px; color: #475569; line-height: 1.625; margin-bottom: 24px; }
            .credentials-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 24px; margin: 24px 0; }
            .credentials-item { font-size: 14px; color: #334155; margin: 4px 0; }
            .btn-holder { text-align: center; margin: 36px 0; }
            .btn-cta { background-color: #3b82f6; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2); transition: background-color 0.2s; }
            .btn-cta:hover { background-color: #2563eb; }
            .quickstart-list { padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.7; }
            .footer-branding { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px; text-align: center; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo-header">
              <h1 class="logo-text">CRM<span class="logo-accent">.PRO</span></h1>
            </div>
            <div class="body-content">
              <h2 class="headline">Welcome to CRM.PRO, ${name}! 🎉</h2>
              <p class="text-content">
                Your account is ready and your workspace is fully set up. You have been assigned to your sales team and are ready to receive leads.
              </p>
              <div class="credentials-box">
                <div class="credentials-item"><strong>Login Email:</strong> ${toEmail}</div>
                <div class="credentials-item"><strong>Access Role:</strong> Sales Agent</div>
              </div>
              <div class="btn-holder">
                <a href="${loginLink}" class="btn-cta">Access Your CRM Cockpit</a>
              </div>
              <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 32px; margin-bottom: 12px;">Quick Start Guide:</h3>
              <ol class="quickstart-list">
                <li>Update your profile picture and setup your personal profile.</li>
                <li>Familiarize yourself with your dedicated CRM cockpit dashboard to track lead interactions in real time.</li>
                <li>Connect your Twilio softphone client to start making client calls with absolute efficiency.</li>
              </ol>
            </div>
            <div class="footer-branding">
              &copy; ${new Date().getFullYear()} CRM.PRO Enterprise Inc. All rights reserved.
            </div>
          </div>
        </body>
        </html>
      `
    });
    console.log(`[SMTP SUCCESS] Welcome email successfully sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error("[SMTP ERROR] Welcome Email Failed:", error.message);
    return false;
  }
};

module.exports = {
  sendInviteEmail,
  sendTaskAssignmentEmail,
  sendAgentInvitationEmail,
  sendWelcomeAgentEmail
};
