const prisma = require('../config/prisma');

/**
 * Enterprise Audit Logging Service
 */
const logActivity = async ({
  organizationId,
  userId,
  action,
  module,
  oldValue = null,
  newValue = null,
  ipAddress = null,
  userAgent = null,
  details = {}
}) => {
  try {
    return await prisma.auditLog.create({
      data: {
        organizationId: organizationId || null,
        userId: userId || null,
        action,
        module,
        ipAddress,
        userAgent,
        details: {
          ...details,
          oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
          newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
        }
      }
    });
  } catch (error) {
    console.error('[AUDIT_LOG_ERROR]:', error.message);
    // We don't throw here to avoid breaking the main flow, but we log it
  }
};

module.exports = { logActivity };
