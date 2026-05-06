const prisma = require('../config/prisma');

const logAudit = async ({ userId, action, target, details, ipAddress }) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        target,
        details: details ? JSON.stringify(details) : null,
        ipAddress
      }
    });
  } catch (error) {
    console.error("Audit Logging Failed:", error);
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: { user: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  logAudit,
  getAuditLogs
};
