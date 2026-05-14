const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * GOOGLE GEMINI AI SERVICE
 * Optimized for CRM context and strategic intelligence.
 */
class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-flash-latest" });
  }

  /**
   * Conversational Chat with Memory
   */
  async chat(systemPrompt, userMessage, history = []) {
    try {
      const chat = this.model.startChat({
        history: history.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        },
      });

      const result = await chat.sendMessage(`${systemPrompt}\n\nUser Question: ${userMessage}`);
      const response = await result.response;
      return {
        content: response.text(),
        tokens: 500, // Gemini estimate
        provider: 'GEMINI'
      };
    } catch (error) {
      console.error("[GEMINI SERVICE ERROR]:", error);
      throw error;
    }
  }

  /**
   * Structured Content Generation (JSON)
   */
  async generateJSON(prompt) {
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Attempt to parse JSON from Markdown blocks if necessary
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch (error) {
      console.error("[GEMINI JSON ERROR]:", error);
      return null;
    }
  }
}

module.exports = new GeminiService();
