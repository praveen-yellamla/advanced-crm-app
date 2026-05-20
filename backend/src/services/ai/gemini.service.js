const { GoogleGenerativeAI } = require('@google/generative-ai');
const { decrypt } = require('../../utils/encryption');

/**
 * GOOGLE GEMINI AI SERVICE
 * Tenant-aware: loads API key dynamically from OrganizationSetting DB.
 * Falls back to GEMINI_API_KEY env var for backward compatibility.
 */
class GeminiService {
  constructor() {
    // Initialize with a placeholder — real key loaded dynamically per-request
    this._initialized = false;
  }

  /**
   * Resolve API key for a given organization.
   * Priority: org DB setting > env var
   */
  async resolveKey(organizationId) {
    // Try org-specific key from DB first
    if (organizationId) {
      try {
        const prisma = require('../../config/prisma');
        const keySetting = await prisma.organizationSetting.findUnique({
          where: { organizationId_key: { organizationId, key: 'AI_GEMINI_API_KEY' } }
        });
        if (keySetting?.value) {
          return decrypt(keySetting.value);
        }
      } catch (e) {
        // DB not available, fall through
      }
    }

    // Fall back to environment variable
    const envKey = process.env.GEMINI_API_KEY;
    if (envKey && envKey !== 'undefined' && !envKey.includes('YOUR_')) {
      return envKey;
    }

    return null;
  }

  /**
   * Build a model instance with the given API key
   */
  buildModel(apiKey) {
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }

  /**
   * Conversational Chat with Memory — Tenant-Aware
   */
  async chat(systemPrompt, userMessage, history = [], organizationId = null) {
    const key = await this.resolveKey(organizationId);

    if (!key) {
      console.warn('[GEMINI SERVICE] No API key configured — running in simulation mode.');
      return this._simulateChat(userMessage);
    }

    try {
      const model = this.buildModel(key);
      const chat = model.startChat({
        history: history.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.7,
        },
      });

      const result = await chat.sendMessage(`${systemPrompt}\n\nUser Question: ${userMessage}`);
      const response = await result.response;
      return {
        content: response.text(),
        tokens: response.usageMetadata?.totalTokenCount || 500,
        provider: 'GEMINI',
        simulation: false
      };
    } catch (error) {
      console.error('[GEMINI SERVICE ERROR]:', error.message);
      throw error;
    }
  }

  /**
   * Structured Content Generation (JSON) — Tenant-Aware
   */
  async generateJSON(prompt, organizationId = null) {
    const key = await this.resolveKey(organizationId);

    if (!key) {
      return this._simulateJSON(prompt);
    }

    try {
      const model = this.buildModel(key);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch (error) {
      console.error('[GEMINI JSON ERROR]:', error.message);
      throw error;
    }
  }

  /**
   * Validate API key by making a real call
   */
  async validateKey(apiKey) {
    try {
      const model = this.buildModel(apiKey);
      await model.generateContent('ping');
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  // =============================================
  // SIMULATION FALLBACKS (when no key configured)
  // =============================================
  _simulateChat(userMessage) {
    const msg = userMessage.toLowerCase();
    let content;

    if (msg.includes('score') || msg.includes('probability')) {
      content = '### AI Conversion Prediction\n\n- **Score:** 88/100\n- **Priority:** High\n- **Next Action:** Dispatch proposal deck via email.\n\n> *Simulation mode — configure your Gemini API key to enable real AI.*';
    } else if (msg.includes('lead') || msg.includes('summary')) {
      content = '### Lead Executive Summary\n\nThis prospect shows high interest in service scalability. Recommend highlighting Enterprise security features.\n\n> *Simulation mode — configure your Gemini API key to enable real AI.*';
    } else {
      content = '### CRM Intelligence (Simulation)\n\n**Workspace Status:** Healthy\n**Recommended Action:** 3 hot opportunities in pipeline — schedule immediate follow-ups.\n\n> *Configure your Gemini API key in AI Settings to enable real-time intelligence.*';
    }

    return { content, tokens: 150, provider: 'SIMULATION', simulation: true };
  }

  _simulateJSON(prompt) {
    const p = prompt.toLowerCase();
    if (p.includes('score') || p.includes('priority')) {
      return { score: 85, priority: 'High', reasoning: 'Simulation mode', nextAction: 'Propose contract' };
    }
    if (p.includes('sentiment') || p.includes('transcript')) {
      return { sentiment: 'Positive', objections: ['pricing'], summary: 'Simulation mode', rating: 4 };
    }
    return { status: 'SIMULATED', message: 'Configure Gemini API key for real intelligence.' };
  }
}

module.exports = new GeminiService();
