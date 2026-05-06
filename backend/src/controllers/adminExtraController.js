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
    const today = new Date();
    const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalRevenueObj,
      totalLeads,
      wonLeads,
      agents
    ] = await Promise.all([
      prisma.invoice.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID' }
      }),
      prisma.lead.count(),
      prisma.lead.count({ where: { status: 'WON' } }),
      prisma.user.findMany({
        where: { role: 'AGENT', isActive: true },
        include: {
          assignedLeads: { where: { status: 'WON' } },
          invoices: { where: { status: 'PAID' } }
        }
      })
    ]);

    // Construct Leaderboard
    const agentLeaderboard = agents.map(agent => {
      const deals = agent.assignedLeads.length;
      const revenue = agent.invoices.reduce((sum, inv) => sum + inv.amount, 0);
      const conversion = totalLeads > 0 ? ((deals / totalLeads) * 100).toFixed(1) + '%' : '0%';
      return {
        name: agent.name,
        conversion,
        deals,
        revenue: `$${revenue.toLocaleString()}`,
        avatar: agent.name.split(' ').map(n => n[0]).join('').toUpperCase()
      };
    }).sort((a, b) => parseInt(b.deals) - parseInt(a.deals)).slice(0, 5);

    // Mock 7-day revenue for chart (In a real app, group by day)
    const revenueData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      revenueData.push({
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        value: Math.floor(Math.random() * 5000) + 1000 // Placeholder for historical day-by-day
      });
    }

    const platformRevenue = totalRevenueObj._sum.amount || 0;
    const avgConversion = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) + '%' : '0%';

    const analyticsData = {
      revenueData,
      agentLeaderboard,
      kpis: {
        platformRevenue: `$${platformRevenue.toLocaleString()}`,
        activeLeads: totalLeads.toLocaleString(),
        avgConversion,
        aiEfficiency: '94%' // Static AI placeholder
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
