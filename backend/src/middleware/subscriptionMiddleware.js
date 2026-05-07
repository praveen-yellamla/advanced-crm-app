const prisma = require('../config/prisma');

/**
 * Middleware to check resource limits (e.g., max agents, max leads)
 */
const checkLimit = (resourceType) => {
  return async (req, res, next) => {
    try {
      const { organizationId, role } = req.user;

      // Super admins bypass limit checks
      if (role === 'SUPER_ADMIN') return next();

      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: { plan: true }
      });

      if (!org) {
        return res.status(404).json({ success: false, message: 'Organization not found' });
      }

      // 1. Check if organization is suspended
      if (org.status === 'SUSPENDED') {
        return res.status(403).json({ 
          success: false, 
          message: 'Your workspace is suspended. Please contact support or clear pending dues.',
          code: 'SUBSCRIPTION_SUSPENDED'
        });
      }

      // 2. Resource specific checks
      if (resourceType === 'AGENT') {
        const agentCount = await prisma.user.count({
          where: { organizationId, role: { not: 'SUPER_ADMIN' } }
        });

        if (agentCount >= org.agentLimit) {
          return res.status(403).json({
            success: false,
            message: `Agent limit reached (${org.agentLimit}). Upgrade your plan to add more agents.`,
            code: 'LIMIT_EXCEEDED'
          });
        }
      }

      if (resourceType === 'LEAD') {
        const leadCount = await prisma.lead.count({
          where: { organizationId }
        });

        if (leadCount >= org.leadLimit) {
          return res.status(403).json({
            success: false,
            message: `Lead limit reached (${org.leadLimit}). Upgrade your plan to store more leads.`,
            code: 'LIMIT_EXCEEDED'
          });
        }
      }

      next();
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
};

/**
 * Middleware to check feature availability based on Plan boolean flags
 */
const checkFeature = (featureKey) => {
  return async (req, res, next) => {
    try {
      const { organizationId, role } = req.user;

      // Super admins bypass feature gates
      if (role === 'SUPER_ADMIN') return next();

      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: { plan: true }
      });

      if (!org || !org.plan) {
        return res.status(403).json({ 
          success: false, 
          message: 'Subscription plan not active' 
        });
      }

      // Check the specific boolean flag on the Plan model
      let isEnabled = false;
      
      switch (featureKey) {
        case 'ai_assistant':
          isEnabled = org.plan.aiAssistant;
          break;
        case 'calling':
          isEnabled = org.plan.callingEnabled;
          break;
        case 'automation':
          isEnabled = org.plan.automationEnabled;
          break;
        case 'analytics':
          isEnabled = org.plan.analyticsEnabled;
          break;
        case 'monitoring':
          isEnabled = org.plan.monitoringEnabled;
          break;
        default:
          isEnabled = false;
      }

      if (!isEnabled) {
        return res.status(403).json({
          success: false,
          message: `The ${featureKey.replace('_', ' ')} feature is not available on your ${org.subscriptionTier} plan.`,
          code: 'FEATURE_LOCKED'
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
};

module.exports = {
  checkLimit,
  checkFeature
};
