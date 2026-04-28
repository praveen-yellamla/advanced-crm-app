const prisma = require('../config/prisma');
const crypto = require("crypto");
const { sendInviteEmail } = require("../services/emailService");

const inviteUser = async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

    const token = crypto.randomBytes(32).toString("hex");

    // Save token to DB to ensure system integrity
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
        token: token,
        expiresAt,
        status: 'PENDING'
      }
    });

    const inviteLink = `${process.env.FRONTEND_URL}/accept-invite?token=${token}&email=${email}`;

    await sendInviteEmail(email, inviteLink);

    // Update status to SENT after successful SMTP dispatch
    await prisma.invite.update({
      where: { email },
      data: { 
        status: 'SENT',
        sentAt: new Date()
      }
    });

    return res.status(200).json({
      success: true,
      message: "Invite sent successfully",
    });

  } catch (error) {
    console.error("INVITE ERROR:", error);

    return res.status(500).json({
      error: error.message || "Failed to send invite",
    });
  }
};

const getInviteStats = async (req, res) => {
  try {
    const total = await prisma.invite.count();
    const pending = await prisma.invite.count({ where: { status: 'SENT' } });
    const accepted = await prisma.invite.count({ where: { status: 'ACCEPTED' } });
    
    res.json({
      success: true,
      data: {
        total,
        pending,
        accepted,
        conversionRate: total > 0 ? ((accepted / total) * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
  getInvites,
  getInviteStats
};
