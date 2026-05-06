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
      where: { id: parseInt(id) },
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
    const invoice = await prisma.invoice.update({
      where: { id: parseInt(id) },
      data: { status }
    });
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. LIST ALL (For Admin/Manager)
const getAllInvoices = async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: { raisedBy: { select: { name: true } }, lead: { select: { customerName: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createInvoice,
  getInvoice,
  updateInvoiceStatus,
  getAllInvoices
};
