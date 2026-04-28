const prisma = require('../config/prisma');
const { sendInviteEmail } = require('../services/emailService');
const crypto = require('crypto');

const inviteUser = async (req, res) => {
  try {
    console.log('Dispatching invite request:', req.body);
    const { email, role } = req.body;

    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    // 1. Verify existence
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ success: false, message: 'User already exists with this email.' });

    // 2. Clear stale invites for this email
    const existingInvite = await prisma.invite.findUnique({ where: { email } });
    if (existingInvite) {
      await prisma.invite.delete({ where: { email } });
    }

    // 3. Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24-hour expiration

    const invite = await prisma.invite.create({
      data: {
        email,
        role: role || 'AGENT',
        token,
        expiresAt,
        status: 'PENDING'
      }
    });

    // 4. Initialize communication dispatch
    const clientUrl = process.env.FRONTEND_URL || req.headers.origin || 'https://advanced-crm-frontend.onrender.com';
    const inviteLink = `${clientUrl}/accept-invite/${token}`;
    
    await sendInviteEmail(email, inviteLink);

    res.json({ success: true, message: 'Invitation sent successfully' });
  } catch (error) {
    console.error('Invite Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};

const getInvites = async (req, res) => {
  try {
    const invites = await prisma.invite.findMany({
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
