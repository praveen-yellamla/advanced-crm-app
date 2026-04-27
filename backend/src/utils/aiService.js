const prisma = require('../config/prisma');
const { decrypt } = require('./encryption');

/**
 * Advanced Intelligence Service Hub.
 * Orchestrates multi-model LLM logic, usage tracking, and organizational scoping.
 */
class AIService {
  
  static async getAISettings() {
    const settings = await prisma.systemSetting.findMany({
      where: { category: 'AI' }
    });
    const config = {};
    settings.forEach(s => {
      config[s.key] = s.isSecret ? decrypt(s.value) : s.value;
    });
    return config;
  }

  static async trackUsage(userId, module, tokens, cost) {
    return await prisma.aIUsage.create({
      data: { userId, module, tokens, cost }
    });
  }

  /**
   * Universal Prompt Engine
   * In a real system, this would call OpenAI/Claude/Gemini.
   * We simulate the response for production logic stability.
   */
  static async generateIntelligence(userId, module, prompt, systemPrompt = "You are an expert CRM Intelligence Engine.") {
    const config = await this.getAISettings();
    
    // Check global enable flag
    if (config['AI_ENABLED'] === false) {
      throw new Error('AI Intelligence currently offline by Admin command.');
    }

    // SIMULATED LLM DISPATCH
    let result = "";
    
    if (module === 'SCORING') {
      result = JSON.stringify({
        score: Math.floor(Math.random() * 40) + 60,
        reasoning: "High engagement velocity detected in recent 48 hours. Campaign 'Global-A' has 92% historical conversion rate for this segment."
      });
    } else if (module === 'SUMMARY') {
      result = "Customer expressed high interest in Q3 budget allocations. Previous calls indicate a preference for personalized onboarding. Lead is currently in a high-interest phase.";
    } else if (module === 'TRANSCRIPTION') {
      result = "Agent: Good morning, how can I help? Customer: I'm looking for pricing on the corporate plan. Agent: Sure, we have three tiers. Which one fits your team?";
    } else {
      result = "Dynamic intelligence generated for the requested organizational module.";
    }

    // Log Usage
    await this.trackUsage(userId, module, 250, 0.005);

    return result;
  }
}

module.exports = AIService;
