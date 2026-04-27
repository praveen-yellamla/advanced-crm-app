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

module.exports = {
  getInvoices,
  createInvoice,
  getCalls
};
