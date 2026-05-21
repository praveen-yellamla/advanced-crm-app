const prisma = require('../config/prisma');

// Scopes queries to only return data for the manager's assigned team
const getTeamScope = async (req) => {
  const managerId = req.user.id;
  const organizationId = req.user.organizationId;
  
  // Find the team managed by this manager
  const team = await prisma.team.findFirst({
    where: { managerId, organizationId },
    include: { agents: true }
  });
  
  if (!team) {
    return { teamId: null, agentIds: [], organizationId };
  }
  
  // Collect all agent IDs in this team
  const agentIds = team.agents.map(a => a.id);
  return {
    teamId: team.id,
    agentIds,
    organizationId
  };
};

// ==========================================
// 1. DASHBOARD OVERVIEW ENDPOINTS
// ==========================================

const getDashboardStats = async (req, res) => {
  try {
    const scope = await getTeamScope(req);
    if (!scope.teamId) {
      return res.json({ success: true, data: { cards: {}, funnel: [], sources: [], leaderboard: [], activity: [] } });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date();
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      callsToday,
      leadsAssignedThisWeek,
      leadsTeam,
      revenueTeam,
      avgDurationResult,
      tasksStats,
      leaderboardAgents,
      recentLogs
    ] = await Promise.all([
      // Total Calls Today (team)
      prisma.call.count({
        where: {
          organizationId: scope.organizationId,
          agentId: { in: scope.agentIds },
          createdAt: { gte: today }
        }
      }),
      // Leads Assigned This Week (team)
      prisma.lead.count({
        where: {
          organizationId: scope.organizationId,
          assignedToId: { in: scope.agentIds },
          createdAt: { gte: startOfWeek }
        }
      }),
      // Conversion Rate - Total Leads in scope
      prisma.lead.findMany({
        where: {
          organizationId: scope.organizationId,
          assignedToId: { in: scope.agentIds }
        },
        select: { status: true }
      }),
      // Revenue Generated This Month
      prisma.invoice.aggregate({
        _sum: { amount: true },
        where: {
          organizationId: scope.organizationId,
          raisedById: { in: scope.agentIds },
          status: 'PAID',
          createdAt: { gte: startOfMonth }
        }
      }),
      // Average Handle Time (seconds)
      prisma.call.aggregate({
        _avg: { duration: true },
        where: {
          organizationId: scope.organizationId,
          agentId: { in: scope.agentIds }
        }
      }),
      // Tasks overview
      prisma.task.findMany({
        where: {
          organizationId: scope.organizationId,
          assignedToId: { in: scope.agentIds }
        },
        select: { status: true, dueDate: true }
      }),
      // Leaderboard
      prisma.user.findMany({
        where: { id: { in: scope.agentIds }, isActive: true },
        select: {
          id: true,
          name: true,
          profileImage: true,
          calls: { 
            select: { 
              duration: true,
              qaScore: { select: { total: true } }
            } 
          },
          assignedLeads: { select: { status: true } },
          invoices: {
            where: { status: 'PAID' },
            select: { amount: true }
          }
        }
      }),
      // Recent Activity Log (Lead Activities)
      prisma.leadActivity.findMany({
        where: {
          organizationId: scope.organizationId,
          lead: { assignedToId: { in: scope.agentIds } }
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          lead: { select: { customerName: true } }
        }
      })
    ]);

    // Calculate Conversion Rate %
    const totalLeads = leadsTeam.length;
    const wonLeads = leadsTeam.filter(l => l.status === 'WON' || l.status === 'QUALIFIED').length;
    const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;

    // Calculate Overdue Tasks
    const openTasks = tasksStats.filter(t => t.status !== 'COMPLETED' && t.status !== 'DONE').length;
    const overdueTasks = tasksStats.filter(t => 
      (t.status !== 'COMPLETED' && t.status !== 'DONE') && t.dueDate && new Date(t.dueDate) < new Date()
    ).length;

    // Format Leaderboard Table Data
    const leaderboard = leaderboardAgents.map(agent => {
      const callsMade = agent.calls.length;
      const totalAgentRevenue = agent.invoices.reduce((sum, inv) => sum + inv.amount, 0);
      const totalAgentLeads = agent.assignedLeads.length;
      const wonAgentLeads = agent.assignedLeads.filter(l => l.status === 'WON' || l.status === 'QUALIFIED').length;
      const agentConversion = totalAgentLeads > 0 ? (wonAgentLeads / totalAgentLeads) * 100 : 0;
      
      const qaScoresList = agent.calls.map(c => c.qaScore?.total).filter(score => score !== undefined && score !== null);
      const avgQA = qaScoresList.length > 0 ? qaScoresList.reduce((a, b) => a + b, 0) / qaScoresList.length : 0;

      return {
        id: agent.id,
        name: agent.name,
        avatar: agent.profileImage || null,
        callsMade,
        conversionRate: Math.round(agentConversion * 10) / 10,
        revenue: totalAgentRevenue,
        avgQAScore: Math.round(avgQA * 10) / 10
      };
    }).sort((a, b) => b.revenue - a.revenue);

    res.json({
      success: true,
      data: {
        cards: {
          callsToday,
          leadsAssignedThisWeek,
          conversionRate: Math.round(conversionRate * 10) / 10,
          revenueGenerated: revenueTeam._sum.amount || 0,
          avgHandleTime: Math.round((avgDurationResult._avg.duration || 0) / 60 * 10) / 10,
          openTasks,
          overdueTasks
        },
        leaderboard,
        recentActivity: recentLogs.map(log => ({
          id: log.id,
          action: log.action,
          leadName: log.lead.customerName,
          leadId: log.leadId,
          createdAt: log.createdAt
        }))
      }
    });
  } catch (error) {
    console.error("DASHBOARD STATS ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDashboardCallVolume = async (req, res) => {
  try {
    const scope = await getTeamScope(req);
    if (!scope.teamId) {
      return res.json({ success: true, data: [] });
    }

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const calls = await prisma.call.findMany({
      where: {
        organizationId: scope.organizationId,
        agentId: { in: scope.agentIds },
        createdAt: { gte: fourteenDaysAgo }
      },
      select: {
        createdAt: true,
        agent: { select: { name: true } }
      }
    });

    // Group calls by date and agent
    const dateMap = {};
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dateMap[dateString] = { date: dateString };
    }

    calls.forEach(call => {
      const dateString = new Date(call.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dateMap[dateString]) {
        const agentName = call.agent.name;
        dateMap[dateString][agentName] = (dateMap[dateString][agentName] || 0) + 1;
      }
    });

    const data = Object.values(dateMap).reverse();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDashboardLeadSources = async (req, res) => {
  try {
    const scope = await getTeamScope(req);
    if (!scope.teamId) {
      return res.json({ success: true, data: [] });
    }

    const sources = await prisma.lead.groupBy({
      by: ['source'],
      where: {
        organizationId: scope.organizationId,
        assignedToId: { in: scope.agentIds }
      },
      _count: { source: true }
    });

    const data = sources.map(s => ({
      name: s.source,
      value: s._count.source
    }));

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDashboardConversionFunnel = async (req, res) => {
  try {
    const scope = await getTeamScope(req);
    if (!scope.teamId) {
      return res.json({ success: true, data: [] });
    }

    const leads = await prisma.lead.groupBy({
      by: ['status'],
      where: {
        organizationId: scope.organizationId,
        assignedToId: { in: scope.agentIds }
      },
      _count: { status: true }
    });

    const stageMap = {
      'NEW': { name: 'New Leads', value: 0 },
      'CONTACTED': { name: 'Contacted', value: 0 },
      'INTERESTED': { name: 'Interested', value: 0 },
      'WON': { name: 'Converted', value: 0 },
      'QUALIFIED': { name: 'Qualified', value: 0 }
    };

    leads.forEach(l => {
      const stage = stageMap[l.status];
      if (stage) {
        stage.value += l._count.status;
      }
    });

    // Merge Qualified into Converted for a clean funnel representation
    stageMap['WON'].value += stageMap['QUALIFIED'].value;
    delete stageMap['QUALIFIED'];

    const data = Object.values(stageMap);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 2. TEAM ANALYTICS ENDPOINTS
// ==========================================

const getTeamAnalytics = async (req, res) => {
  try {
    const scope = await getTeamScope(req);
    if (!scope.teamId) {
      return res.json({ success: true, data: { agents: [], talkTimeHeatmap: [] } });
    }

    const { agentId, period } = req.query; // period can be: 'today', 'week', 'month'
    let dateFilter = {};
    const now = new Date();

    if (period === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      dateFilter = { gte: today };
    } else if (period === 'week') {
      const lastWeek = new Date();
      lastWeek.setDate(now.getDate() - 7);
      dateFilter = { gte: lastWeek };
    } else { // default 'month'
      const lastMonth = new Date();
      lastMonth.setDate(now.getDate() - 30);
      dateFilter = { gte: lastMonth };
    }

    const targetAgentIds = agentId ? [parseInt(agentId)] : scope.agentIds;

    const [agentsList, callsList, heatmapDataRaw] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: targetAgentIds } },
        select: {
          id: true,
          name: true,
          profileImage: true,
          isActive: true,
          calls: {
            where: { createdAt: dateFilter },
            select: { duration: true }
          },
          assignedLeads: {
            where: { createdAt: dateFilter },
            select: { status: true }
          },
          invoices: {
            where: { status: 'PAID', createdAt: dateFilter },
            select: { amount: true }
          }
        }
      }),
      prisma.call.findMany({
        where: {
          organizationId: scope.organizationId,
          agentId: { in: targetAgentIds },
          createdAt: dateFilter
        },
        select: {
          duration: true,
          createdAt: true
        }
      }),
      // Heatmap talk time grouped
      prisma.call.groupBy({
        by: ['agentId', 'createdAt'],
        where: {
          organizationId: scope.organizationId,
          agentId: { in: scope.agentIds }
        },
        _sum: { duration: true }
      })
    ]);

    const formattedAgents = agentsList.map(a => {
      const totalCalls = a.calls.length;
      const revenue = a.invoices.reduce((sum, inv) => sum + inv.amount, 0);
      const totalLeads = a.assignedLeads.length;
      const wonLeads = a.assignedLeads.filter(l => l.status === 'WON' || l.status === 'QUALIFIED').length;
      const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;
      
      const totalSeconds = a.calls.reduce((sum, c) => sum + c.duration, 0);
      const avgDuration = totalCalls > 0 ? totalSeconds / totalCalls : 0;

      return {
        id: a.id,
        name: a.name,
        avatar: a.profileImage,
        status: a.isActive ? 'ONLINE' : 'OFFLINE',
        callsMade: totalCalls,
        conversionRate: Math.round(conversionRate * 10) / 10,
        revenue,
        talkTime: Math.round(totalSeconds / 60),
        avgHandleTime: Math.round(avgDuration / 60 * 10) / 10
      };
    });

    // Format talk time heatmap (grouping by day of week)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const heatmap = days.map(day => ({ day, talkTime: 0 }));

    heatmapDataRaw.forEach(item => {
      const dayIndex = new Date(item.createdAt).getDay();
      const dayName = days[dayIndex];
      const matchingDay = heatmap.find(h => h.day === dayName);
      if (matchingDay) {
        matchingDay.talkTime += Math.round((item._sum.duration || 0) / 60);
      }
    });

    res.json({
      success: true,
      data: {
        agents: formattedAgents,
        talkTimeHeatmap: heatmap
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 3. CALL RECORDINGS & QC ENDPOINTS
// ==========================================

const getTeamCalls = async (req, res) => {
  try {
    const scope = await getTeamScope(req);
    if (!scope.teamId) {
      return res.json({ success: true, data: [] });
    }

    const { agentId, status, search, durationMin, durationMax } = req.query;

    const where = {
      organizationId: scope.organizationId,
      agentId: agentId ? parseInt(agentId) : { in: scope.agentIds }
    };

    if (status) {
      where.status = status;
    }

    if (durationMin || durationMax) {
      where.duration = {};
      if (durationMin) where.duration.gte = parseInt(durationMin);
      if (durationMax) where.duration.lte = parseInt(durationMax);
    }

    if (search) {
      where.OR = [
        { phone: { contains: search, mode: 'insensitive' } },
        { lead: { customerName: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const calls = await prisma.call.findMany({
      where,
      include: {
        agent: { select: { id: true, name: true, profileImage: true } },
        lead: { select: { id: true, customerName: true, phone: true } },
        annotations: true,
        qaScore: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: calls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const annotateCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const { timestamp, note } = req.body;
    const scope = await getTeamScope(req);

    // Verify ownership
    const call = await prisma.call.findFirst({
      where: { id: parseInt(callId), organizationId: scope.organizationId }
    });

    if (!call) return res.status(404).json({ success: false, message: "Call not found" });

    const annotation = await prisma.callAnnotation.create({
      data: {
        organizationId: scope.organizationId,
        callId: parseInt(callId),
        managerId: req.user.id,
        timestamp: parseFloat(timestamp),
        note
      }
    });

    const { sendNotification, triggerRealtimeEvent, logActivity } = require('../utils/realtimeHelper');

    await sendNotification({
      organizationId: scope.organizationId,
      userId: call.agentId,
      title: 'New Annotation Added',
      message: `Manager annotated your call at ${parseFloat(timestamp).toFixed(0)}s: "${note.substring(0, 30)}..."`,
      type: 'INFO',
      priority: 'MEDIUM',
      metadata: { callId: call.id }
    });

    triggerRealtimeEvent(`user_${call.agentId}`, 'call:annotated', annotation);

    await logActivity({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'call.annotated',
      entityType: 'CALL',
      entityId: call.id,
      newValue: { timestamp, note },
      teamId: scope.teamId
    });

    res.json({ success: true, data: annotation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const flagCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const { reason } = req.body;
    const scope = await getTeamScope(req);

    // Verify call ownership
    const call = await prisma.call.findFirst({
      where: { id: parseInt(callId), organizationId: scope.organizationId }
    });

    if (!call) return res.status(404).json({ success: false, message: "Call not found" });

    const updatedCall = await prisma.call.update({
      where: { id: call.id },
      data: { tags: reason || 'QA_FLAGGED' }
    });

    const { sendNotification, triggerRealtimeEvent, logActivity } = require('../utils/realtimeHelper');

    await sendNotification({
      organizationId: scope.organizationId,
      userId: call.agentId,
      title: 'Call Flagged for Review',
      message: `Your call has been flagged for: ${reason || 'QA Coaching'}.`,
      type: 'WARNING',
      priority: 'HIGH',
      metadata: { callId: call.id }
    });

    triggerRealtimeEvent(`user_${call.agentId}`, 'call:flagged', updatedCall);
    triggerRealtimeEvent(`org_${scope.organizationId}`, 'call:flagged', updatedCall);

    await logActivity({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'call.flagged',
      entityType: 'CALL',
      entityId: call.id,
      newValue: { tags: reason || 'QA_FLAGGED' },
      teamId: scope.teamId
    });

    res.json({ success: true, data: updatedCall });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 4. QA SCORING ENDPOINTS
// ==========================================

const getQAPending = async (req, res) => {
  try {
    const scope = await getTeamScope(req);
    if (!scope.teamId) {
      return res.json({ success: true, data: [] });
    }

    // Pending = Calls that are flagged or has duration > 30 seconds but has NO QAScore recorded yet
    const pendingCalls = await prisma.call.findMany({
      where: {
        organizationId: scope.organizationId,
        agentId: { in: scope.agentIds },
        duration: { gte: 30 },
        qaScore: null
      },
      include: {
        agent: { select: { name: true } },
        lead: { select: { customerName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: pendingCalls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const submitQAScore = async (req, res) => {
  try {
    const { callId } = req.params;
    const { greeting, discovery, pitch, objection, closing, notes } = req.body;
    const scope = await getTeamScope(req);

    // Verify call ownership
    const call = await prisma.call.findFirst({
      where: { id: parseInt(callId), organizationId: scope.organizationId }
    });

    if (!call) return res.status(404).json({ success: false, message: "Call not found" });

    const total = greeting + discovery + pitch + objection + closing;

    const qa = await prisma.qAScore.upsert({
      where: { callId: parseInt(callId) },
      update: {
        greeting: parseInt(greeting),
        discovery: parseInt(discovery),
        pitch: parseInt(pitch),
        objection: parseInt(objection),
        closing: parseInt(closing),
        total,
        notes
      },
      create: {
        organizationId: scope.organizationId,
        callId: parseInt(callId),
        managerId: req.user.id,
        greeting: parseInt(greeting),
        discovery: parseInt(discovery),
        pitch: parseInt(pitch),
        objection: parseInt(objection),
        closing: parseInt(closing),
        total,
        notes
      }
    });

    const { sendNotification, triggerRealtimeEvent, logActivity } = require('../utils/realtimeHelper');

    await sendNotification({
      organizationId: scope.organizationId,
      userId: call.agentId,
      title: 'Call QA Scored',
      message: `Your call to ${call.phone} has been scored. Total Score: ${total}/100.`,
      type: 'SUCCESS',
      priority: 'HIGH',
      metadata: { callId: call.id, qaId: qa.id }
    });

    triggerRealtimeEvent(`user_${call.agentId}`, 'qa:scored', qa);

    await logActivity({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'qa.scored',
      entityType: 'QA_SCORE',
      entityId: qa.id,
      newValue: { total, notes },
      teamId: scope.teamId
    });

    res.json({ success: true, data: qa });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getQAReports = async (req, res) => {
  try {
    const scope = await getTeamScope(req);
    if (!scope.teamId) {
      return res.json({ success: true, data: [] });
    }

    const reports = await prisma.qAScore.findMany({
      where: {
        organizationId: scope.organizationId,
        call: { agentId: { in: scope.agentIds } }
      },
      include: {
        call: {
          include: {
            agent: { select: { name: true } },
            lead: { select: { customerName: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 5. AGENT FEEDBACK ENDPOINTS
// ==========================================

const getAgentFeedback = async (req, res) => {
  try {
    const { agentId } = req.params;
    const scope = await getTeamScope(req);

    // Verify agent belongs to team scope
    if (!scope.agentIds.includes(parseInt(agentId))) {
      return res.status(403).json({ success: false, message: "Agent out of scope" });
    }

    const feedback = await prisma.feedback.findMany({
      where: {
        organizationId: scope.organizationId,
        agentId: parseInt(agentId)
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const submitAgentFeedback = async (req, res) => {
  try {
    const { agentId, content, type, callId } = req.body;
    const scope = await getTeamScope(req);

    // Verify scope
    if (!scope.agentIds.includes(parseInt(agentId))) {
      return res.status(403).json({ success: false, message: "Agent out of scope" });
    }

    const feedback = await prisma.feedback.create({
      data: {
        organizationId: scope.organizationId,
        agentId: parseInt(agentId),
        managerId: req.user.id,
        content,
        type: type || 'COACHING',
        callId: callId ? parseInt(callId) : null
      }
    });

    const { sendNotification, triggerRealtimeEvent, logActivity } = require('../utils/realtimeHelper');

    await sendNotification({
      organizationId: scope.organizationId,
      userId: parseInt(agentId),
      title: 'New Coaching Feedback Posted',
      message: `Manager has posted coaching feedback: "${content.substring(0, 35)}..."`,
      type: 'INFO',
      priority: 'MEDIUM',
      metadata: { feedbackId: feedback.id, callId }
    });

    triggerRealtimeEvent(`user_${agentId}`, 'feedback:posted', feedback);

    await logActivity({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'feedback.posted',
      entityType: 'FEEDBACK',
      entityId: feedback.id,
      newValue: { type: type || 'COACHING', content },
      teamId: scope.teamId
    });

    res.json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 6. LEAD MANAGEMENT ENDPOINTS
// ==========================================

const getTeamLeads = async (req, res) => {
  try {
    const scope = await getTeamScope(req);
    if (!scope.teamId) {
      return res.json({ success: true, data: [] });
    }

    const { agentId, source, stage, search } = req.query;

    const where = {
      organizationId: scope.organizationId,
      assignedToId: agentId ? parseInt(agentId) : { in: scope.agentIds }
    };

    if (source) {
      where.source = source;
    }

    if (stage) {
      where.status = stage;
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    const leads = await prisma.lead.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, name: true, profileImage: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: leads });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const reassignLead = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { assignedToId } = req.body;
    const scope = await getTeamScope(req);

    // Verify target agent ownership
    if (assignedToId && !scope.agentIds.includes(parseInt(assignedToId))) {
      return res.status(403).json({ success: false, message: "Agent is not part of your team" });
    }

    // Verify lead ownership
    const lead = await prisma.lead.findFirst({
      where: { id: parseInt(leadId), organizationId: scope.organizationId }
    });

    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });

    const updatedLead = await prisma.lead.update({
      where: { id: lead.id },
      data: { assignedToId: assignedToId ? parseInt(assignedToId) : null }
    });

    // Write Lead Activity
    await prisma.leadActivity.create({
      data: {
        organizationId: scope.organizationId,
        leadId: lead.id,
        action: `Lead reassigned to agent ID ${assignedToId || 'Unassigned'}`
      }
    }).catch(e => console.error("LeadActivity error:", e));

    res.json({ success: true, data: updatedLead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 7. TASK & ACTIVITY ENDPOINTS
// ==========================================

const getTeamTasks = async (req, res) => {
  try {
    const scope = await getTeamScope(req);
    if (!scope.teamId) {
      return res.json({ success: true, data: [] });
    }

    const { agentId } = req.query;

    const tasks = await prisma.task.findMany({
      where: {
        organizationId: scope.organizationId,
        assignedToId: agentId ? parseInt(agentId) : { in: scope.agentIds }
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
        lead: { select: { id: true, customerName: true } }
      },
      orderBy: { dueDate: 'asc' }
    });

    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const reassignTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { assignedToId, status } = req.body;
    const scope = await getTeamScope(req);

    if (assignedToId && !scope.agentIds.includes(parseInt(assignedToId))) {
      return res.status(403).json({ success: false, message: "Agent is not part of your team" });
    }

    const task = await prisma.task.findFirst({
      where: { id: parseInt(taskId), organizationId: scope.organizationId }
    });

    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    const updatedTask = await prisma.task.update({
      where: { id: task.id },
      data: {
        assignedToId: assignedToId ? parseInt(assignedToId) : task.assignedToId,
        status: status || task.status
      }
    });

    res.json({ success: true, data: updatedTask });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 8. EMAIL MONITORING ENDPOINTS
// ==========================================

const getTeamEmails = async (req, res) => {
  try {
    const scope = await getTeamScope(req);
    if (!scope.teamId) {
      return res.json({ success: true, data: [] });
    }

    const { agentId } = req.query;

    const emails = await prisma.email.findMany({
      where: {
        organizationId: scope.organizationId,
        agentId: agentId ? parseInt(agentId) : { in: scope.agentIds }
      },
      include: {
        agent: { select: { name: true } },
        lead: { select: { customerName: true } },
        auditLogs: true,
        events: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: emails });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 9. INVOICING ENDPOINTS
// ==========================================

const getTeamInvoices = async (req, res) => {
  try {
    const scope = await getTeamScope(req);
    if (!scope.teamId) {
      return res.json({ success: true, data: [] });
    }

    const { agentId } = req.query;

    const invoices = await prisma.invoice.findMany({
      where: {
        organizationId: scope.organizationId,
        raisedById: agentId ? parseInt(agentId) : { in: scope.agentIds }
      },
      include: {
        items: true,
        client: { select: { customerName: true } },
        raisedBy: { select: { name: true } },
        approver: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 10. LIST TEAM AGENTS
// ==========================================

const getTeamAgents = async (req, res) => {
  try {
    const scope = await getTeamScope(req);
    if (!scope.teamId) {
      return res.json({ success: true, data: [] });
    }

    const team = await prisma.team.findUnique({
      where: { id: scope.teamId },
      include: { manager: { select: { name: true } } }
    });

    const agents = await prisma.user.findMany({
      where: { id: { in: scope.agentIds } },
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
        isActive: true
      }
    });

    const formattedAgents = agents.map(agent => ({
      ...agent,
      avatar_url: agent.profileImage,
      is_active: agent.isActive
    }));

    res.json({
      success: true,
      data: formattedAgents,
      teamName: team?.teamName || '',
      managerName: team?.manager?.name || ''
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTeamDetails = async (req, res) => {
  try {
    const scope = await getTeamScope(req);
    if (!scope.teamId) {
      return res.json({ 
        success: true, 
        team_id: null, 
        team_name: '', 
        manager_id: null, 
        manager_name: '', 
        agent_count: 0, 
        agents: [] 
      });
    }

    const team = await prisma.team.findFirst({
      where: { id: scope.teamId, organizationId: scope.organizationId },
      include: {
        manager: { select: { id: true, name: true } },
        agents: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            isActive: true
          }
        }
      }
    });

    if (!team) return res.status(404).json({ success: false, message: "Team not found" });

    res.json({
      success: true,
      team_id: team.id,
      team_name: team.teamName,
      manager_id: team.managerId,
      manager_name: team.manager.name,
      agent_count: team.agents.length,
      agents: team.agents.map(a => ({
        id: a.id,
        name: a.name,
        email: a.email,
        avatar_url: a.profileImage,
        is_active: a.isActive
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const scope = await getTeamScope(req);

    const invoice = await prisma.invoice.findFirst({
      where: { id: parseInt(id), organizationId: scope.organizationId },
      include: { raisedBy: true }
    });

    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });

    const validStatuses = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PENDING', 'SENT', 'PAID', 'OVERDUE', 'ESCALATED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status }
    });

    const { sendNotification, triggerRealtimeEvent, logActivity } = require('../utils/realtimeHelper');

    // Notify Agent
    await sendNotification({
      organizationId: scope.organizationId,
      userId: invoice.raisedById,
      title: 'Invoice Status Updated',
      message: `Your invoice ${invoice.invoiceNo} status is now: ${status}.`,
      type: status === 'PAID' ? 'SUCCESS' : status === 'ESCALATED' ? 'WARNING' : 'INFO',
      priority: 'HIGH',
      metadata: { invoiceId: invoice.id }
    });

    triggerRealtimeEvent(`user_${invoice.raisedById}`, 'invoice:updated', updatedInvoice);
    triggerRealtimeEvent(`org_${scope.organizationId}`, 'invoice:updated', updatedInvoice);
    if (scope.teamId) {
      triggerRealtimeEvent(`team_${scope.teamId}`, 'invoice:updated', updatedInvoice);
    }

    if (status === 'ESCALATED') {
      // Also notify admins/managers globally in org
      triggerRealtimeEvent(`org_${scope.organizationId}_admins`, 'invoice:escalated', updatedInvoice);
    }

    await logActivity({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: `invoice.${status.toLowerCase()}`,
      entityType: 'INVOICE',
      entityId: invoice.id,
      oldValue: { status: invoice.status },
      newValue: { status },
      teamId: scope.teamId
    });

    res.json({ success: true, data: updatedInvoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTalkTimeHeatmap = async (req, res) => {
  try {
    const scope = await getTeamScope(req);
    if (!scope.teamId) {
      return res.json({ success: true, data: [] });
    }

    const { agentId, period } = req.query;
    let dateFilter = {};
    const now = new Date();

    if (period === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      dateFilter = { gte: today };
    } else if (period === 'week') {
      const lastWeek = new Date();
      lastWeek.setDate(now.getDate() - 7);
      dateFilter = { gte: lastWeek };
    } else { // default 'month'
      const lastMonth = new Date();
      lastMonth.setDate(now.getDate() - 30);
      dateFilter = { gte: lastMonth };
    }

    const targetAgentIds = (agentId && agentId !== 'all') ? [parseInt(agentId)] : scope.agentIds;

    const heatmapDataRaw = await prisma.call.groupBy({
      by: ['agentId', 'createdAt'],
      where: {
        organizationId: scope.organizationId,
        agentId: { in: targetAgentIds },
        createdAt: dateFilter
      },
      _sum: { duration: true }
    });

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const heatmap = days.map(day => ({ day, talkTime: 0 }));

    heatmapDataRaw.forEach(item => {
      const dayIndex = new Date(item.createdAt).getDay();
      const dayName = days[dayIndex];
      const matchingDay = heatmap.find(h => h.day === dayName);
      if (matchingDay) {
        matchingDay.talkTime += Math.round((item._sum.duration || 0) / 60);
      }
    });

    res.json({ success: true, data: heatmap });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getConversionComparison = async (req, res) => {
  try {
    const scope = await getTeamScope(req);
    if (!scope.teamId) {
      return res.json({ 
        success: true, 
        data: { current: { rate: 0, count: 0 }, previous: { rate: 0, count: 0 }, change_percent: 0 } 
      });
    }

    const { agentId, period } = req.query;
    const targetAgentIds = (agentId && agentId !== 'all') ? [parseInt(agentId)] : scope.agentIds;

    const now = new Date();
    let currentStart = new Date();
    let prevStart = new Date();
    let prevEnd = new Date();

    if (period === 'today') {
      currentStart.setHours(0, 0, 0, 0);
      
      prevStart.setDate(now.getDate() - 1);
      prevStart.setHours(0, 0, 0, 0);
      
      prevEnd.setDate(now.getDate() - 1);
      prevEnd.setHours(23, 59, 59, 999);
    } else if (period === 'week') {
      currentStart.setDate(now.getDate() - 7);
      currentStart.setHours(0, 0, 0, 0);
      
      prevStart.setDate(now.getDate() - 14);
      prevStart.setHours(0, 0, 0, 0);
      
      prevEnd.setDate(now.getDate() - 7);
      prevEnd.setHours(0, 0, 0, 0);
    } else { // default 'month'
      currentStart.setDate(now.getDate() - 30);
      currentStart.setHours(0, 0, 0, 0);
      
      prevStart.setDate(now.getDate() - 60);
      prevStart.setHours(0, 0, 0, 0);
      
      prevEnd.setDate(now.getDate() - 30);
      prevEnd.setHours(0, 0, 0, 0);
    }

    const [currLeads, prevLeads] = await Promise.all([
      prisma.lead.findMany({
        where: {
          organizationId: scope.organizationId,
          assignedToId: { in: targetAgentIds },
          createdAt: { gte: currentStart }
        },
        select: { status: true }
      }),
      prisma.lead.findMany({
        where: {
          organizationId: scope.organizationId,
          assignedToId: { in: targetAgentIds },
          createdAt: { gte: prevStart, lt: prevEnd }
        },
        select: { status: true }
      })
    ]);

    const calculateStats = (leads) => {
      const total = leads.length;
      const converted = leads.filter(l => l.status === 'WON' || l.status === 'QUALIFIED').length;
      const rate = total > 0 ? (converted / total) * 100 : 0;
      return { rate: Math.round(rate * 10) / 10, count: converted };
    };

    const currentStats = calculateStats(currLeads);
    const prevStats = calculateStats(prevLeads);

    let change = 0;
    if (prevStats.rate > 0) {
      change = ((currentStats.rate - prevStats.rate) / prevStats.rate) * 100;
    } else if (currentStats.rate > 0) {
      change = 100;
    }

    res.json({
      success: true,
      data: {
        current: currentStats,
        previous: prevStats,
        change_percent: Math.round(change * 10) / 10
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getDashboardCallVolume,
  getDashboardLeadSources,
  getDashboardConversionFunnel,
  getTeamAnalytics,
  getTeamCalls,
  annotateCall,
  flagCall,
  getQAPending,
  submitQAScore,
  getQAReports,
  getAgentFeedback,
  submitAgentFeedback,
  getTeamLeads,
  reassignLead,
  getTeamTasks,
  reassignTask,
  getTeamEmails,
  getTeamInvoices,
  updateInvoiceStatus,
  getTeamAgents,
  getTeamDetails,
  getTalkTimeHeatmap,
  getConversionComparison
};
