const prisma = require('../config/prisma');
const { sendInviteEmail } = require('../services/emailService');
const crypto = require('crypto');

const inviteUser = async (req, res) => {
  try {
    console.log("INVITE STARTED (SMTP)");
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Store in DB
    const existingInvite = await prisma.invite.findUnique({ where: { email } });
    if (existingInvite) {
      await prisma.invite.delete({ where: { email } });
    }

    await prisma.invite.create({
      data: {
        email,
        role: role || 'AGENT',
        token: token,
        expiresAt,
        status: 'PENDING'
      }
    });

    const inviteLink = `${process.env.FRONTEND_URL}/accept-invite?token=${token}&email=${email}`;
    
    console.log("Generated Invite Link:", inviteLink);

    await sendInviteEmail(email, inviteLink);

    res.json({ message: "Invite sent successfully" });

  } catch (error) {
    console.error("INVITE CONTROLLER ERROR:", error);
    res.status(500).json({ error: "Failed to send email", details: error.message });
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
