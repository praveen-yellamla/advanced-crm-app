const gemini = require('./gemini.service');

/**
 * AI PROVIDER FACTORY
 * Locked to Gemini AI for production stability.
 */
class AIProvider {
  constructor() {
    this.providerType = 'gemini'; // Force gemini
  }

  getService() {
    // Only Gemini is supported now
    return gemini;
  }

  /**
   * Universal Chat Method
   */
  async chat(systemPrompt, userMessage, history = []) {
    return gemini.chat(systemPrompt, userMessage, history);
  }

  /**
   * Universal JSON Generation Method
   */
  async generateJSON(prompt) {
    return gemini.generateJSON(prompt);
  }
}

module.exports = new AIProvider();
