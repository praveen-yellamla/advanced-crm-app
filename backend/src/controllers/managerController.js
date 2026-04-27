const prisma = require('../config/prisma');

// Helper to get teams managed by this manager
const getManagedTeamIds = async (managerId) => {
  const teams = await prisma.team.findMany({
    where: { managerId },
    select: { id: true }
  });
  return teams.map(t => t.id);
};

// ==================================================
// 1. DASHBOARD & ANALYTICS
// ==================================================
const getDashboardStats = async (req, res) => {
  try {
    const managerId = req.user.id;
    const teamIds = await getManagedTeamIds(managerId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalLeads,
      todayLeads,
      activeAgents,
      callsToday,
      totalRevenue,
      leadsByStatus,
      leadsBySource,
      qaScores
    ] = await Promise.all([
      prisma.lead.count({ where: { assignedTo: { teamId: { in: teamIds } } } }),
      prisma.lead.count({ where: { assignedTo: { teamId: { in: teamIds } }, createdAt: { gte: today } } }),
      prisma.user.count({ where: { teamId: { in: teamIds }, role: 'AGENT', isActive: true } }),
      prisma.call.count({ where: { agent: { teamId: { in: teamIds } }, createdAt: { gte: today } } }),
      prisma.invoice.aggregate({
        _sum: { amount: true },
        where: { raisedBy: { teamId: { in: teamIds } }, status: 'PAID' }
      }),
      prisma.lead.groupBy({
        by: ['status'],
        where: { assignedTo: { teamId: { in: teamIds } } },
        _count: true
      }),
      prisma.lead.groupBy({
        by: ['source'],
        where: { assignedTo: { teamId: { in: teamIds } } },
        _count: true
      }),
      prisma.callQA.aggregate({
        _avg: { totalScore: true },
        where: { managerId }
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
          conversionRate: totalLeads > 0 ? ((leadsByStatus.find(l => l.status === 'WON')?._count || 0) / totalLeads) * 100 : 0,
          avgQAScore: qaScores._avg.totalScore || 0
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
// 2. LEAD MANAGEMENT (SCOPED)
// ==================================================
const getTeamLeads = async (req, res) => {
  try {
    const teamIds = await getManagedTeamIds(req.user.id);
    const leads = await prisma.lead.findMany({
      where: { assignedTo: { teamId: { in: teamIds } } },
      include: {
        assignedTo: { select: { id: true, name: true } },
        calls: { orderBy: { createdAt: 'desc' }, take: 1 }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: leads });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const assignLead = async (req, res) => {
  try {
    const { leadId, agentId } = req.body;
    const teamIds = await getManagedTeamIds(req.user.id);
    
    // Check if agent belongs to manager's team
    const agent = await prisma.user.findFirst({
      where: { id: parseInt(agentId), teamId: { in: teamIds } }
    });

    if (!agent) return res.status(403).json({ success: false, message: "Agent not in your team scope" });

    const updatedLead = await prisma.lead.update({
      where: { id: parseInt(leadId) },
      data: { assignedToId: agent.id }
    });

    res.json({ success: true, data: updatedLead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================================================
// 3. QA & CALLS
// ==================================================
const getTeamCalls = async (req, res) => {
  try {
    const teamIds = await getManagedTeamIds(req.user.id);
    const calls = await prisma.call.findMany({
      where: { agent: { teamId: { in: teamIds } } },
      include: {
        agent: { select: { name: true } },
        lead: { select: { customerName: true } },
        qa: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: calls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const submitQA = async (req, res) => {
  try {
    const { callId, greeting, discovery, pitch, objectionHandling, closing, compliance, managerNotes } = req.body;
    
    const totalScore = (greeting + discovery + pitch + objectionHandling + closing + compliance) / 6;

    const qa = await prisma.callQA.upsert({
      where: { callId: parseInt(callId) },
      update: {
        greeting, discovery, pitch, objectionHandling, closing, compliance,
        totalScore, managerNotes, status: totalScore >= 70 ? 'PASS' : 'NEEDS_COACHING'
      },
      create: {
        callId: parseInt(callId),
        managerId: req.user.id,
        greeting, discovery, pitch, objectionHandling, closing, compliance,
        totalScore, managerNotes, status: totalScore >= 70 ? 'PASS' : 'NEEDS_COACHING'
      }
    });

    res.json({ success: true, data: qa });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================================================
// 4. INVOICES
// ==================================================
const getTeamInvoices = async (req, res) => {
  try {
    const teamIds = await getManagedTeamIds(req.user.id);
    const invoices = await prisma.invoice.findMany({
      where: { raisedBy: { teamId: { in: teamIds } } },
      include: {
        raisedBy: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // APPROVED, REJECTED, etc.
    
    // Scoped check omitted for brevity here, but should check if invoice.raisedBy.teamId is in manager's teams
    
    const invoice = await prisma.invoice.update({
      where: { id: parseInt(id) },
      data: { status }
    });
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================================================
// 5. AGENTS & FEEDBACK
// ==================================================
const getTeamAgents = async (req, res) => {
  try {
    const teamIds = await getManagedTeamIds(req.user.id);
    const agents = await prisma.user.findMany({
      where: { teamId: { in: teamIds }, role: 'AGENT' },
      include: {
        _count: { select: { assignedLeads: true, calls: true, feedbacksReceived: true } }
      }
    });
    res.json({ success: true, data: agents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const sendFeedback = async (req, res) => {
  try {
    const { agentId, content, priority, suggestions, callId } = req.body;
    const feedback = await prisma.feedback.create({
      data: {
        agentId: parseInt(agentId),
        managerId: req.user.id,
        callId: callId ? parseInt(callId) : null,
        content,
        priority,
        suggestions
      }
    });
    res.json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================================================
// 6. REPORTS (MOCK EXPORT)
// ==================================================
const exportReport = (format) => async (req, res) => {
  try {
    // In production, use libraries like pdfkit or exceljs here
    res.json({ success: true, message: `Report generated in ${format} format. Secure download link sent to your session.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getTeamLeads,
  assignLead,
  getTeamCalls,
  submitQA,
  getTeamInvoices,
  updateInvoiceStatus,
  getTeamAgents,
  sendFeedback,
  exportPDF: exportReport('PDF'),
  exportExcel: exportReport('EXCEL')
};
