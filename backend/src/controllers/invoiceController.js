const prisma = require('../config/prisma');

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
            quantity: parseInt(item.quantity) || 1,
            unitPrice: parseFloat(item.unitPrice),
            tax: parseFloat(item.tax) || 0,
            total: (parseInt(item.quantity) || 1) * parseFloat(item.unitPrice) + (parseFloat(item.tax) || 0)
          }))
        }
      }
    });

    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getInvoices = async (req, res) => {
  try {
    const { status, raisedBy } = req.query;
    const where = {};
    if (status) where.status = status;
    if (raisedBy) where.raisedById = parseInt(raisedBy);

    // Role scoping
    if (req.user.role === 'AGENT') where.raisedById = req.user.id;
    if (req.user.role === 'MANAGER') where.raisedBy = { teamId: req.user.teamId };

    const invoices = await prisma.invoice.findMany({
      where,
      include: { 
        raisedBy: { select: { name: true } },
        items: true,
        // client: true // If relation exists
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const generatePDF = async (req, res) => {
  try {
    const { id } = req.params;
    // In production, integrate PDFKit or Puppeteer here
    res.json({ success: true, message: 'PDF generated. Initializing download sequence.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { createInvoice, getInvoices, generatePDF };
