const prisma = require('../config/prisma');
const { sendInviteEmail } = require('../services/emailService');
const crypto = require('crypto');

const inviteUser = async (req, res) => {
  try {
    console.log("INVITE API HIT");
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    // Preserve backend token generation to maintain DB consistency
    const inviteToken = Math.random().toString(36).substring(2);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const existingInvite = await prisma.invite.findUnique({ where: { email } });
    if (existingInvite) {
      await prisma.invite.delete({ where: { email } });
    }

    await prisma.invite.create({
      data: {
        email,
        role: role || 'AGENT',
        token: inviteToken,
        expiresAt,
        status: 'PENDING'
      }
    });

    const inviteLink = `${process.env.FRONTEND_URL}/accept-invite?email=${email}`;

    const result = await sendInviteEmail(email, inviteLink);

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("FINAL BACKEND ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
      stack: error.stack,
      details: error
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
