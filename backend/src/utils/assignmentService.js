const prisma = require('../config/prisma');

// Use a map to store lastAssignedIndex per organization for true isolation
const orgAssignmentIndices = new Map();

/**
 * Assigns a lead to an agent using a round-robin strategy within an organization.
 * Ensures every lead is distributed evenly among active agents of that specific tenant.
 */
const assignLeadRoundRobin = async (organizationId) => {
  if (!organizationId) {
    console.warn("[ASSIGNMENT] Missing organizationId for auto-assignment.");
    return null;
  }

  try {
    // Get active agents for THIS organization only
    const agents = await prisma.user.findMany({
      where: { 
        organizationId,
        role: 'AGENT',
        isActive: true,
        inviteStatus: 'ACCEPTED'
      },
      orderBy: { id: 'asc' }
    });

    if (!agents.length) {
      console.warn(`[ASSIGNMENT] No active agents found for Organization ID: ${organizationId}`);
      return null;
    }

    // Tenant-isolated Round-robin selection
    const lastIndex = orgAssignmentIndices.get(organizationId) || 0;
    const agent = agents[lastIndex % agents.length];
    
    // Increment index for THIS organization
    orgAssignmentIndices.set(organizationId, lastIndex + 1);

    console.log(`[ASSIGNMENT] Lead assigned to agent: ${agent.name} (ID: ${agent.id}) in Org: ${organizationId}`);
    return agent.id;
  } catch (error) {
    console.error("[ASSIGNMENT ERROR]", error);
    return null;
  }
};

module.exports = { assignLeadRoundRobin };
