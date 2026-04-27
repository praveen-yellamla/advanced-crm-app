const prisma = require('../config/prisma');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

/**
 * Institutional Invitation Engine.
 * Orchestrates token-based identity provisioning for external business nodes.
 */

const inviteUser = async (req, res) => {
  try {
    const { email, role, teamId } = req.body;

    // 1. Verify existence
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ success: false, message: 'Identity already present in local registry.' });

    // 2. Clear stale tokens if any
    await prisma.userInvite.deleteMany({ where: { email } });

    // 3. Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48); // 48-hour expiration

    await prisma.userInvite.create({
      data: {
        email,
        role: role || 'AGENT',
        teamId: teamId ? parseInt(teamId) : null,
        token,
        expiresAt
      }
    });

    // 4. Initialize communication dispatch
    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/register?token=${token}`;
    
    await sendEmail({
      email,
      subject: 'Institutional Invite: Advanced CRM Gateway',
      message: `You have been authorized to join the Advanced CRM grid. Initialize your session: ${inviteUrl}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #0F172A;">
          <h2 style="text-transform: uppercase; letter-spacing: 2px;">Identity Authorization</h2>
          <p>You have been officially invited to join Advanced CRM as a <strong>${role}</strong>.</p>
          <a href="${inviteUrl}" style="display:inline-block; padding: 14px 28px; background: #2563EB; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">Initialize Account</a>
          <p style="font-size: 11px; color: #64748B;">This invitation token expires in 48 hours for security compliance.</p>
        </div>
      `
    });

    res.json({ success: true, message: 'Institutional invite dispatched.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getInvites = async (req, res) => {
  try {
    const invites = await prisma.userInvite.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: invites });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  inviteUser,
  getInvites
};
 Deborah 
 Deborah 
 Deborah 
 Deborah 
 Deborah 
 Deborah 
 Deborah 
 Deborah 
 Deborah 
