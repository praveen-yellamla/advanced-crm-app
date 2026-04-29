const prisma = require('../config/prisma');
const sendInviteEmail = require('../utils/emailService');
const getFrontendUrl = require('../utils/getFrontendUrl');

const inviteUser = async (req, res) => {
  try {
    const { email, role, name } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Generate unique invite token
    const token = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

    // Save or Update invite in DB
    const invite = await prisma.invite.upsert({
      where: { email: email.trim().toLowerCase() },
      update: {
        token,
        status: "PENDING",
        role: role || "AGENT",
        createdAt: new Date()
      },
      create: {
        email: email.trim().toLowerCase(),
        role: role || "AGENT",
        token,
        status: "PENDING"
      }
    });

    // Resolve dynamic frontend URL
    const frontendUrl = getFrontendUrl(req);
    const inviteLink = `${frontendUrl}/accept-invite/${token}`;

    console.log(`[INVITE] Node sequence initiated for ${email}`);
    console.log("[INVITE] Secure Link generated:", inviteLink);

    // 🔥 Send Production Email
    const emailSent = await sendInviteEmail(invite.email, inviteLink, name || "Agent");

    if (!emailSent) {
       console.error("[SMTP FAILURE] Message delivery aborted.");
       // We still keep the invite in DB so it can be manually shared if needed
       return res.status(500).json({ 
         success: false, 
         message: "Email protocol failure. SMTP credentials might be missing.",
         inviteLink 
       });
    }

    // Also create a "Shadow User" for tracking in Agent list
    if (invite.role === 'AGENT') {
      await prisma.user.upsert({
        where: { email: invite.email },
        update: {
          agentType: 'INVITED',
          inviteStatus: 'PENDING',
          isActive: false
        },
        create: {
          name: name || 'Invited Agent',
          email: invite.email,
          password: 'PENDING_INVITE_' + Math.random(),
          role: 'AGENT',
          agentType: 'INVITED',
          inviteStatus: 'PENDING',
          isActive: false
        }
      });
    }

    return res.json({
      success: true,
      message: "Security invite dispatched successfully via SMTP.",
      inviteLink 
    });

  } catch (error) {
    console.error("[CRITICAL] Invite sequence failure:", error);
    return res.status(500).json({ message: "System failure during invite generation." });
  }
};

const getInviteStats = async (req, res) => {
  try {
    const total = await prisma.invite.count();
    const joined = await prisma.invite.count({ where: { status: 'JOINED' } });
    
    // We also pull from User table for cross-verification
    const invitedAgents = await prisma.user.findMany({
      where: { role: 'AGENT', agentType: 'INVITED' },
      select: { inviteStatus: true }
    });

    res.json({
      success: true,
      data: {
        total,
        joined,
        pending: total - joined,
        conversionRate: total > 0 ? ((joined / total) * 100).toFixed(1) : 0,
        agentSpecific: {
          total: invitedAgents.length,
          joined: invitedAgents.filter(a => a.inviteStatus === 'ACCEPTED').length,
          pending: invitedAgents.filter(a => a.inviteStatus === 'PENDING').length
        }
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

const deleteInvite = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.invite.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: "Invite deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const bulkDeleteInvites = async (req, res) => {
  try {
    const { type } = req.body;
    let where = { status: 'PENDING' };
    const now = new Date();

    if (type === 'today') {
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      where.createdAt = { gte: startOfDay };
    } else if (type === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      where.createdAt = { gte: startOfMonth };
    } else if (type === 'year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      where.createdAt = { gte: startOfYear };
    }

    const result = await prisma.invite.deleteMany({ where });
    res.json({ 
      success: true, 
      message: `${result.count} pending invites deleted successfully` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { 
  inviteUser,
  getInvites,
  getInviteStats,
  deleteInvite,
  bulkDeleteInvites
};

