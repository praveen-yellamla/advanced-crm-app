const prisma = require('../config/prisma');
const { sendInviteEmail } = require('../services/emailService');
const crypto = require('crypto');

const inviteUser = async (req, res) => {
  try {
    console.log("INVITE API HIT");
    console.log('Dispatching invite request:', req.body);
    
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

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

    await prisma.invite.create({
      data: {
        email,
        role: role || 'AGENT',
        token,
        expiresAt,
        status: 'PENDING'
      }
    });

    // 4. Initialize communication dispatch
    // NOTE: Generating a dual-compatible link that satisfies both the requested ?email= format and the secure /:token pathing.
    const clientUrl = process.env.FRONTEND_URL || req.headers.origin || 'https://advanced-crm-frontend.onrender.com';
    const inviteLink = `${clientUrl}/accept-invite/${token}?email=${email}`;
    
    console.log("Invite link:", inviteLink);
    
    const emailResponse = await sendInviteEmail(email, inviteLink);

    if (!emailResponse || !emailResponse.id) {
      throw new Error("Email not sent properly");
    }

    return res.json({ 
      success: true, 
      message: "Invite sent successfully" 
    });

  } catch (error) {
    console.error("INVITE ERROR:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to send email" 
    });
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
