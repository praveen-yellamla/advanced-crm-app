const prisma = require('../config/prisma');
const crypto = require("crypto");
const { sendInviteEmail } = require("../services/emailService");

const inviteUser = async (req, res) => {
  try {
    const { email, role, phone } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

    // 1. Check if user already exists (Email or Phone)
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          ...(phone ? [{ phone: phone }] : [])
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: `User with this ${existingUser.email === email ? 'email' : 'phone'} already exists` 
      });
    }

    // 2. Check if active invite already exists
    const existingInvite = await prisma.invite.findFirst({
      where: {
        OR: [
          { email: email },
          ...(phone ? [{ phone: phone }] : [])
        ],
        status: { in: ['PENDING', 'SENT'] }
      }
    });

    if (existingInvite) {
      return res.status(400).json({ 
        error: "An invite has already been sent to this user and is pending" 
      });
    }

    // 3. Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // 4. Create Invite
    await prisma.invite.create({
      data: {
        email,
        phone,
        role: role || 'AGENT',
        token: token,
        expiresAt,
        status: 'PENDING'
      }
    });

    const inviteLink = `${process.env.FRONTEND_URL}/accept-invite?token=${token}&email=${email}`;

    // 5. Send Email
    await sendInviteEmail(email, inviteLink);

    // 6. Update status to SENT
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
