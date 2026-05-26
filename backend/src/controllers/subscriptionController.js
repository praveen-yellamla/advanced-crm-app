const subscriptionService = require('../services/subscriptionService');
const prisma = require('../config/prisma');
const PDFDocument = require('pdfkit');

/**
 * Subscription Controller
 * Handles user requests for plan management and payments
 */
const getCheckoutSummary = async (req, res) => {
  try {
    const { planId, billingCycle } = req.query;
    const { organizationId } = req.user;

    if (!planId || !billingCycle) {
      return res.status(400).json({ success: false, message: 'Plan ID and Billing Cycle are required' });
    }

    const summary = await subscriptionService.calculateProration(
      organizationId, 
      parseInt(planId), 
      billingCycle
    );

    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const initiateUpgrade = async (req, res) => {
  try {
    const { planId, billingCycle, gateway } = req.body;
    const { organizationId, id: userId } = req.user;

    const order = await subscriptionService.createSubscriptionOrder(
      organizationId,
      userId,
      { planId: parseInt(planId), billingCycle, gateway }
    );

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const { organizationId, id: userId } = req.user;

    const updatedOrg = await subscriptionService.verifyAndActivate(
      organizationId, 
      userId, 
      { razorpay_order_id, razorpay_payment_id, razorpay_signature }
    );

    res.json({ 
      success: true, 
      message: 'Subscription activated successfully!',
      data: updatedOrg 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getBillingDetails = async (req, res) => {
  try {
    const { organizationId } = req.user;

    let [org, invoices, transactions] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: organizationId },
        include: { plan: true }
      }),
      prisma.platformInvoice.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.platformTransaction.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);
    
    // Self-heal: If period dates are missing (e.g. from seed), set them.
    if (org && !org.currentPeriodEnd) {
      org = await prisma.organization.update({
        where: { id: organizationId },
        data: {
          currentPeriodStart: new Date(),
          currentPeriodEnd: org.billingCycle === 'YEARLY' 
            ? new Date(new Date().setFullYear(new Date().getFullYear() + 1)) 
            : new Date(new Date().setMonth(new Date().getMonth() + 1))
        },
        include: { plan: true }
      });
    }

    res.json({
      success: true,
      data: {
        subscription: org,
        invoices,
        transactions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user;

    const invoice = await prisma.platformInvoice.findFirst({
      where: { id: parseInt(id), organizationId }
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const org = await prisma.organization.findUnique({
      where: { id: organizationId }
    });

    // Create a PDF document
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${invoice.invoiceNo}.pdf`);

    doc.pipe(res);

    // Build the PDF
    doc.fontSize(20).text('INVOICE', { align: 'right' });
    doc.fontSize(10).text(`Invoice No: ${invoice.invoiceNo}`, { align: 'right' });
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, { align: 'right' });
    
    doc.moveDown(2);
    doc.fontSize(16).text('Advanced CRM', { underline: true });
    doc.fontSize(10).text('123 Business Avenue');
    doc.text('Tech District, City');
    
    doc.moveDown(2);
    doc.fontSize(12).text('Bill To:', { underline: true });
    doc.fontSize(10).text(org.name);
    doc.text(`Organization ID: ${org.id}`);
    
    doc.moveDown(3);
    
    // Draw table header
    const tableTop = doc.y;
    doc.font('Helvetica-Bold');
    doc.text('Description', 50, tableTop);
    doc.text('Period', 250, tableTop);
    doc.text('Amount', 450, tableTop, { align: 'right' });
    
    doc.moveTo(50, tableTop + 15).lineTo(500, tableTop + 15).stroke();
    
    // Draw table row
    const rowTop = tableTop + 25;
    doc.font('Helvetica');
    doc.text('Subscription Plan', 50, rowTop);
    doc.text(`${new Date(invoice.periodStart).toLocaleDateString()} - ${new Date(invoice.periodEnd).toLocaleDateString()}`, 250, rowTop);
    doc.text(`Rs. ${invoice.amount.toLocaleString()}`, 450, rowTop, { align: 'right' });
    
    doc.moveTo(50, rowTop + 15).lineTo(500, rowTop + 15).stroke();
    
    // Total
    doc.moveDown(2);
    doc.font('Helvetica-Bold');
    doc.text(`Total Paid: Rs. ${invoice.amount.toLocaleString()}`, { align: 'right' });
    
    doc.moveDown(4);
    doc.font('Helvetica');
    doc.text('Thank you for your business!', { align: 'center' });

    doc.end();

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCheckoutSummary,
  initiateUpgrade,
  verifyPayment,
  getBillingDetails,
  downloadInvoice
};
