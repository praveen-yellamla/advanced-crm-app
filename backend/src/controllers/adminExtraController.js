const prisma = require('../config/prisma');

const getInvoices = async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
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

const createInvoice = async (req, res) => {
  try {
    const { clientId, amount, dueDate, invoiceNo } = req.body;
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        clientId: parseInt(clientId),
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        raisedById: req.user.id
      }
    });
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCalls = async (req, res) => {
  try {
    const calls = await prisma.call.findMany({
      include: {
        agent: { select: { name: true } },
        lead: { select: { customerName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: calls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const period = req.query.period || '30d'; // '7d', '30d', '90d', '1y'
    let dateFilter = new Date();
    if (period === '7d') dateFilter.setDate(dateFilter.getDate() - 7);
    else if (period === '30d') dateFilter.setDate(dateFilter.getDate() - 30);
    else if (period === '90d') dateFilter.setDate(dateFilter.getDate() - 90);
    else if (period === '1y') dateFilter.setFullYear(dateFilter.getFullYear() - 1);
    
    const [
      totalRevenueObj,
      totalLeads,
      wonLeads,
      agents,
      recentInvoices,
      leadGroups,
      calls,
      recentActivities
    ] = await Promise.all([
      prisma.invoice.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID', createdAt: { gte: dateFilter } }
      }),
      prisma.lead.count({ where: { createdAt: { gte: dateFilter } } }),
      prisma.lead.count({ where: { status: 'WON', createdAt: { gte: dateFilter } } }),
      prisma.user.findMany({
        where: { role: 'AGENT', isActive: true },
        include: {
          assignedLeads: { where: { status: 'WON', createdAt: { gte: dateFilter } } },
          invoices: { where: { status: 'PAID', createdAt: { gte: dateFilter } } }
        }
      }),
      prisma.invoice.findMany({
        where: { status: 'PAID', createdAt: { gte: dateFilter } },
        select: { amount: true, createdAt: true },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.lead.groupBy({
        by: ['source'],
        _count: { id: true },
        where: { createdAt: { gte: dateFilter } }
      }),
      prisma.call.aggregate({
        _count: { id: true },
        _avg: { duration: true },
        where: { createdAt: { gte: dateFilter } }
      }),
      prisma.leadActivity.findMany({
        take: 15,
        orderBy: { createdAt: 'desc' },
        include: {
          lead: { select: { customerName: true } }
        }
      })
    ]);

    // Leaderboard
    const agentLeaderboard = agents.map(agent => {
      const deals = agent.assignedLeads.length;
      const revenue = agent.invoices.reduce((sum, inv) => sum + inv.amount, 0);
      const conversion = totalLeads > 0 ? ((deals / totalLeads) * 100).toFixed(1) + '%' : '0%';
      return {
        id: agent.id,
        name: agent.name,
        conversion,
        deals,
        revenue: `$${revenue.toLocaleString()}`,
        rawRevenue: revenue,
        avatar: agent.name.split(' ').map(n => n[0]).join('').toUpperCase()
      };
    }).sort((a, b) => b.rawRevenue - a.rawRevenue).slice(0, 5);

    // Revenue Data Chart
    const revenueByDate = {};
    recentInvoices.forEach(inv => {
      const d = inv.createdAt.toISOString().split('T')[0];
      if (!revenueByDate[d]) revenueByDate[d] = 0;
      revenueByDate[d] += inv.amount;
    });
    
    // Fill empty dates
    const revenueData = [];
    let currDate = new Date(dateFilter);
    const today = new Date();
    while(currDate <= today) {
      const d = currDate.toISOString().split('T')[0];
      revenueData.push({
        name: currDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: revenueByDate[d] || 0
      });
      currDate.setDate(currDate.getDate() + 1);
    }

    // Lead Sources Data
    const leadSourceData = leadGroups.map(g => ({
      name: g.source,
      value: g._count.id
    }));

    // Activities
    const activityFeed = recentActivities.map(act => {
      let actionText = act.action;
      if (act.action === 'CREATE') actionText = 'created lead';
      if (act.action === 'STAGE_CHANGE') actionText = `changed stage to ${act.newValue}`;
      if (act.action === 'EMAIL_SENT') actionText = 'sent email';
      return {
        user: act.userId ? `User #${act.userId}` : 'System',
        action: actionText,
        target: act.lead?.customerName || 'Unknown Lead',
        time: act.createdAt
      };
    });

    const platformRevenue = totalRevenueObj._sum.amount || 0;
    const avgConversion = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) + '%' : '0%';

    const analyticsData = {
      revenueData,
      leadSourceData,
      agentLeaderboard,
      activityFeed,
      kpis: {
        platformRevenue: `$${platformRevenue.toLocaleString()}`,
        activeLeads: totalLeads.toLocaleString(),
        avgConversion,
        aiEfficiency: '96%', // Simulated for now
        totalCalls: calls._count.id || 0,
        avgCallDuration: calls._avg.duration ? Math.round(calls._avg.duration / 60) + 'm' : '0m'
      }
    };
    
    res.json({ success: true, data: analyticsData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getInvoices,
  createInvoice,
  getCalls,
  getAnalytics
};
