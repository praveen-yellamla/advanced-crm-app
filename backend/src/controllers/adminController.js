const prisma = require('../config/prisma');

// ==================================================
// 1. DASHBOARD METRICS
// ==================================================
const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orgId = req.user.organizationId;

    const [
      totalLeads,
      todayLeads,
      manualAgents,
      invitedAgents,
      callsToday,
      totalRevenue,
      leadsByStatus,
      leadsBySource,
      organizationInfo
    ] = await Promise.all([
      prisma.lead.count({ where: { organizationId: orgId } }),
      prisma.lead.count({ where: { organizationId: orgId, createdAt: { gte: today } } }),
      prisma.user.count({ 
        where: { 
          organizationId: orgId,
          role: 'AGENT', 
          isActive: true,
          OR: [
            { agentType: 'MANUAL' },
            { agentType: null }
          ]
        } 
      }),
      prisma.user.findMany({ 
        where: { organizationId: orgId, role: 'AGENT', agentType: 'INVITED' },
        select: { inviteStatus: true }
      }),
      prisma.call.count({ where: { organizationId: orgId, createdAt: { gte: today } } }),
      prisma.invoice.aggregate({
        _sum: { amount: true },
        where: { organizationId: orgId, status: 'PAID' }
      }),
      prisma.lead.groupBy({
        by: ['status'],
        where: { organizationId: orgId },
        _count: true
      }),
      prisma.lead.groupBy({
        by: ['source'],
        where: { organizationId: orgId },
        _count: true
      }),
      prisma.organization.findUnique({
        where: { id: orgId },
        select: { 
          lastPlatformAccessAt: true, 
          lastPlatformAccessBy: true,
          accessApprovalRequired: true 
        }
      })
    ]);

    const invitedTotal = invitedAgents.length;
    const invitedJoined = invitedAgents.filter(a => a.inviteStatus === 'ACCEPTED').length;
    const invitedPending = invitedAgents.filter(a => a.inviteStatus === 'PENDING').length;

    res.json({
      success: true,
      data: {
        cards: {
          totalLeads,
          todayLeads,
          activeAgents: manualAgents + invitedJoined, // Accurate Joined Count
          manualAgents,
          invitedTotal,
          invitedJoined,
          invitedPending,
          callsToday,
          revenueMTD: totalRevenue._sum.amount || 0,
          conversionRate: totalLeads > 0 ? ((leadsByStatus.find(l => l.status === 'WON')?._count || 0) / totalLeads) * 100 : 0
        },
        funnel: leadsByStatus,
        sources: leadsBySource,
        security: organizationInfo
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================================================
// 2. TEAM MANAGEMENT
// ==================================================
const getManagers = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    if (!orgId && req.user.role !== 'SUPER_ADMIN') {
      return res.status(400).json({ success: false, message: 'Organization context missing' });
    }

    const managers = await prisma.user.findMany({
      where: { 
        role: 'MANAGER', 
        isActive: true,
        organizationId: orgId 
      },
      select: { id: true, name: true, email: true }
    });
    res.json({ success: true, data: managers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTeams = async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      where: { organizationId: req.user.organizationId },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        agents: { select: { id: true, name: true, email: true } },
        _count: { select: { agents: true } }
      }
    });
    res.json({ success: true, data: teams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createTeam = async (req, res) => {
  try {
    const { teamName, managerId, monthlyLeadsTarget, monthlySalesTarget, conversionTarget, revenueGoal } = req.body;
    
    // Mission-Critical: Verify Manager Ownership
    const managerVerify = await prisma.user.findFirst({
      where: { 
        id: parseInt(managerId), 
        organizationId: req.user.organizationId,
        role: 'MANAGER'
      }
    });

    if (!managerVerify) {
      return res.status(403).json({ success: false, message: 'IDENT_CROSS_TENANT_VIOLATION: Manager does not belong to this instance' });
    }

    const team = await prisma.team.create({
      data: {
        teamName,
        organizationId: req.user.organizationId,
        managerId: managerVerify.id,
        monthlyLeadsTarget: parseInt(monthlyLeadsTarget) || 0,
        monthlySalesTarget: parseInt(monthlySalesTarget) || 0,
        conversionTarget: parseFloat(conversionTarget) || 0,
        revenueGoal: parseFloat(revenueGoal) || 0,
      }
    });

    await createAuditLog(req.user.id, 'CREATE', 'TEAM', null, team);
    res.json({ success: true, data: team });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTeam = async (req, res) => {
  try {
    console.log('Update Team Request Body:', req.body);
    const { id } = req.params;
    
    const oldTeam = await prisma.team.findUnique({ 
      where: { 
        id: parseInt(id),
        organizationId: req.user.organizationId
      } 
    });
    if (!oldTeam) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    const updateData = { ...req.body };

    // Remove nested objects or unwanted fields
    delete updateData.manager;
    delete updateData.agents;
    delete updateData._count;
    delete updateData.id;

    if (updateData.managerId !== undefined && updateData.managerId !== null && updateData.managerId !== '') {
      const managerId = Number(updateData.managerId);
      if (isNaN(managerId)) return res.status(400).json({ success: false, message: 'Invalid Manager ID' });
      
      const managerExists = await prisma.user.findUnique({
        where: { id: managerId }
      });
      
      if (!managerExists) {
        return res.status(400).json({ success: false, message: 'Invalid Manager ID: User not found' });
      }
      updateData.managerId = managerId;
    } else {
      delete updateData.managerId;
    }
    
    const numericFields = ['monthlyLeadsTarget', 'monthlySalesTarget', 'conversionTarget', 'revenueGoal'];
    for (const field of numericFields) {
      if (updateData[field] !== undefined && updateData[field] !== null && updateData[field] !== '') {
        const val = Number(updateData[field]);
        if (isNaN(val)) {
          return res.status(400).json({ success: false, message: `Invalid numeric value for ${field}` });
        }
        updateData[field] = val;
      } else {
        delete updateData[field]; // Omit if empty to let Prisma ignore it
      }
    }

    const team = await prisma.team.update({
      where: { 
        id: parseInt(id),
        organizationId: req.user.organizationId // ENFORCE OWNERSHIP
      },
      data: updateData
    });

    await createAuditLog(req.user.id, 'UPDATE', 'TEAM', oldTeam, team);
    res.json({ success: true, data: team });
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================================================
// 3. AGENT MANAGEMENT
// ==================================================
const getAgents = async (req, res) => {
  try {
    const agents = await prisma.user.findMany({
      where: { 
        role: 'AGENT',
        organizationId: req.user.organizationId
      },
      include: {
        team: { select: { teamName: true } },
        _count: { select: { assignedLeads: true, calls: true } }
      }
    });
    res.json({ success: true, data: agents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const bcrypt = require('bcryptjs');

const { uploadToCloudinary } = require('../utils/cloudinary');

const createAgent = async (req, res) => {
  try {
    const { name, email, password, teamId, phone } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Profile image is required' });
    }

    // Verify Team Ownership if provided
    if (teamId) {
      const teamVerify = await prisma.team.findFirst({
        where: { id: parseInt(teamId), organizationId: req.user.organizationId }
      });
      if (!teamVerify) return res.status(403).json({ success: false, message: 'IDENT_CROSS_TENANT_VIOLATION' });
    }

    const imageUrl = await uploadToCloudinary(req.file.buffer);

    // Mission-Critical: Hash passwords before persistence
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const agent = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        profileImage: imageUrl,
        role: 'AGENT',
        organizationId: req.user.organizationId,
        teamId: teamId ? parseInt(teamId) : null,
        isActive: true,
        agentType: 'MANUAL',
        inviteStatus: 'ACCEPTED'
      }
    });

    await createAuditLog(req.user.id, 'CREATE', 'AGENT', null, agent);
    res.json({ success: true, data: agent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateAgent = async (req, res) => {
  console.log("Incoming update data for agent:", req.params.id, req.body);
  try {
    const { id } = req.params;
    const oldAgent = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    
    if (!oldAgent) {
      return res.status(404).json({ success: false, message: "Agent not found" });
    }

    const data = { ...req.body };
    
    // Handle nested data from FormData if necessary (strings to numbers)
    if (data.teamId) data.teamId = parseInt(data.teamId);
    
    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(data.password, salt);
    } else {
      delete data.password; // Don't overwrite with empty string
    }

    // Handle Image Update
    if (req.file) {
      console.log("Detected new image for agent, uploading...");
      data.profileImage = await uploadToCloudinary(req.file.buffer);
    }

    const agent = await prisma.user.update({
      where: { 
        id: parseInt(id),
        organizationId: req.user.organizationId // ENFORCE OWNERSHIP
      },
      data
    });

    console.log("AGENT UPDATED IN DB:", agent.name);

    await createAuditLog(req.user.id, 'UPDATE', 'AGENT', oldAgent, agent);
    res.json({ 
      success: true, 
      message: "Agent updated successfully",
      data: agent 
    });
  } catch (error) {
    console.error("UPDATE AGENT ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteAgent = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ 
      where: { 
        id: parseInt(id),
        organizationId: req.user.organizationId // ENFORCE OWNERSHIP
      } 
    });
    res.json({ success: true, message: 'Agent node terminated.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.team.delete({ 
      where: { 
        id: parseInt(id),
        organizationId: req.user.organizationId // ENFORCE OWNERSHIP
      } 
    });
    res.json({ success: true, message: 'Team decommissioned.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================================================
// 4. AUDIT LOGS
// ==================================================
const getAuditLogs = async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { organizationId: req.user.organizationId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200
    });
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper for logging
const createAuditLog = async (userId, action, module, oldValue, newValue) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        module,
        oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
        newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null
      }
    });
  } catch (e) {
    console.error('Audit log failed', e);
  }
};

module.exports = {
  getDashboardStats,
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  getAgents,
  createAgent,
  updateAgent,
  deleteAgent,
  getAuditLogs,
  getManagers
};
