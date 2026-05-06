const aiService = require('../services/aiService');
const prisma = require('../config/prisma');

/**
 * CONVERSATIONAL AI CHAT
 */
const chatAssistant = async (req, res) => {
  try {
    const { message, history } = req.body;
    const response = await aiService.chatWithCRM(req.user.id, message, history);
    res.json({ success: true, data: response });
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
 * AI SYSTEM SETTINGS (DATABASE PERSISTED)
 */
const getAISettings = async (req, res) => {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: { category: 'AI' }
    });
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateAISettings = async (req, res) => {
  try {
    const { key, value } = req.body;
    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value, category: 'AI' },
      create: { key, value, category: 'AI' }
    });
    res.json({ success: true, data: setting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * AI USAGE ANALYTICS
 */
const getAIUsage = async (req, res) => {
  try {
    const usage = await prisma.aiUsage.aggregate({
      _sum: { tokens: true, cost: true },
      _count: { _all: true }
    });
    
    // Get usage trend for last 7 days
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const trend = await prisma.aiUsage.findMany({
      where: { createdAt: { gte: lastWeek } },
      orderBy: { createdAt: 'asc' }
    });

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
  getLeadScore,
  getAISettings,
  updateAISettings,
  getAIUsage
};
