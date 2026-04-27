const prisma = require('../config/prisma');
const aiService = require('../utils/aiService');

// ==================================================
// 1. ADMIN AI CONTROLS
// ==================================================
const getAISettings = async (req, res) => {
  try {
    const settings = await prisma.aISettings.findMany();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateAISettings = async (req, res) => {
  try {
    const { key, value } = req.body;
    const setting = await prisma.aISettings.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAIUsage = async (req, res) => {
  try {
    const usage = await prisma.aIUsage.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } }
    });
    res.json(usage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================================================
// 2. LEAD INTELLIGENCE
// ==================================================
const scoreLead = async (req, res) => {
  try {
    const { leadId } = req.params;
    const intel = await aiService.generateIntelligence(req.user.id, 'SCORING', `Lead ID: ${leadId}`);
    const { score, reasoning } = JSON.parse(intel);

    const updatedLead = await prisma.lead.update({
      where: { id: parseInt(leadId) },
      data: { score, scoreReasoning: reasoning }
    });

    res.json(updatedLead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const summarizeLead = async (req, res) => {
  try {
    const { leadId } = req.params;
    const summary = await aiService.generateIntelligence(req.user.id, 'SUMMARY', `Lead ID: ${leadId}`);

    const updatedLead = await prisma.lead.update({
      where: { id: parseInt(leadId) },
      data: { aiSummary: summary }
    });

    res.json(updatedLead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================================================
// 3. CALL & CONVERSATION SYNC
// ==================================================
const transcribeCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const transcript = await aiService.generateIntelligence(req.user.id, 'TRANSCRIPTION', `Call ID: ${callId}`);

    const updatedCall = await prisma.call.update({
      where: { id: parseInt(callId) },
      data: { transcript }
    });

    res.json(updatedCall);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================================================
// 4. NATURAL LANGUAGE QUERY (NLQ)
// ==================================================
const processNLQuery = async (req, res) => {
  try {
    const { query, history } = req.body;
    // In production, this would translate text to SQL/Prisma query using LLM context
    const results = await aiService.generateIntelligence(req.user.id, 'NL_QUERY', query);
    
    res.json({ 
      success: true,
      results, 
      query,
      message: "Sync complete."
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "AI is temporarily busy. Please try again in a moment.",
      error: error.message 
    });
  }
};

module.exports = {
  getAISettings,
  updateAISettings,
  getAIUsage,
  scoreLead,
  summarizeLead,
  transcribeCall,
  processNLQuery
};
