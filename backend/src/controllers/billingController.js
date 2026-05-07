const prisma = require('../config/prisma');

/**
 * @desc    Get organization billing overview
 * @route   GET /api/billing/overview
 */
const getBillingOverview = async (req, res) => {
  try {
    const { organizationId } = req.user;

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        plan: true,
        platformInvoices: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!org) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    // Calculate usage
    const [userCount, leadCount, aiUsage] = await Promise.all([
      prisma.user.count({ where: { organizationId } }),
      prisma.lead.count({ where: { organizationId } }),
      prisma.aiUsage.aggregate({
        where: { user: { organizationId } },
        _sum: { tokens: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        plan: org.plan,
        subscription: {
          tier: org.subscriptionTier,
          status: org.status,
          expiresAt: org.subscriptionExpiresAt,
          renewalDate: org.subscriptionExpiresAt // Simplified
        },
        usage: {
          users: { current: userCount, limit: org.agentLimit },
          leads: { current: leadCount, limit: org.leadLimit },
          aiTokens: { current: aiUsage._sum.tokens || 0, limit: org.aiTokenLimit }
        },
        invoices: org.platformInvoices
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all platform invoices for organization
 * @route   GET /api/billing/invoices
 */
const getInvoices = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const invoices = await prisma.platformInvoice.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Initialize subscription upgrade (Placeholder for Stripe/Razorpay)
 * @route   POST /api/billing/upgrade
 */
const upgradePlan = async (req, res) => {
  const { planId } = req.body;
  const { organizationId } = req.user;

  try {
    const plan = await prisma.plan.findUnique({ where: { id: parseInt(planId) } });
    if (!plan) return res.status(404).json({ success: false, message: 'Invalid plan protocol' });

    // Update Organization
    const org = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        planId: plan.id,
        subscriptionTier: plan.tier,
        agentLimit: plan.userLimit,
        leadLimit: plan.leadLimit,
        aiTokenLimit: plan.aiTokenLimit,
        storageLimitMb: plan.storageLimitMb,
        status: 'ACTIVE'
      }
    });

    // Create a record in Audit Log
    await prisma.auditLog.create({
      data: {
        action: 'SUBSCRIPTION_UPGRADE',
        details: `Upgraded to ${plan.name}`,
        organizationId: organizationId,
        userId: req.user.id
      }
    });

    res.json({ 
      success: true, 
      message: `Successfully upgraded to ${plan.name} protocol.`,
      data: org
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getBillingOverview,
  getInvoices,
  upgradePlan
};
