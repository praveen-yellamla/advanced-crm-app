const prisma = require('../config/prisma');
const { sendInviteEmail } = require('../services/emailService');
const crypto = require('crypto');

const inviteUser = async (req, res) => {
  try {
    console.log("Invite API called");
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const inviteToken = Math.random().toString(36).substring(2);

    // Save token to DB to ensure accept-invite flow continues to work securely
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Clear stale invites
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

    const inviteLink = `${process.env.FRONTEND_URL}/accept-invite?token=${inviteToken}&email=${email}&role=${role}`;

    const emailResponse = await sendInviteEmail(email, inviteLink);

    return res.status(200).json({
      success: true,
      message: "Email sent successfully",
      data: emailResponse
    });
  } catch (error) {
    console.error("INVITE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message
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
