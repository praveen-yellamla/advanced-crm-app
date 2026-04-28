const prisma = require('../config/prisma');

// ==================================================
// 1. DASHBOARD METRICS
// ==================================================
const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalLeads,
      todayLeads,
      activeAgents,
      callsToday,
      totalRevenue,
      leadsByStatus,
      leadsBySource
    ] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count({ where: { role: 'AGENT', isActive: true } }),
      prisma.call.count({ where: { createdAt: { gte: today } } }),
      prisma.invoice.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID' }
      }),
      prisma.lead.groupBy({
        by: ['status'],
        _count: true
      }),
      prisma.lead.groupBy({
        by: ['source'],
        _count: true
      })
    ]);

    res.json({
      success: true,
      data: {
        cards: {
          totalLeads,
          todayLeads,
          activeAgents,
          callsToday,
          revenueMTD: totalRevenue._sum.amount || 0,
          conversionRate: totalLeads > 0 ? ((leadsByStatus.find(l => l.status === 'WON')?._count || 0) / totalLeads) * 100 : 0
        },
        funnel: leadsByStatus,
        sources: leadsBySource
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
    const managers = await prisma.user.findMany({
      where: { role: 'MANAGER', isActive: true },
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
    
    const team = await prisma.team.create({
      data: {
        teamName,
        managerId: parseInt(managerId),
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
    
    const oldTeam = await prisma.team.findUnique({ where: { id: parseInt(id) } });
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
      where: { id: parseInt(id) },
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
      where: { role: 'AGENT' },
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

const createAgent = async (req, res) => {
  try {
    const { name, email, password, teamId, phone } = req.body;
    
    // Mission-Critical: Hash passwords before persistence
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const agent = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: 'AGENT',
        teamId: teamId ? parseInt(teamId) : null,
        isActive: true
      }
    });

    await createAuditLog(req.user.id, 'CREATE', 'AGENT', null, agent);
    res.json({ success: true, data: agent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const oldAgent = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    
    const data = { ...req.body };
    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(data.password, salt);
    }
    if (data.teamId) data.teamId = parseInt(data.teamId);

    const agent = await prisma.user.update({
      where: { id: parseInt(id) },
      data
    });

    await createAuditLog(req.user.id, 'UPDATE', 'AGENT', oldAgent, agent);
    res.json({ success: true, data: agent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteAgent = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: 'Agent node terminated.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.team.delete({ where: { id: parseInt(id) } });
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
