const prisma = require('../config/prisma');

const getIntegrations = async (req, res) => {
  try {
    const integrations = await prisma.integrationAccount.findMany({
      where: { isActive: true }
    });
    res.json({ success: true, data: integrations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const connectMeta = async (req, res) => {
  try {
    const integration = await prisma.integrationAccount.upsert({
      where: { id: 1 }, // Simple logic for Sprint 1
      update: {
        platform: 'META',
        accountName: 'Meta LeadGen Active',
        accessToken: 'WEBHOOK_VERIFIED',
        isActive: true
      },
      create: {
        platform: 'META',
        accountName: 'Meta LeadGen Active',
        accessToken: 'WEBHOOK_VERIFIED',
        isActive: true
      }
    });
    res.json({ success: true, data: integration });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getIntegrations,
  connectMeta
};
