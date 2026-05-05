const prisma = require('../config/prisma');

let lastAssignedIndex = 0;

/**
 * Assigns a lead to an agent using a round-robin strategy.
 * Ensures every lead is distributed evenly among active agents.
 */
const assignLeadRoundRobin = async () => {
  try {
    // Get all active agents
    const agents = await prisma.user.findMany({
      where: { 
        role: 'AGENT',
        isActive: true,
        inviteStatus: 'ACCEPTED'
      },
      orderBy: { id: 'asc' }
    });

    if (!agents.length) {
      console.warn("[ASSIGNMENT] No active agents found for auto-assignment.");
      return null;
    }

    // Round-robin selection
    const agent = agents[lastAssignedIndex % agents.length];
    lastAssignedIndex++;

    console.log(`[ASSIGNMENT] Lead assigned to agent: ${agent.name} (ID: ${agent.id})`);
    return agent.id;
  } catch (error) {
    console.error("[ASSIGNMENT ERROR]", error);
    return null;
  }
};

module.exports = { assignLeadRoundRobin };
