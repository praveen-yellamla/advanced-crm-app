const prisma = require('../config/prisma');

const inviteUser = async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Generate simple invite token
    const token = Math.random().toString(36).substring(2, 12);

    // Save invite in DB
    const invite = await prisma.invite.create({
      data: {
        email: email.trim().toLowerCase(),
        role: role || "AGENT",
        token,
        status: "PENDING"
      }
    });

    // Create invite link (no email sending)
    const inviteLink = `${process.env.FRONTEND_URL}/accept-invite?token=${token}`;

    console.log("INVITE LINK (manual):", inviteLink);

    return res.json({
      success: true,
      message: "Invite created successfully",
      inviteLink // 🔥 return link directly
    });

  } catch (error) {
    console.error("Invite error:", error);
    return res.status(500).json({ message: "Failed to create invite" });
  }
};

const getInviteStats = async (req, res) => {
  try {
    const total = await prisma.invite.count();
    const joined = await prisma.invite.count({ where: { status: 'JOINED' } });
    
    res.json({
      success: true,
      data: {
        total,
        joined,
        pending: total - joined,
        conversionRate: total > 0 ? ((joined / total) * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getInvites = async (req, res) => {
  try {
    const invites = await prisma.invite.findMany();
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

