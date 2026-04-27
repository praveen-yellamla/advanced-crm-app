const prisma = require('../config/prisma');

/**
 * High-authority audit logging protocol.
 * Tracks organizational state changes for compliance and accountability.
 */
const logAudit = async ({ userId, action, module, oldValue, newValue, ipAddress }) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        module,
        oldValue: oldValue || null,
        newValue: newValue || null,
        ipAddress
      }
    });
  } catch (error) {
    console.error('Audit sync failure:', error.message);
  }
};

module.exports = { logAudit };
