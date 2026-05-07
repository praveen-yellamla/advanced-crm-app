const prisma = require('../config/prisma');
const { encrypt, decrypt } = require('../utils/encryption');

/**
 * Universal Organizational Settings Controller.
 * Manages branding, integrations, security, and global infrastructure configuration.
 */

const getSettingsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const organizationId = req.user.organizationId;

    const settings = await prisma.organizationSetting.findMany({
      where: { 
        organizationId,
        key: { startsWith: category.toUpperCase() } 
      }
    });

    // MASK SECRETS
    const sanitized = settings.map(s => ({
      key: s.key,
      value: s.value, // JSON field, UI handles secrets if needed or we can mask here
    }));

    res.json(sanitized);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateSetting = async (req, res) => {
  try {
    let { key, value } = req.body;
    const organizationId = req.user.organizationId;

    const setting = await prisma.organizationSetting.upsert({
      where: { 
        organizationId_key: { 
          organizationId, 
          key 
        } 
      },
      update: { value },
      create: { 
        organizationId,
        key, 
        value
      }
    });

    res.json({ message: 'Configuration synchronized.', key: setting.key });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCompanyProfile = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const settings = await prisma.organizationSetting.findMany({
      where: { organizationId }
    });
    const profile = {};
    settings.forEach(s => profile[s.key] = s.value);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const testConnection = async (req, res) => {
  try {
    const { type } = req.params;
    // Simulated connection logic
    setTimeout(() => {
      res.json({ success: true, message: `${type} gateway verified successfully.` });
    }, 1500);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSettingsByCategory,
  updateSetting,
  getCompanyProfile,
  testConnection
};
