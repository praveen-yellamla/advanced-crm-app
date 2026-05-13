const { v4: uuidv4 } = require('uuid');
const prisma = require('../config/prisma');
const { sendInviteEmail } = require('../utils/emailService');
const getFrontendUrl = require('../utils/getFrontendUrl');

const inviteUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const organizationId = req.user.organizationId;

    if (!email || !name) {
      return res.status(400).json({ message: "Name and Email are required" });
    }

    // Generate unique invite token (UUID)
    const token = uuidv4();

    // Save or Update invite in DB (Scoped to Org)
    const invite = await prisma.invite.upsert({
      where: { email: email.trim().toLowerCase() },
      update: {
        token,
        status: "PENDING",
        role: role || "AGENT",
        createdAt: new Date(),
        organizationId // Re-bind to current requester org
      },
      create: {
        email: email.trim().toLowerCase(),
        role: role || "AGENT",
        token,
        status: "PENDING",
        organizationId
      }
    });

    // Resolve environment-based frontend URL
    const frontendUrl = getFrontendUrl();
    const inviteLink = `${frontendUrl}/accept-invite/${token}`;

    console.log(`[INVITE] Generating link for ${invite.email}: ${inviteLink}`);

    // Upsert shadow user (Scoped to Org)
    if (invite.role !== 'SUPER_ADMIN') {
      await prisma.user.upsert({
        where: { email: invite.email },
        update: {
          name,
          organizationId,
          agentType: 'INVITED',
          inviteStatus: 'PENDING',
          isActive: false
        },
        create: {
          name,
          email: invite.email,
          password: 'PENDING_INVITE_' + uuidv4(),
          role: invite.role,
          organizationId,
          agentType: 'INVITED',
          inviteStatus: 'PENDING',
          isActive: false
        }
      });
    }

    // Send Email
    try {
      await sendInviteEmail(invite.email, inviteLink, name, invite.role);
    } catch (emailError) {
      console.error("[INVITE ABORTED] SMTP Failure:", emailError.message);
      return res.status(500).json({ 
        success: false, 
        message: `Failed to send email: ${emailError.message}.`,
        inviteLink
      });
    }

    return res.json({ success: true, message: "Invite sent successfully", inviteLink });
  } catch (error) {
    console.error("Invite Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getInviteStats = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const total = await prisma.invite.count({ where: { organizationId } });
    const joined = await prisma.invite.count({ where: { status: 'JOINED', organizationId } });
    
    const invitedAgents = await prisma.user.findMany({
      where: { role: 'AGENT', agentType: 'INVITED', organizationId },
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
      where: { organizationId: req.user.organizationId },
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
    await prisma.invite.delete({ 
      where: { id: parseInt(id), organizationId: req.user.organizationId } 
    });
    res.json({ success: true, message: "Invite deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const bulkDeleteInvites = async (req, res) => {
  try {
    const { type } = req.body;
    const organizationId = req.user.organizationId;
    let where = { status: 'PENDING', organizationId };
    const now = new Date();

    if (type === 'today') {
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      where.createdAt = { gte: startOfDay };
    } else if (type === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      where.createdAt = { gte: startOfMonth };
    }

    const result = await prisma.invite.deleteMany({ where });
    res.json({ success: true, message: `${result.count} pending invites deleted successfully` });
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

