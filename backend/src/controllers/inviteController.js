const prisma = require('../config/prisma');
const crypto = require("crypto");
const { sendInviteEmail } = require("../services/emailService");

const inviteUser = async (req, res) => {
  console.log("INVITE BODY RECEIVED:", req.body);
  try {
    let { email, phone, role } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // 1. Normalize values
    email = email.trim().toLowerCase();
    phone = phone && phone.trim() !== "" ? phone.trim() : null;

    // 2. Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(phone ? [{ phone }] : [])
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists with this email or phone"
      });
    }

    // 3. Check if an invite has already been sent
    const existingInvite = await prisma.invite.findFirst({
      where: {
        email,
        status: "SENT"
      }
    });

    if (existingInvite) {
      return res.status(400).json({
        message: "An active invitation has already been sent to this email"
      });
    }

    // 4. Generate token and link
    const token = crypto.randomBytes(32).toString("hex");
    const inviteLink = `${process.env.FRONTEND_URL}/accept-invite?token=${token}`;

    // 5. TRY sending email FIRST
    try {
      await sendInviteEmail(email, inviteLink);
      console.log(`INVITE EMAIL SENT SUCCESS: ${email}`);
    } catch (emailError) {
      console.error("INVITE EMAIL FAILED:", emailError);
      return res.status(500).json({
        message: "Failed to send invitation email. No record created.",
        details: emailError.message
      });
    }

    // 6. ONLY AFTER SUCCESS → SAVE IN DB
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await prisma.invite.create({
      data: {
        email,
        phone,
        role: role || 'AGENT',
        token,
        status: 'SENT',
        expiresAt,
        sentAt: new Date()
      }
    });

    return res.status(200).json({
      success: true,
      message: "Invite sent successfully"
    });

  } catch (error) {
    console.error("INVITE FLOW ERROR:", error);
    return res.status(500).json({
      message: "Internal server error during invite flow",
      details: error.message
    });
  }
};

const getInviteStats = async (req, res) => {
  try {
    const total = await prisma.invite.count();
    const sent = await prisma.invite.count({ where: { status: 'SENT' } });
    const joined = await prisma.invite.count({ where: { status: 'JOINED' } });
    
    res.json({
      success: true,
      data: {
        total,
        sent,
        joined,
        conversionRate: total > 0 ? ((joined / total) * 100).toFixed(1) : 0
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

