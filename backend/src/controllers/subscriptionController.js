const subscriptionService = require('../services/subscriptionService');
const prisma = require('../config/prisma');

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

    const [org, invoices, transactions] = await Promise.all([
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

module.exports = {
  getCheckoutSummary,
  initiateUpgrade,
  verifyPayment,
  getBillingDetails
};
