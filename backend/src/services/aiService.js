const prisma = require('../config/prisma');
const aiProvider = require('./ai/aiProvider');

/**
 * STRATEGIC CRM INTELLIGENCE SERVICE (ORCHESTRATOR)
 * Routes requests through the dynamic AI Provider and manages CRM context.
 */
class AIService {
  /**
   * CORE CONVERSATIONAL ENGINE
   */
  async chatWithCRM(userId, organizationId, message, history = []) {
    try {
      // 1. TENANT-SCOPED DATA AGGREGATION
      const [leadsCount, callsCount, tasksCount, recentLeads, performance, revenue] = await Promise.all([
        prisma.lead.count({ where: { organizationId } }),
        prisma.call.count({ where: { organizationId } }),
        prisma.task.count({ where: { organizationId } }),
        prisma.lead.findMany({ 
          where: { organizationId },
          take: 5, 
          orderBy: { createdAt: 'desc' }, 
          select: { customerName: true, status: true, source: true } 
        }),
        prisma.call.groupBy({
          by: ['status'],
          where: { organizationId },
          _count: { _all: true }
        }),
        prisma.invoice.aggregate({
          where: { organizationId },
          _sum: { amount: true }
        })
      ]);

      const crmContext = `
        CURRENT CRM SNAPSHOT (TENANT: ${organizationId}):
        - Your Total Leads: ${leadsCount}
        - Your Total Calls: ${callsCount}
        - Your Total Tasks: ${tasksCount}
        - Total CRM Revenue: ${revenue._sum.amount || 0}
        - Recent Leads: ${JSON.stringify(recentLeads)}
        - Call Status Distribution: ${JSON.stringify(performance)}
        - System Date: ${new Date().toISOString()}
      `;

      const systemPrompt = `
        You are "Zia", the Advanced CRM Intelligence Assistant. 
        You have access to real-time CRM data and operations for this workspace.
        Your goal is to help users manage their pipeline and analyze performance.
        
        CRITICAL INSTRUCTIONS:
        - Use the provided CRM Context to answer accurately.
        - NEVER mention other companies or data outside this context.
        - Be professional, data-driven, and concise.
        - Format responses in clean Markdown.
        
        ${crmContext}
      `;

      // 2. EXECUTION VIA PROVIDER ABSTRACTION
      const result = await aiProvider.chat(systemPrompt, message, history, organizationId);

      // 3. USAGE TRACKING
      await prisma.aIUsage.create({
        data: {
          userId,
          organizationId,
          module: 'CHAT_ASSISTANT',
          tokens: result.tokens,
          cost: (result.tokens / 1000) * 0.005 // Standard Gemini Flash pricing
        }
      });

      return result.content;
    } catch (error) {
      console.error("[AI SERVICE ERROR]:", error);
      
      // Professional Error Mapping
      if (error.message.includes('quota') || error.message.includes('429')) {
        throw new Error("AI Budget Exceeded (Quota). Please upgrade your plan or check API limits.");
      }
      if (error.message.includes('API key') || error.message.includes('invalid_api_key')) {
        throw new Error("Intelligence core configuration error (Invalid API Key). Contact administrator.");
      }
      
      throw new Error(`Intelligence core failure: ${error.message}`);
    }
  }

  /**
   * DYNAMIC LEAD SCORING
   */
  async scoreLead(leadId) {
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

      return await aiProvider.generateJSON(prompt, lead?.organizationId);
    } catch (error) {
      console.error("AI Scoring Error:", error);
      return null;
    }
  }

  /**
   * CALL TRANSCRIPTION ANALYSIS
   */
  async analyzeCall(callId, transcript) {
    try {
      const prompt = `
        Analyze this sales call transcript:
        "${transcript}"
        Return JSON: { "sentiment": "Positive|Negative|Neutral", "objections": [], "summary": "string", "rating": 1-5 }
      `;

      return await aiProvider.generateJSON(prompt);
    } catch (error) {
      console.error("AI Call Analysis Error:", error);
      return null;
    }
  }
}

module.exports = new AIService();
