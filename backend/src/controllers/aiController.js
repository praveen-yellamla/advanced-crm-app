const aiService = require('../services/aiService');

const getLeadScore = async (req, res) => {
  const { leadId } = req.params;
  try {
    const result = await aiService.scoreLead(parseInt(leadId));
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCallSummary = async (req, res) => {
  const { callId } = req.params;
  const { transcript } = req.body;
  try {
    const result = await aiService.summarizeCall(parseInt(callId), transcript);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLeadScore,
  getCallSummary
};
