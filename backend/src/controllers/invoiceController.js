const prisma = require('../config/prisma');

// 1. CREATE INVOICE
const createInvoice = async (req, res) => {
  const { leadId, clientId, items, taxRate, discount, currency = 'USD' } = req.body;
  const userId = req.user.id;

  try {
    const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount - (discount || 0);

    const invoice = await prisma.invoice.create({
      data: {
        organizationId: req.user.organizationId,
        invoiceNo: `INV-${Date.now()}`,
        leadId: leadId ? parseInt(leadId) : null,
        clientId: clientId ? parseInt(clientId) : null,
        raisedById: userId,
        amount: total,
        status: 'PENDING',
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days default
        items: {
          create: items.map(item => ({
            description: item.description,
            quantity: parseInt(item.quantity),
            unitPrice: parseFloat(item.unitPrice),
            tax: (item.quantity * item.unitPrice) * (taxRate / 100),
            total: (item.quantity * item.unitPrice) + ((item.quantity * item.unitPrice) * (taxRate / 100))
          }))
        }
      },
      include: { items: true }
    });

    const { sendNotification, triggerRealtimeEvent, logActivity } = require('../utils/realtimeHelper');

    // Notify Manager of team if available
    const manager = await prisma.user.findFirst({
      where: { role: 'MANAGER', teamId: req.user.teamId, organizationId: req.user.organizationId }
    });

    if (manager) {
      await sendNotification({
        organizationId: req.user.organizationId,
        userId: manager.id,
        title: 'New Invoice Raised',
        message: `Agent ${req.user.name} has raised invoice ${invoice.invoiceNo} for $${invoice.amount}.`,
        type: 'INFO',
        priority: 'MEDIUM',
        metadata: { invoiceId: invoice.id }
      });
    }

    triggerRealtimeEvent(`org_${req.user.organizationId}`, 'invoice:created', invoice);
    if (req.user.teamId) {
      triggerRealtimeEvent(`team_${req.user.teamId}`, 'invoice:created', invoice);
    }

    await logActivity({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'invoice.created',
      entityType: 'INVOICE',
      entityId: invoice.id,
      newValue: { invoiceNo: invoice.invoiceNo, amount: invoice.amount },
      teamId: req.user.teamId
    });

    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. GET INVOICE DETAILS
const getInvoice = async (req, res) => {
  const { id } = req.params;
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { 
        id: parseInt(id),
        organizationId: req.user.organizationId
      },
      include: { 
        items: true, 
        raisedBy: { select: { name: true, email: true } },
        lead: true
      }
    });
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. UPDATE STATUS
const updateInvoiceStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const existing = await prisma.invoice.findFirst({
      where: { id: parseInt(id), organizationId: req.user.organizationId },
      include: { raisedBy: true }
    });

    if (!existing) return res.status(404).json({ success: false, message: "Invoice not found" });

    const invoice = await prisma.invoice.update({
      where: { 
        id: parseInt(id),
        organizationId: req.user.organizationId
      },
      data: { status }
    });

    const { sendNotification, triggerRealtimeEvent, logActivity } = require('../utils/realtimeHelper');

    // Notify Agent
    await sendNotification({
      organizationId: req.user.organizationId,
      userId: invoice.raisedById,
      title: 'Invoice Status Updated',
      message: `Your invoice ${invoice.invoiceNo} status is now: ${status}.`,
      type: status === 'PAID' ? 'SUCCESS' : status === 'ESCALATED' ? 'WARNING' : 'INFO',
      priority: 'HIGH',
      metadata: { invoiceId: invoice.id }
    });

    triggerRealtimeEvent(`user_${invoice.raisedById}`, 'invoice:updated', invoice);
    triggerRealtimeEvent(`org_${req.user.organizationId}`, 'invoice:updated', invoice);
    if (req.user.teamId) {
      triggerRealtimeEvent(`team_${req.user.teamId}`, 'invoice:updated', invoice);
    }

    if (status === 'ESCALATED') {
      // Notify Admin
      triggerRealtimeEvent(`org_${req.user.organizationId}_admins`, 'invoice:escalated', invoice);
    }

    await logActivity({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: `invoice.${status.toLowerCase()}`,
      entityType: 'INVOICE',
      entityId: invoice.id,
      oldValue: { status: existing.status },
      newValue: { status },
      teamId: req.user.teamId
    });

    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. LIST ALL (For Admin/Manager)
const getInvoices = async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { organizationId: req.user.organizationId },
      include: { raisedBy: { select: { name: true } }, lead: { select: { customerName: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. GENERATE PDF
const generatePDF = async (req, res) => {
  // Placeholder for PDF generation
  res.status(501).json({ success: false, message: "PDF generation not yet implemented." });
};

module.exports = {
  createInvoice,
  getInvoice,
  updateInvoiceStatus,
  getInvoices,
  generatePDF
};
