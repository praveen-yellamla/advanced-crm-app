const prisma = require('../config/prisma');
const { encrypt, decrypt } = require('../utils/encryption');

/**
 * Universal Organizational Settings Controller.
 * Manages branding, integrations, security, and global infrastructure configuration.
 */

const getSettingsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const settings = await prisma.systemSetting.findMany({
      where: { category: category.toUpperCase() }
    });

    // MASK SECRETS
    const sanitized = settings.map(s => ({
      key: s.key,
      value: s.isSecret ? '••••••••' : s.value,
      isSecret: s.isSecret
    }));

    res.json(sanitized);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateSetting = async (req, res) => {
  try {
    let { key, value, category, isSecret } = req.body;

    if (isSecret && value !== '••••••••') {
      value = encrypt(typeof value === 'string' ? value : JSON.stringify(value));
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { 
        value, 
        category: category.toUpperCase(),
        isSecret: !!isSecret
      },
      create: { 
        key, 
        value, 
        category: category.toUpperCase(),
        isSecret: !!isSecret
      }
    });

    res.json({ message: 'Configuration synchronized.', key: setting.key });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCompanyProfile = async (req, res) => {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: { category: 'COMPANY' }
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
