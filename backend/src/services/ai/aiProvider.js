const gemini = require('./gemini.service');
const openai = require('./openai.service');
const prisma = require('../../config/prisma');

/**
 * AI PROVIDER FACTORY
 * Tenant-aware routing to the configured AI provider.
 */
class AIProvider {
  /**
   * Dynamic Service Resolution
   */
  async getService(organizationId = null) {
    if (organizationId) {
      try {
        const providerSetting = await prisma.organizationSetting.findUnique({
          where: { organizationId_key: { organizationId, key: 'AI_PROVIDER' } }
        });
        if (providerSetting?.value === 'openai') {
          return openai;
        }
      } catch (e) {
        // Fall back to default
      }
    }
    return gemini;
  }

  /**
   * Universal Chat Method — passes organizationId for tenant-aware key resolution
   */
  async chat(systemPrompt, userMessage, history = [], organizationId = null) {
    const service = await this.getService(organizationId);
    return service.chat(systemPrompt, userMessage, history, organizationId);
  }

  /**
   * Universal JSON Generation Method — passes organizationId for tenant-aware key resolution
   */
  async generateJSON(prompt, organizationId = null) {
    const service = await this.getService(organizationId);
    return service.generateJSON(prompt, organizationId);
  }
}

module.exports = new AIProvider();
