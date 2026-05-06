const { OpenAI } = require('openai');
const prisma = require('../config/prisma');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'missing-key',
});

/**
 * CORE AI CONVERSATIONAL ENGINE
 * Analyzes CRM context and provides intelligent responses
 */
const chatWithCRM = async (userId, message, history = []) => {
  try {
    // 1. DATA AGGREGATION LAYER
    // We fetch a snapshot of the CRM to give the AI context
    const [leadsCount, callsCount, tasksCount, recentLeads, performance] = await Promise.all([
      prisma.lead.count(),
      prisma.call.count(),
      prisma.task.count(),
      prisma.lead.findMany({ take: 5, orderBy: { createdAt: 'desc' }, select: { customerName: true, status: true, source: true } }),
      prisma.call.groupBy({
        by: ['status'],
        _count: { _all: true }
      })
    ]);

    const crmContext = `
      CURRENT CRM SNAPSHOT:
      - Total Leads: ${leadsCount}
      - Total Calls: ${callsCount}
      - Total Tasks: ${tasksCount}
      - Recent Leads: ${JSON.stringify(recentLeads)}
      - Call Status Distribution: ${JSON.stringify(performance)}
      - System Date: ${new Date().toISOString()}
    `;

    // 2. PROMPT CONSTRUCTION
    const systemPrompt = `
      You are "Zia", the Advanced CRM Intelligence Assistant. 
      You have access to real-time CRM data and operations.
      Your goal is to help administrators manage the platform, optimize sales, and analyze performance.
      
      CRITICAL INSTRUCTIONS:
      - Use the provided CRM Context to answer questions accurately.
      - If you need to perform an action (like creating a task), explain that you can do it.
      - Be professional, concise, and data-driven.
      - Format your responses in clean Markdown.
      - If data is missing, offer to find it or explain what is needed.
      
      ${crmContext}
    `;

    // 3. EXECUTION
    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-10), // Keep last 10 messages for context
      { role: "user", content: message }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages,
      temperature: 0.5,
      max_tokens: 1000
    });

    const aiResponse = response.choices[0].message.content;

    // 4. USAGE TRACKING
    await prisma.aiUsage.create({
      data: {
        userId,
        module: 'CHAT_ASSISTANT',
        tokens: response.usage.total_tokens,
        cost: (response.usage.total_tokens / 1000) * 0.01 // Simplified cost calculation
      }
    });

    return aiResponse;
  } catch (error) {
    console.error("AI Chat Error:", error);
    throw new Error("Intelligence core is currently calibrating. Please retry in a moment.");
  }
};

/**
 * DYNAMIC LEAD SCORING
 */
const scoreLead = async (leadId) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        calls: { take: 10, orderBy: { createdAt: 'desc' } },
        activities: { take: 10, orderBy: { createdAt: 'desc' } }
      }
    });

    if (!lead) return null;

    const prompt = `
      Analyze this lead for conversion probability (0-100):
      Lead: ${JSON.stringify(lead)}
      
      Return JSON only: { "score": number, "priority": "Low|Medium|High|Urgent", "reasoning": "string", "nextAction": "string" }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);

    await prisma.lead.update({
      where: { id: leadId },
      data: { score: result.score }
    });

    return result;
  } catch (error) {
    console.error("AI Scoring Error:", error);
    return null;
  }
};

/**
 * CALL TRANSCRIPTION ANALYSIS
 */
const analyzeCall = async (callId, transcript) => {
  try {
    const prompt = `
      Analyze this sales call transcript:
      "${transcript}"
      
      Return JSON: { "sentiment": "Positive|Negative|Neutral", "objections": [], "summary": "string", "rating": 1-5 }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("AI Call Analysis Error:", error);
    return null;
  }
};

module.exports = {
  chatWithCRM,
  scoreLead,
  analyzeCall
};
