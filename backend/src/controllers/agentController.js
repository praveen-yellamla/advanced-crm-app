const prisma = require('../config/prisma');

// ==================================================
// 1. AGENT DASHBOARD & ANALYTICS
// ==================================================
const getDashboardStats = async (req, res) => {
  try {
    const agentId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      callsToday,
      totalTalkTime,
      pendingCallbacks,
      conversionsThisMonth,
      totalRevenue,
      tasksDueToday,
      emailMetrics
    ] = await Promise.all([
      prisma.call.count({ where: { agentId, createdAt: { gte: today } } }),
      prisma.call.aggregate({
        _sum: { durationSeconds: true },
        where: { agentId, createdAt: { gte: today } }
      }),
      prisma.lead.count({ where: { assignedToId: agentId, status: 'INTERESTED' } }),
      prisma.lead.count({ 
        where: { 
          assignedToId: agentId, 
          status: 'WON',
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        } 
      }),
      prisma.invoice.aggregate({
        _sum: { amount: true },
        where: { raisedById: agentId, status: 'PAID' }
      }),
      prisma.task.count({ where: { userId: agentId, dueDate: { lte: today }, status: 'Pending' } }),
      prisma.email.aggregate({
        _count: true,
        _sum: { clickCount: true },
        where: { agentId }
      })
    ]);

    res.json({
      success: true,
      data: {
        cards: {
          callsToday,
          talkTimeToday: totalTalkTime._sum.durationSeconds || 0,
          pendingCallbacks,
          conversionsThisMonth,
          revenueGenerated: totalRevenue._sum.amount || 0,
          tasksDueToday,
          emailsSent: emailMetrics._count || 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================================================
// 2. LEAD PIELINE
// ==================================================
const getMyLeads = async (req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      where: { assignedToId: req.user.id },
      include: {
        calls: { orderBy: { createdAt: 'desc' }, take: 5 },
        emails: { orderBy: { sentAt: 'desc' }, take: 5 }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: leads });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, customerName, email, phone } = req.body;
    
    const lead = await prisma.lead.update({
      where: { id: parseInt(id), assignedToId: req.user.id },
      data: { status, customerName, email, phone }
    });
    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================================================
// 3. CALLS & DIALER
// ==================================================
const startCall = async (req, res) => {
  try {
    const { leadId } = req.body;
    // In real app, initialize WebRTC/Twilio session here
    res.json({ success: true, message: "Call session initialized", callSid: `SIM_${Date.now()}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const logCall = async (req, res) => {
  try {
    const { leadId, durationSeconds, callStatus, recordingUrl } = req.body;
    const call = await prisma.call.create({
      data: {
        leadId: parseInt(leadId),
        agentId: req.user.id,
        durationSeconds: parseInt(durationSeconds),
        callStatus,
        recordingUrl
      }
    });
    res.json({ success: true, data: call });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCallHistory = async (req, res) => {
  try {
    const calls = await prisma.call.findMany({
      where: { agentId: req.user.id },
      include: { lead: { select: { customerName: true, phone: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: calls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================================================
// 4. TASKS
// ==================================================
const getMyTasks = async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: req.user.id },
      orderBy: { dueDate: 'asc' }
    });
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createTask = async (req, res) => {
  try {
    const { title, description, dueDate, priority, type, tags } = req.body;
    const task = await prisma.task.create({
      data: {
        title, 
        description, 
        dueDate: dueDate ? new Date(dueDate) : null, 
        priority: priority || 'Normal',
        type: type || 'FOLLOWUP',
        tags: tags || {},
        userId: req.user.id
      }
    });
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, title, description, dueDate, priority } = req.body;
    const task = await prisma.task.update({
      where: { id: parseInt(id), userId: req.user.id },
      data: { 
        status, 
        title, 
        description, 
        dueDate: dueDate ? new Date(dueDate) : undefined, 
        priority 
      }
    });
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.task.delete({
      where: { id: parseInt(id), userId: req.user.id }
    });
    res.json({ success: true, message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================================================
// 5. INVOICING
// ==================================================
const createInvoice = async (req, res) => {
  try {
    const { clientId, amount, dueDate, items } = req.body;
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo: `INV-${Date.now()}`,
        clientId: parseInt(clientId),
        raisedById: req.user.id,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        status: 'PENDING',
        items: {
          create: items.map(item => ({
            description: item.description,
            quantity: parseInt(item.quantity),
            unitPrice: parseFloat(item.unitPrice),
            tax: parseFloat(item.tax) || 0,
            total: (parseInt(item.quantity) * parseFloat(item.unitPrice)) + (parseFloat(item.tax) || 0)
          }))
        }
      }
    });
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyInvoices = async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { raisedById: req.user.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================================================
// 6. FEEDBACK & EMAILS
// ==================================================
const getFeedback = async (req, res) => {
  try {
    const feedback = await prisma.feedback.findMany({
      where: { agentId: req.user.id },
      include: { manager: { select: { name: true } }, call: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const sendEmail = async (req, res) => {
  try {
    const { leadId, subject, content } = req.body;
    const email = await prisma.email.create({
      data: {
        leadId: parseInt(leadId),
        agentId: req.user.id,
        subject,
        content,
        status: 'SENT'
      }
    });
    res.json({ success: true, data: email });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyEmails = async (req, res) => {
  try {
    const emails = await prisma.email.findMany({
      where: { agentId: req.user.id },
      include: { lead: { select: { customerName: true, email: true } } },
      orderBy: { sentAt: 'desc' }
    });
    res.json({ success: true, data: emails });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getMyLeads,
  updateLead,
  startCall,
  logCall,
  getCallHistory,
  getMyTasks,
  createTask,
  updateTask,
  deleteTask,
  createInvoice,
  getMyInvoices,
  getFeedback,
  sendEmail,
  getMyEmails
};
