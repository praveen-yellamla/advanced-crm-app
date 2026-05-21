const { decrypt } = require('../../utils/encryption');
const axios = require('axios');

/**
 * OPENAI AI SERVICE
 * Tenant-aware: loads API key dynamically from OrganizationSetting DB.
 * Falls back to OPENAI_API_KEY env var for backward compatibility.
 */
class OpenAIService {
  /**
   * Resolve API key for a given organization.
   * Priority: org DB setting > env var
   */
  async resolveKey(organizationId) {
    if (organizationId) {
      try {
        const prisma = require('../../config/prisma');
        const keySetting = await prisma.organizationSetting.findUnique({
          where: { organizationId_key: { organizationId, key: 'AI_OPENAI_API_KEY' } }
        });
        if (keySetting?.value) {
          return decrypt(keySetting.value);
        }
      } catch (e) {
        // DB not available, fall through
      }
    }

    const envKey = process.env.OPENAI_API_KEY;
    if (envKey && envKey !== 'undefined' && !envKey.includes('YOUR_')) {
      return envKey;
    }

    return null;
  }

  /**
   * Conversational Chat with Memory — Tenant-Aware
   */
  async chat(systemPrompt, userMessage, history = [], organizationId = null) {
    const key = await this.resolveKey(organizationId);

    if (!key) {
      console.warn('[OPENAI SERVICE] No API key configured — running in Demo Mode.');
      return this._simulateChat(userMessage);
    }

    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        })),
        { role: 'user', content: userMessage }
      ];

      const res = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4o',
        messages,
        temperature: 0.7,
        max_tokens: 1024
      }, {
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        content: res.data.choices[0].message.content,
        tokens: res.data.usage?.total_tokens || 500,
        provider: 'OPENAI',
        simulation: false
      };
    } catch (error) {
      console.error('[OPENAI SERVICE ERROR]:', error.response?.data?.error?.message || error.message);
      throw new Error(error.response?.data?.error?.message || error.message);
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
      const res = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      }, {
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        }
      });

      return JSON.parse(res.data.choices[0].message.content);
    } catch (error) {
      console.error('[OPENAI JSON ERROR]:', error.response?.data?.error?.message || error.message);
      throw new Error(error.response?.data?.error?.message || error.message);
    }
  }

  // =============================================
  // SIMULATION FALLBACKS (when no key configured)
  // =============================================
  _simulateChat(userMessage) {
    const geminiService = require('./gemini.service');
    return geminiService._simulateChat(userMessage);
  }

  _simulateJSON(prompt) {
    const geminiService = require('./gemini.service');
    return geminiService._simulateJSON(prompt);
  }
}

module.exports = new OpenAIService();
