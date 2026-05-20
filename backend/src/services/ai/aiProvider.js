const gemini = require('./gemini.service');

/**
 * AI PROVIDER FACTORY
 * Tenant-aware routing to the configured AI provider.
 */
class AIProvider {
  constructor() {
    this.providerType = 'gemini';
  }

  getService() {
    return gemini;
  }

  /**
   * Universal Chat Method — passes organizationId for tenant-aware key resolution
   */
  async chat(systemPrompt, userMessage, history = [], organizationId = null) {
    return gemini.chat(systemPrompt, userMessage, history, organizationId);
  }

  /**
   * Universal JSON Generation Method — passes organizationId for tenant-aware key resolution
   */
  async generateJSON(prompt, organizationId = null) {
    return gemini.generateJSON(prompt, organizationId);
  }
}

module.exports = new AIProvider();
