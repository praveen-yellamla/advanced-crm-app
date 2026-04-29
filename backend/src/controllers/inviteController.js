const prisma = require('../config/prisma');
const crypto = require("crypto");
const { sendInviteEmail } = require("../services/emailService");

const inviteUser = async (req, res) => {
  try {
    let { email, phone, role } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Normalize values
    email = email.trim().toLowerCase();
    phone = phone && phone.trim() !== "" ? phone.trim() : null;

    // Check existing agent
    const existingAgent = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(phone ? [{ phone }] : [])
        ]
      }
    });

    if (existingAgent) {
      return res.status(400).json({
        error: "Agent already exists with this email or phone"
      });
    }

    // Check pending invite
    const existingInvite = await prisma.invite.findFirst({
      where: {
        email,
        status: "PENDING"
      }
    });

    if (existingInvite) {
      return res.status(400).json({
        error: "Invite already sent and pending"
      });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");

    // Save invite
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await prisma.invite.create({
      data: {
        email,
        phone,
        role: role || 'AGENT',
        token,
        expiresAt,
      }
    });

    // Create invite link
    const inviteLink = `${process.env.FRONTEND_URL}/accept-invite?token=${token}`;

    // Send email
    await sendInviteEmail(email, inviteLink);

    return res.status(200).json({
      success: true,
      message: "Invite sent successfully"
    });

  } catch (error) {
    console.error("INVITE ERROR:", error);
    return res.status(500).json({
      error: error.message || "Failed to send invite"
    });
  }
};

const getInviteStats = async (req, res) => {
  try {
    const total = await prisma.invite.count();
    const pending = await prisma.invite.count({ where: { status: { in: ['PENDING', 'SENT'] } } });
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
