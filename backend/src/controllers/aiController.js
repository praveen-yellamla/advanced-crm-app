const aiService = require('../services/aiService');
const prisma = require('../config/prisma');
const { encrypt, decrypt } = require('../utils/encryption');

/**
 * CONVERSATIONAL AI CHAT
 */
const chatAssistant = async (req, res) => {
  try {
    const { message, query, history } = req.body;
    const finalMessage = message || query;
    const { organizationId, id: userId } = req.user;
    
    if (!finalMessage) {
      return res.status(400).json({ success: false, message: "No query provided" });
    }

    // Save User Message
    await prisma.chatMessage.create({
      data: { userId, role: 'user', content: finalMessage }
    });

    const response = await aiService.chatWithCRM(userId, organizationId, finalMessage, history);
    
    // Save Assistant Response
    await prisma.chatMessage.create({
      data: { userId, role: 'assistant', content: response }
    });

    res.json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getChatHistory = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const history = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: 50
    });
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * LEAD SCORING PIPELINE
 */
const getLeadScore = async (req, res) => {
  const { leadId } = req.params;
  try {
    const result = await aiService.scoreLead(parseInt(leadId));
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * AI SYSTEM SETTINGS (TENANT-ISOLATED via OrganizationSetting)
 * Returns settings as a flat key-value map for the frontend
 */
const getAISettings = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const settings = await prisma.organizationSetting.findMany({
      where: {
        organizationId,
        key: { startsWith: 'AI_' }
      }
    });

    // Convert to flat key-value map, masking secrets
    const config = {};
    settings.forEach(s => {
      // Mask API keys in the response
      if (s.key === 'AI_GEMINI_API_KEY' && s.value) {
        config[s.key] = '••••••••••••••••••••'; // Masked
        config['AI_GEMINI_KEY_CONFIGURED'] = true;
      } else {
        config[s.key] = s.value;
      }
    });

    // Derive provider status
    const hasKey = settings.some(s => s.key === 'AI_GEMINI_API_KEY' && s.value);
    config['AI_PROVIDER_STATUS'] = hasKey ? 'CONFIGURED' : 'UNCONFIGURED';
    config['AI_PROVIDER'] = 'GEMINI';

    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * UPDATE A SINGLE AI SETTING (TENANT-ISOLATED)
 */
const updateAISetting = async (req, res) => {
  try {
    const { key, value } = req.body;
    const organizationId = req.user.organizationId;

    if (!key || !key.startsWith('AI_')) {
      return res.status(400).json({ success: false, message: 'Invalid AI setting key.' });
    }

    // Encrypt sensitive values before persisting
    let storedValue = value;
    if (key === 'AI_GEMINI_API_KEY' && value && !value.includes('•')) {
      storedValue = encrypt(value);
    }

    const setting = await prisma.organizationSetting.upsert({
      where: {
        organizationId_key: { organizationId, key }
      },
      update: { value: storedValue },
      create: { organizationId, key, value: storedValue }
    });

    // Broadcast the update to all org sockets (excluding secret value)
    const { triggerRealtimeEvent } = require('../utils/realtimeHelper');
    triggerRealtimeEvent(`org_${organizationId}`, 'setting:updated', {
      key: setting.key,
      value: key === 'AI_GEMINI_API_KEY' ? '[REDACTED]' : storedValue
    });

    res.json({ success: true, message: 'AI configuration saved.', key: setting.key });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * VALIDATE AI API KEY (real connection test)
 */
const validateAPIKey = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    // Retrieve encrypted key from org settings
    const keySetting = await prisma.organizationSetting.findUnique({
      where: { organizationId_key: { organizationId, key: 'AI_GEMINI_API_KEY' } }
    });

    if (!keySetting || !keySetting.value) {
      return res.status(400).json({
        success: false,
        status: 'UNCONFIGURED',
        message: 'No Gemini API key configured for this organization.'
      });
    }

    const decryptedKey = decrypt(keySetting.value);

    // Validate with a minimal prompt
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(decryptedKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    await model.generateContent('ping');

    // Update validation timestamp
    await prisma.organizationSetting.upsert({
      where: { organizationId_key: { organizationId, key: 'AI_KEY_VALIDATED_AT' } },
      update: { value: new Date().toISOString() },
      create: { organizationId, key: 'AI_KEY_VALIDATED_AT', value: new Date().toISOString() }
    });

    res.json({
      success: true,
      status: 'VALID',
      provider: 'GEMINI',
      model: 'gemini-2.0-flash',
      message: 'API key validated successfully. AI orchestration is online.'
    });
  } catch (error) {
    const isInvalidKey = error.message?.includes('API_KEY_INVALID') ||
      error.message?.includes('invalid_api_key') ||
      error.message?.includes('API key not valid');

    res.status(isInvalidKey ? 401 : 500).json({
      success: false,
      status: 'INVALID',
      message: isInvalidKey
        ? 'The provided Gemini API key is invalid. Please check your credentials.'
        : `Validation error: ${error.message}`
    });
  }
};

/**
 * GET LIVE AI SYSTEM STATUS
 */
const getAIStatus = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const [keySetting, validatedAt, usageToday] = await Promise.all([
      prisma.organizationSetting.findUnique({
        where: { organizationId_key: { organizationId, key: 'AI_GEMINI_API_KEY' } }
      }),
      prisma.organizationSetting.findUnique({
        where: { organizationId_key: { organizationId, key: 'AI_KEY_VALIDATED_AT' } }
      }),
      prisma.aIUsage.aggregate({
        where: {
          organizationId,
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        },
        _sum: { tokens: true, cost: true },
        _count: { _all: true }
      })
    ]);

    const isConfigured = !!(keySetting?.value);
    const isValidated = !!(validatedAt?.value);

    res.json({
      success: true,
      data: {
        status: isConfigured && isValidated ? 'ONLINE' : isConfigured ? 'CONFIGURED' : 'OFFLINE',
        provider: 'GEMINI',
        model: 'gemini-2.0-flash',
        keyConfigured: isConfigured,
        keyValidated: isValidated,
        lastValidated: validatedAt?.value || null,
        todayTokens: usageToday._sum.tokens || 0,
        todayCost: usageToday._sum.cost || 0,
        todayRequests: usageToday._count._all || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * AI USAGE ANALYTICS
 */
const getAIUsage = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const [usage, trend] = await Promise.all([
      prisma.aIUsage.aggregate({
        where: { organizationId },
        _sum: { tokens: true, cost: true },
        _count: { _all: true }
      }),
      (() => {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        return prisma.aIUsage.findMany({
          where: { organizationId, createdAt: { gte: lastWeek } },
          orderBy: { createdAt: 'asc' }
        });
      })()
    ]);

    res.json({
      success: true,
      data: {
        totalTokens: usage._sum.tokens || 0,
        totalCost: usage._sum.cost || 0,
        requestCount: usage._count._all || 0,
        trend
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  chatAssistant,
  getChatHistory,
  getLeadScore,
  getAISettings,
  updateAISetting,
  validateAPIKey,
  getAIStatus,
  getAIUsage
};
