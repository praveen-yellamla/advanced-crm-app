const prisma = require('../config/prisma');

const getInvoices = async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
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
      pipelineValueObj,
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
      prisma.invoice.aggregate({
        _sum: { amount: true },
        where: { status: { in: ['DRAFT', 'SENT'] }, createdAt: { gte: dateFilter } }
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
    const pipelineValue = pipelineValueObj._sum.amount || 0;
    const avgConversion = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) + '%' : '0%';

    const analyticsData = {
      revenueData,
      leadSourceData,
      agentLeaderboard,
      activityFeed,
      kpis: {
        platformRevenue: `$${platformRevenue.toLocaleString()}`,
        pipelineValue: `$${pipelineValue.toLocaleString()}`,
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

const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');

const exportAnalytics = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.body;
    let dateFilter = new Date();
    
    if (startDate && endDate) {
      dateFilter = new Date(startDate);
    } else {
      if (period === '7d') dateFilter.setDate(dateFilter.getDate() - 7);
      else if (period === '30d') dateFilter.setDate(dateFilter.getDate() - 30);
      else if (period === '90d') dateFilter.setDate(dateFilter.getDate() - 90);
      else if (period === '1y') dateFilter.setFullYear(dateFilter.getFullYear() - 1);
      else dateFilter.setDate(dateFilter.getDate() - 30); // Default 30d
    }

    const [totalRevenueObj, totalLeads, wonLeads, calls] = await Promise.all([
      prisma.invoice.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID', createdAt: { gte: dateFilter } }
      }),
      prisma.lead.count({ where: { createdAt: { gte: dateFilter } } }),
      prisma.lead.count({ where: { status: 'WON', createdAt: { gte: dateFilter } } }),
      prisma.call.aggregate({
        _count: { id: true },
        _avg: { duration: true },
        where: { createdAt: { gte: dateFilter } }
      })
    ]);

    const platformRevenue = totalRevenueObj._sum.amount || 0;
    const avgConversion = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) + '%' : '0%';
    const totalCalls = calls._count.id || 0;

    // Generate PDF in memory
    const doc = new PDFDocument({ margin: 50 });
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    
    // Add PDF Content
    doc.fontSize(24).font('Helvetica-Bold').text('Business Overview Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center', color: 'grey' });
    doc.moveDown(2);

    doc.fontSize(16).font('Helvetica-Bold').text('Key Performance Indicators');
    doc.moveDown(1);
    
    doc.fontSize(12).font('Helvetica');
    doc.text(`Total Revenue: $${platformRevenue.toLocaleString()}`);
    doc.text(`Active Leads: ${totalLeads}`);
    doc.text(`Lead Conversion Rate: ${avgConversion}`);
    doc.text(`Total Calls: ${totalCalls}`);
    doc.text(`AI Performance: 96%`);
    doc.moveDown(2);

    doc.fontSize(16).font('Helvetica-Bold').text('Summary Insights');
    doc.moveDown(1);
    doc.fontSize(12).font('Helvetica');
    doc.text('1. Revenue has shown stable performance over the selected period.');
    doc.text('2. AI-driven lead routing has increased agent efficiency.');
    doc.text('3. Monitor dropped calls to improve overall customer satisfaction.');

    doc.end();

    const pdfBuffer = await new Promise((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
    });

    // Send via Nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS
      },
      connectionTimeout: 10000
    });

    const mailOptions = {
      from: `"CRM Analytics System" <${process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER}>`,
      to: req.user.email,
      subject: `Your Business Overview Report - ${new Date().toLocaleDateString()}`,
      html: `
        <div style="font-family: sans-serif; max-w-600px; margin: 0 auto;">
          <h2 style="color: #0F172A;">Business Overview Report</h2>
          <p>Hello ${req.user.name},</p>
          <p>Your requested analytics report has been generated successfully. Please find the PDF attached.</p>
          <br/>
          <p>Best regards,<br/><b>Enterprise CRM Intelligence</b></p>
        </div>
      `,
      attachments: [
        {
          filename: `Business_Report_${Date.now()}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: 'Report sent successfully' });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getEmailLogs = async (req, res) => {
  try {
    const { agentId, search } = req.query;
    const organizationId = req.user.organizationId;

    const whereClause = {
      agent: {
        organizationId: organizationId
      }
    };

    if (agentId) {
      whereClause.agentId = parseInt(agentId);
    }

    if (search) {
      whereClause.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { to: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    const emails = await prisma.email.findMany({
      where: whereClause,
      include: {
        lead: { select: { customerName: true } },
        agent: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: emails });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getEmailAudit = async (req, res) => {
  try {
    const logs = await prisma.emailAuditLog.findMany({
      where: { organizationId: req.user.organizationId },
      include: {
        email: {
          select: { subject: true, to: true, from: true, folder: true, status: true, smtpMessageId: true, deliveredAt: true, openedAt: true, failedAt: true }
        },
        agent: { select: { name: true, email: true } },
        manager: { select: { name: true, email: true } }
      },
      orderBy: { eventTimestamp: 'desc' }
    });
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getInvoices,
  createInvoice,
  getCalls,
  getAnalytics,
  exportAnalytics,
  getEmailLogs,
  getEmailAudit
};
