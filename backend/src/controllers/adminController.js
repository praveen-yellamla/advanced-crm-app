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
      organizationInfo,
      totalTeams,
      openTasks,
      agentLeaderboard,
      recentActivity,
      revenueTrend,
      callVolume
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
      }),
      prisma.team.count({ where: { organizationId: orgId } }),
      prisma.task.count({ where: { organizationId: orgId, status: 'PENDING' } }),
      prisma.user.findMany({
        where: { organizationId: orgId, role: 'AGENT' },
        select: {
          id: true,
          name: true,
          profileImage: true,
          _count: { select: { calls: true } }
        },
        orderBy: { calls: { _count: 'desc' } },
        take: 5
      }),
      prisma.auditLog.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          action: true,
          module: true,
          createdAt: true,
          user: { select: { name: true } }
        }
      }),
      prisma.invoice.groupBy({
        by: ['createdAt'],
        where: { organizationId: orgId, status: 'PAID' },
        _sum: { amount: true }
      }),
      prisma.call.groupBy({
        by: ['createdAt'],
        where: { organizationId: orgId },
        _count: true
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
          activeAgents: manualAgents + invitedJoined,
          manualAgents,
          invitedTotal,
          invitedJoined,
          invitedPending,
          callsToday,
          revenueMTD: totalRevenue._sum.amount || 0,
          conversionRate: totalLeads > 0 ? ((leadsByStatus.find(l => l.status === 'WON')?._count || 0) / totalLeads) * 100 : 0,
          totalTeams,
          openTasks
        },
        funnel: leadsByStatus,
        sources: leadsBySource,
        security: organizationInfo,
        leaderboard: agentLeaderboard,
        recentActivity,
        revenueTrend: revenueTrend.map(r => ({ date: r.createdAt.toISOString().split('T')[0], amount: r._sum.amount })),
        callVolume: callVolume.map(c => ({ date: c.createdAt.toISOString().split('T')[0], count: c._count }))
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
    const { teamName, managerId, monthlyLeadsTarget, monthlyLeadTarget, monthlySalesTarget, conversionTarget, revenueGoal } = req.body;
    
    // Parse Manager ID
    const parsedManagerId = parseInt(managerId);
    if (isNaN(parsedManagerId)) {
      return res.status(400).json({ success: false, message: 'Invalid Manager ID' });
    }

    // Verify Manager exists
    const managerVerify = await prisma.user.findUnique({
      where: { id: parsedManagerId }
    });

    if (!managerVerify) {
      return res.status(404).json({ success: false, message: 'Manager not found' });
    }

    // Enforce Tenant Isolation (Cross-Tenant Validation)
    const adminOrgId = req.user.organizationId;
    if (managerVerify.organizationId !== adminOrgId) {
      return res.status(403).json({ 
        success: false, 
        message: 'IDENT_CROSS_TENANT_VIOLATION: Manager does not belong to this organization' 
      });
    }

    // Validate role is manager
    if (managerVerify.role !== 'MANAGER' && managerVerify.role !== 'manager') {
      return res.status(400).json({ 
        success: false, 
        message: 'Selected user is not a manager' 
      });
    }

    // Standardize leads target fields
    const parsedLeadsTarget = parseInt(monthlyLeadTarget !== undefined ? monthlyLeadTarget : monthlyLeadsTarget) || 0;

    const team = await prisma.team.create({
      data: {
        teamName,
        organizationId: req.user.organizationId,
        managerId: managerVerify.id,
        monthlyLeadTarget: parsedLeadsTarget,
        monthlyLeadsTarget: parsedLeadsTarget,
        monthlySalesTarget: parseInt(monthlySalesTarget) || 0,
        conversionTarget: parseFloat(conversionTarget) || 0,
        revenueGoal: parseFloat(revenueGoal) || 0,
      }
    });

    const { logActivity, sendNotification, triggerRealtimeEvent } = require('../utils/realtimeHelper');

    await logActivity({
      actorId: req.user.id,
      actorRole: 'ADMIN',
      action: 'team.created',
      entityType: 'TEAM',
      entityId: team.id,
      newValue: team,
      teamId: team.id
    });

    await sendNotification({
      organizationId: req.user.organizationId,
      userId: managerVerify.id,
      title: 'New Managed Team Assigned',
      message: `You have been assigned as the Manager of the team: ${teamName}.`,
      type: 'SUCCESS',
      priority: 'HIGH'
    });

    triggerRealtimeEvent(`user_${managerVerify.id}`, 'team:updated', team);

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
    const teamId = parseInt(id);
    
    const oldTeam = await prisma.team.findUnique({ 
      where: { 
        id: teamId,
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
    
    const numericFields = ['monthlyLeadsTarget', 'monthlyLeadTarget', 'monthlySalesTarget', 'conversionTarget', 'revenueGoal'];
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

    // Synchronize both lead target variants if either is provided
    if (updateData.monthlyLeadTarget !== undefined) {
      updateData.monthlyLeadsTarget = updateData.monthlyLeadTarget;
    } else if (updateData.monthlyLeadsTarget !== undefined) {
      updateData.monthlyLeadTarget = updateData.monthlyLeadsTarget;
    }

    const team = await prisma.team.update({
      where: { 
        id: teamId,
        organizationId: req.user.organizationId // ENFORCE OWNERSHIP
      },
      data: updateData
    });

    const { logActivity, sendNotification, triggerRealtimeEvent } = require('../utils/realtimeHelper');

    await logActivity({
      actorId: req.user.id,
      actorRole: 'ADMIN',
      action: 'team.updated',
      entityType: 'TEAM',
      entityId: team.id,
      oldValue: oldTeam,
      newValue: team,
      teamId: team.id
    });

    // Notify new and old managers if reassigned
    if (updateData.managerId && oldTeam.managerId !== team.managerId) {
      await sendNotification({
        organizationId: req.user.organizationId,
        userId: oldTeam.managerId,
        title: 'Team Access Terminated',
        message: `You are no longer managing team ${team.teamName}.`,
        type: 'WARNING',
        priority: 'HIGH'
      });
      triggerRealtimeEvent(`user_${oldTeam.managerId}`, 'team:updated', { teamId: team.id, removed: true });

      await sendNotification({
        organizationId: req.user.organizationId,
        userId: team.managerId,
        title: 'New Managed Team Assigned',
        message: `You have been assigned as the Manager of the team: ${team.teamName}.`,
        type: 'SUCCESS',
        priority: 'HIGH'
      });
      triggerRealtimeEvent(`user_${team.managerId}`, 'team:updated', team);
    } else {
      // Just targets/name updated
      triggerRealtimeEvent(`user_${team.managerId}`, 'team:updated', team);
    }

    // Agent's personal analytics shows updated daily call target
    if (updateData.monthlyLeadsTarget || updateData.monthlySalesTarget) {
      const computedDailyTarget = Math.round((team.monthlyLeadsTarget || 100) / 20);
      await prisma.user.updateMany({
        where: { teamId: team.id },
        data: { dailyCallsTarget: computedDailyTarget }
      });
      triggerRealtimeEvent(`team_${team.id}`, 'team:updated', team);
    }

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
        organizationId: req.user.organizationId,
        // Exclude invited agents who have not yet completed setup.
        // These agents have no real access and must not appear in team/lead dropdowns.
        NOT: {
          AND: [
            { agentType: 'INVITED' },
            { inviteStatus: 'PENDING' }
          ]
        }
      },
      include: {
        team: { 
          select: { 
            teamName: true,
            manager: { select: { name: true } }
          } 
        },
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
    let team = null;
    if (teamId) {
      team = await prisma.team.findFirst({
        where: { id: parseInt(teamId), organizationId: req.user.organizationId }
      });
      if (!team) return res.status(403).json({ success: false, message: 'IDENT_CROSS_TENANT_VIOLATION' });
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

    const { logActivity, sendNotification, triggerRealtimeEvent } = require('../utils/realtimeHelper');

    await logActivity({
      actorId: req.user.id,
      actorRole: 'ADMIN',
      action: 'agent.created',
      entityType: 'USER',
      entityId: agent.id,
      newValue: { id: agent.id, name: agent.name, email: agent.email },
      teamId: agent.teamId
    });

    if (team) {
      // Notify team manager
      await sendNotification({
        organizationId: req.user.organizationId,
        userId: team.managerId,
        title: 'New Agent Added to Team',
        message: `${name} has been created and assigned to your team: ${team.teamName}.`,
        type: 'SUCCESS',
        priority: 'MEDIUM'
      });
      triggerRealtimeEvent(`user_${team.managerId}`, 'agent:assigned', agent);

      triggerRealtimeEvent(`team_${team.id}`, 'agent:added', {
        agent: {
          id: agent.id,
          name: agent.name,
          email: agent.email,
          avatar_url: agent.profileImage,
          is_active: agent.isActive
        }
      });
    }

    await createAuditLog(req.user.id, 'CREATE', 'AGENT', null, agent);
    res.json({ success: true, data: agent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createAgentManually = async (req, res) => {
  try {
    const { name, email, password, teamId, phone } = req.body;

    if (!name || !email || !password || !teamId) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and team are required for manually provisioning an agent' });
    }

    // Check if email already used
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email address already in use' });
    }

    // Verify Team Ownership
    const team = await prisma.team.findFirst({
      where: { id: parseInt(teamId), organizationId: req.user.organizationId }
    });
    if (!team) {
      return res.status(403).json({ success: false, message: 'IDENT_CROSS_TENANT_VIOLATION' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        phone: phone ? phone.trim() : null,
        role: 'AGENT',
        organizationId: req.user.organizationId,
        teamId: parseInt(teamId),
        isActive: true,
        agentType: 'MANUAL',
        inviteStatus: 'ACCEPTED'
      }
    });

    const { logActivity, sendNotification, triggerRealtimeEvent } = require('../utils/realtimeHelper');

    await logActivity({
      actorId: req.user.id,
      actorRole: 'ADMIN',
      action: 'agent.created',
      entityType: 'USER',
      entityId: user.id,
      newValue: { id: user.id, name: user.name, email: user.email },
      teamId: user.teamId
    });

    if (team.managerId) {
      // Notify team manager
      await sendNotification({
        organizationId: req.user.organizationId,
        userId: team.managerId,
        title: 'New Agent Added to Team',
        message: `${name} has been created and assigned to your team: ${team.teamName}.`,
        type: 'SUCCESS',
        priority: 'MEDIUM'
      });
      
      triggerRealtimeEvent(`user_${team.managerId}`, 'agent:joined_team', {
        agent: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          isActive: user.isActive
        }
      });
    }

    await createAuditLog(req.user.id, 'CREATE', 'AGENT', null, user);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createManagerManually = async (req, res) => {
  try {
    const { name, email, password, teamId, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    // Check if email already used
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email address already in use' });
    }

    // Verify Team Ownership if provided
    let team = null;
    if (teamId) {
      team = await prisma.team.findFirst({
        where: { id: parseInt(teamId), organizationId: req.user.organizationId }
      });
      if (!team) {
        return res.status(403).json({ success: false, message: 'IDENT_CROSS_TENANT_VIOLATION' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        phone: phone ? phone.trim() : null,
        role: 'MANAGER',
        organizationId: req.user.organizationId,
        isActive: true,
        agentType: 'MANUAL',
        inviteStatus: 'ACCEPTED'
      }
    });

    // If teamId is provided, update team's managerId to this new manager
    if (teamId) {
      await prisma.team.update({
        where: { id: parseInt(teamId) },
        data: { managerId: user.id }
      });
    }

    const { logActivity, triggerRealtimeEvent } = require('../utils/realtimeHelper');

    await logActivity({
      actorId: req.user.id,
      actorRole: 'ADMIN',
      action: 'manager.created',
      entityType: 'USER',
      entityId: user.id,
      newValue: { id: user.id, name: user.name, email: user.email },
      teamId: teamId ? parseInt(teamId) : null
    });

    triggerRealtimeEvent(`user_${req.user.id}`, 'manager:assigned', {
      manager: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isActive: user.isActive
      }
    });

    await createAuditLog(req.user.id, 'CREATE', 'MANAGER', null, user);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateAgent = async (req, res) => {
  console.log("Incoming update data for agent:", req.params.id, req.body);
  try {
    const { id } = req.params;
    const agentId = parseInt(id);
    const oldAgent = await prisma.user.findUnique({ where: { id: agentId } });
    
    if (!oldAgent) {
      return res.status(404).json({ success: false, message: "Agent not found" });
    }

    const data = { ...req.body };
    
    // Handle nested data from FormData if necessary (strings to numbers)
    if (data.teamId) data.teamId = parseInt(data.teamId);
    if (data.isActive !== undefined) data.isActive = data.isActive === 'true' || data.isActive === true;
    
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
        id: agentId,
        organizationId: req.user.organizationId // ENFORCE OWNERSHIP
      },
      data
    });

    const { logActivity, sendNotification, triggerRealtimeEvent } = require('../utils/realtimeHelper');

    await logActivity({
      actorId: req.user.id,
      actorRole: 'ADMIN',
      action: 'agent.updated',
      entityType: 'USER',
      entityId: agent.id,
      oldValue: { id: oldAgent.id, name: oldAgent.name, isActive: oldAgent.isActive },
      newValue: { id: agent.id, name: agent.name, isActive: agent.isActive },
      teamId: agent.teamId
    });

    // Handle Deactivation
    if (oldAgent.isActive && !agent.isActive) {
      // 1. Force Logout via Socket
      triggerRealtimeEvent(`user_${agent.id}`, 'user:deactivated', { userId: agent.id });

      // 2. Unassign Leads
      await prisma.lead.updateMany({
        where: { assignedToId: agent.id, organizationId: req.user.organizationId },
        data: { assignedToId: null }
      });

      // 3. Notify Team Manager
      if (agent.teamId) {
        const teamObj = await prisma.team.findUnique({ where: { id: agent.teamId } });
        if (teamObj) {
          await sendNotification({
            organizationId: req.user.organizationId,
            userId: teamObj.managerId,
            title: 'Agent Deactivated',
            message: `Agent ${agent.name} was deactivated by Admin. Their assigned leads are now unassigned.`,
            type: 'WARNING',
            priority: 'HIGH'
          });
          triggerRealtimeEvent(`user_${teamObj.managerId}`, 'agent:assigned', { agentId: agent.id, removed: true });

          triggerRealtimeEvent(`team_${agent.teamId}`, 'agent:deactivated', { agent_id: agent.id });
        }
      }
    }

    // Handle Team Reassignment
    if (data.teamId && oldAgent.teamId !== agent.teamId) {
      // Notify new team manager
      const newTeam = await prisma.team.findUnique({ where: { id: agent.teamId } });
      if (newTeam) {
        await sendNotification({
          organizationId: req.user.organizationId,
          userId: newTeam.managerId,
          title: 'Agent Assigned to Team',
          message: `${agent.name} has been transferred to your team: ${newTeam.teamName}.`,
          type: 'SUCCESS',
          priority: 'MEDIUM'
        });
        triggerRealtimeEvent(`user_${newTeam.managerId}`, 'agent:assigned', agent);
      }

      // Notify old team manager
      if (oldAgent.teamId) {
        const oldTeam = await prisma.team.findUnique({ where: { id: oldAgent.teamId } });
        if (oldTeam) {
          await sendNotification({
            organizationId: req.user.organizationId,
            userId: oldTeam.managerId,
            title: 'Agent Transferred Away',
            message: `${agent.name} has been transferred out of your team.`,
            type: 'WARNING',
            priority: 'MEDIUM'
          });
          triggerRealtimeEvent(`user_${oldTeam.managerId}`, 'agent:assigned', { agentId: agent.id, removed: true });
        }
      }
    }

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
    const agentId = parseInt(id);

    const oldAgent = await prisma.user.findFirst({
      where: { id: agentId, organizationId: req.user.organizationId }
    });

    if (oldAgent) {
      const { logActivity, sendNotification, triggerRealtimeEvent } = require('../utils/realtimeHelper');

      // 1. Force Logout via Socket
      triggerRealtimeEvent(`user_${agentId}`, 'user:deactivated', { userId: agentId });

      // 2. Unassign Leads
      await prisma.lead.updateMany({
        where: { assignedToId: agentId, organizationId: req.user.organizationId },
        data: { assignedToId: null }
      });

      // 3. Notify Team Manager
      if (oldAgent.teamId) {
        const teamObj = await prisma.team.findUnique({ where: { id: oldAgent.teamId } });
        if (teamObj) {
          await sendNotification({
            organizationId: req.user.organizationId,
            userId: teamObj.managerId,
            title: 'Agent Account Deleted',
            message: `Agent ${oldAgent.name} was removed from the system. Their assigned leads are now unassigned.`,
            type: 'ERROR',
            priority: 'HIGH'
          });
          triggerRealtimeEvent(`user_${teamObj.managerId}`, 'agent:assigned', { agentId, removed: true });
        }
      }

      await logActivity({
        actorId: req.user.id,
        actorRole: 'ADMIN',
        action: 'agent.deleted',
        entityType: 'USER',
        entityId: agentId,
        oldValue: { id: oldAgent.id, name: oldAgent.name },
        teamId: oldAgent.teamId
      });
    }

    await prisma.user.delete({ 
      where: { 
        id: agentId,
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

const assignAgentTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { team_id } = req.body;

    const agentId = parseInt(id);
    const parsedTeamId = team_id ? parseInt(team_id) : null;

    // Check if agent exists
    const agent = await prisma.user.findFirst({
      where: { id: agentId, role: 'AGENT', organizationId: req.user.organizationId }
    });

    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    // Block team assignment for agents who have not completed account setup
    if (agent.inviteStatus === 'PENDING') {
      return res.status(403).json({
        success: false,
        message: 'Cannot assign team to an agent who has not completed account setup. The agent must accept their invitation first.'
      });
    }

    // Save previous team information for old manager notification
    const oldTeamId = agent.teamId;

    // Verify Team Ownership if team_id is provided
    let team = null;
    if (parsedTeamId) {
      team = await prisma.team.findFirst({
        where: { id: parsedTeamId, organizationId: req.user.organizationId }
      });
      if (!team) {
        return res.status(403).json({ success: false, message: 'Team not found or tenant violation' });
      }
    }

    // Update Agent
    const updatedAgent = await prisma.user.update({
      where: { id: agentId },
      data: { teamId: parsedTeamId },
      include: {
        team: { 
          select: { 
            teamName: true,
            manager: { select: { name: true } }
          } 
        },
        _count: { select: { assignedLeads: true, calls: true } }
      }
    });

    const { triggerRealtimeEvent } = require('../utils/realtimeHelper');

    // Notify old manager if removed or changed
    if (oldTeamId && oldTeamId !== parsedTeamId) {
      const oldTeam = await prisma.team.findUnique({
        where: { id: oldTeamId }
      });
      if (oldTeam) {
        // Emit agent:left_team to old manager
        triggerRealtimeEvent(`manager_${oldTeam.managerId}`, 'agent:left_team', { agent_id: agentId });
        triggerRealtimeEvent(`user_${oldTeam.managerId}`, 'agent:left_team', { agent_id: agentId });
        triggerRealtimeEvent(`team_${oldTeamId}`, 'agent:deactivated', { agent_id: agentId });
      }
    }

    // Notify new manager if assigned
    if (parsedTeamId && team) {
      const payload = {
        agent: {
          id: updatedAgent.id,
          name: updatedAgent.name,
          email: updatedAgent.email,
          avatar_url: updatedAgent.profileImage,
          is_active: updatedAgent.isActive
        }
      };

      triggerRealtimeEvent(`manager_${team.managerId}`, 'agent:joined_team', payload);
      triggerRealtimeEvent(`user_${team.managerId}`, 'agent:joined_team', payload);
      
      // Also emit to the team's room so any live team widgets update
      triggerRealtimeEvent(`team_${parsedTeamId}`, 'agent:added', payload);
    }

    res.json({ success: true, data: updatedAgent });
  } catch (error) {
    console.error('Assign agent team error:', error);
    res.status(500).json({ success: false, message: error.message });
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
  createAgentManually,
  createManagerManually,
  updateAgent,
  deleteAgent,
  getAuditLogs,
  getManagers,
  assignAgentTeam
};
