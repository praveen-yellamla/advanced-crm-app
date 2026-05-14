const aiService = require('../services/aiService');
const prisma = require('../config/prisma');

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

    res.json({ success: true, results: response });
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
      take: 50 // Limit to last 50 for performance
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
    const usage = await prisma.aIUsage.aggregate({
      _sum: { tokens: true, cost: true },
      _count: { _all: true }
    });
    
    // Get usage trend for last 7 days
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const trend = await prisma.aIUsage.findMany({
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
  getChatHistory,
  getLeadScore,
  getAISettings,
  updateAISettings,
  getAIUsage
};
