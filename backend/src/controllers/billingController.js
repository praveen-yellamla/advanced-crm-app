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
      prisma.aIUsage.aggregate({
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
    const [plan, currentOrg] = await Promise.all([
      prisma.plan.findUnique({ where: { id: parseInt(planId) } }),
      prisma.organization.findUnique({ 
        where: { id: organizationId },
        include: { plan: true }
      })
    ]);

    if (!plan) return res.status(404).json({ success: false, message: 'Invalid plan selected' });
    
    // 1. Check if same plan
    if (currentOrg.planId === plan.id) {
      return res.status(400).json({ success: false, message: 'Organization is already subscribed to this plan.' });
    }

    // 2. USAGE VALIDATION (Professional Downgrade Protection)
    const [userCount, leadCount] = await Promise.all([
      prisma.user.count({ where: { organizationId } }),
      prisma.lead.count({ where: { organizationId } }),
    ]);

    if (userCount > plan.userLimit) {
      return res.status(400).json({ 
        success: false, 
        message: `Downgrade Rejected: Your organization has ${userCount} active users, but the ${plan.name} plan supports a maximum of ${plan.userLimit}. Please offboard users before changing plans.` 
      });
    }

    if (leadCount > plan.leadLimit) {
      return res.status(400).json({ 
        success: false, 
        message: `Downgrade Rejected: Current database contains ${leadCount.toLocaleString()} leads. ${plan.name} plan is capped at ${plan.leadLimit.toLocaleString()}. Please perform a data cleanup before downgrading.` 
      });
    }

    // 3. Perform Transactional Update
    const updatedOrg = await prisma.$transaction(async (tx) => {
      // Update Organization
      const org = await tx.organization.update({
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

      // Generate Professional Invoice
      await tx.platformInvoice.create({
        data: {
          organizationId: organizationId,
          invoiceNo: `INV-SUB-${Date.now().toString().slice(-6)}`,
          amount: plan.priceMonthly,
          currency: 'INR',
          status: 'PAID',
          billingDate: new Date(),
          paidAt: new Date(),
        }
      });

      // Audit Log with correct module
      await tx.auditLog.create({
        data: {
          action: 'SUBSCRIPTION_CHANGE',
          module: 'BILLING',
          details: `System migrated from ${currentOrg.plan?.name || 'Legacy'} to ${plan.name} Plan.`,
          organizationId: organizationId,
          userId: req.user.id
        }
      });

      return org;
    });

    res.json({ 
      success: true, 
      message: `Successfully migrated to ${plan.name} infrastructure.`,
      data: updatedOrg
    });
  } catch (error) {
    res.status(500).json({ success: false, message: `System error during migration: ${error.message}` });
  }
};

module.exports = {
  getBillingOverview,
  getInvoices,
  upgradePlan
};
