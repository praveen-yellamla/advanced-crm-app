const prisma = require('../config/prisma');

/**
 * Synchronizes an organization's resource limits and features with its current plan.
 */
const syncSubscriptionLimits = async (organizationId) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: { plan: true }
    });

    if (!org || !org.plan) return;

    const plan = org.plan;

    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        subscriptionTier: plan.tier,
        agentLimit: plan.userLimit,
        leadLimit: plan.leadLimit,
        aiTokenLimit: plan.aiTokenLimit,
        storageLimitMb: plan.storageLimitMb,
        // We preserve manual overrides if needed, but standard sync follows the plan
      }
    });

    return true;
  } catch (error) {
    console.error(`[SYNC_LIMITS_ERROR] Org: ${organizationId}`, error.message);
    return false;
  }
};

module.exports = { syncSubscriptionLimits };
