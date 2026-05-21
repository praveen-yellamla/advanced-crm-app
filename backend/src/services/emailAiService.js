const geminiService = require('./ai/gemini.service');

/**
 * AI Email Assistant Service
 * Uses Google Gemini 2.0 Flash to analyze, summarize, and draft emails.
 */
class EmailAiService {
  /**
   * Analyze an incoming email message
   * Returns: { sentiment, urgency, isSpam, spamReason, summary, replySuggestions, nextAction }
   */
  async analyzeIncomingEmail(subject, content, organizationId = null) {
    const prompt = `
You are an expert CRM AI communication assistant. Analyze the following incoming email and classify its attributes.
Email Subject: "${subject}"
Email Content:
"""
${content}
"""

You MUST respond with a valid, parseable JSON object matching this exact structure:
{
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "urgency": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "isSpam": true | false,
  "spamReason": "string describing spam indicators, or empty string",
  "summary": "a concise 1-2 sentence executive summary of the email",
  "replySuggestions": ["pill 1: short reply suggestion", "pill 2: alternative response", "pill 3: another option"],
  "nextAction": "recommended next step for the CRM agent (e.g., 'Schedule a follow-up call', 'Prepare proposal documents', 'Confirm meeting availability')"
}

Rules:
1. "replySuggestions" MUST contain exactly 3 concise, context-aware suggestions (under 80 characters each).
2. Your response must be ONLY the JSON object, with no markdown formatting around it.
`;

    try {
      const result = await geminiService.generateJSON(prompt, organizationId);
      
      // Fallback in case structure is partially missing
      return {
        sentiment: result.sentiment || 'NEUTRAL',
        urgency: result.urgency || 'LOW',
        isSpam: typeof result.isSpam === 'boolean' ? result.isSpam : false,
        spamReason: result.spamReason || '',
        summary: result.summary || 'Incoming email received.',
        replySuggestions: Array.isArray(result.replySuggestions) ? result.replySuggestions : [
          'Reply to confirm receipt',
          'Offer to schedule a brief call',
          'Send product brochure'
        ],
        nextAction: result.nextAction || 'Review email and reply.'
      };
    } catch (error) {
      console.error('[EMAIL AI SERVICE] Error analyzing email:', error);
      return {
        sentiment: 'NEUTRAL',
        urgency: 'LOW',
        isSpam: false,
        spamReason: '',
        summary: 'Failed to generate AI summary.',
        replySuggestions: [
          'Thanks for your email.',
          'Let me look into this and get back to you.',
          'Could we schedule a call to discuss?'
        ],
        nextAction: 'Review email manually.'
      };
    }
  }

  /**
   * Summarize a threaded email conversation
   */
  async summarizeThread(messages, organizationId = null) {
    if (!messages || messages.length === 0) return 'No messages in thread.';

    const formattedMessages = messages
      .map(m => `From: ${m.from}\nTo: ${m.to}\nSubject: ${m.subject}\nDate: ${m.createdAt}\nContent:\n${m.content}\n---`)
      .join('\n');

    const prompt = `
You are an expert CRM communication analyst. Summarize the following threaded conversation history into a concise 2-3 sentence executive summary detailing the current status and key resolution point.

Thread History:
${formattedMessages}

Response format: Return ONLY the summary text. No preamble, no markdown formatting.
`;

    try {
      // Use chat helper to retrieve text response
      const response = await geminiService.chat(
        'You are a professional CRM assistant.',
        prompt,
        [],
        organizationId
      );
      return response.content || 'Failed to summarize conversation.';
    } catch (error) {
      console.error('[EMAIL AI SERVICE] Error summarizing thread:', error);
      return 'Summary temporarily unavailable.';
    }
  }

  /**
   * Generate or refine draft response
   */
  async generateAIAssistResponse({ promptText, replyToContent = '', tone = 'Professional', actionType = 'reply', organizationId = null }) {
    let contextPrompt = '';
    
    if (actionType === 'reply') {
      contextPrompt = `You are replying to the following email:
"""
${replyToContent}
"""
Based on the reply instructions/prompt: "${promptText}".`;
    } else {
      contextPrompt = `Write an email draft based on the prompt/request: "${promptText}".`;
    }

    const systemPrompt = `You are a premium CRM email assistant helping an agent write an email. 
Your goal is to write a highly polished, professional email draft. 
Tone requirements: ${tone} (Options: Professional, Casual, Persuasive, Bold).
Keep it clean, concise, with placeholders [Name], [Company], etc. where appropriate.
Return ONLY the email body. Do not include subject line, headers, signatures, or meta-commentary. Use HTML line breaks (<br/>) or double newlines for spacing.`;

    try {
      const response = await geminiService.chat(systemPrompt, contextPrompt, [], organizationId);
      return response.content || '';
    } catch (error) {
      console.error('[EMAIL AI SERVICE] Error in AI Assist:', error);
      throw new Error('AI Assist generation failed: ' + error.message);
    }
  }
}

module.exports = new EmailAiService();
