const { OpenAI } = require('openai');
const prisma = require('../config/prisma');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * SCORES A LEAD BASED ON PROFILE AND HISTORY
 */
const scoreLead = async (leadId) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        calls: { take: 5, orderBy: { createdAt: 'desc' } },
        emails: { take: 5, orderBy: { createdAt: 'desc' } }
      }
    });

    if (!lead) return null;

    const prompt = `
      You are an expert sales strategist. Analyze the following lead profile and history:
      Name: ${lead.customerName}
      Source: ${lead.source}
      Status: ${lead.status}
      History: ${JSON.stringify(lead.calls.map(c => c.callStatus))}
      
      Provide a conversion probability score (0-100) and a brief strategic reasoning.
      Return JSON: { "score": number, "reasoning": "string" }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);

    // Update Lead with AI insights
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        score: result.score,
        // AI Reasoning would normally be in a separate AI table or field
      }
    });

    return result;
  } catch (error) {
    console.error("AI Scoring Error:", error);
    return null;
  }
};

/**
 * SUMMARIZES A CALL TRANSCRIPTION
 */
const summarizeCall = async (callId, transcript) => {
  try {
    const prompt = `
      Analyze this sales call transcript:
      "${transcript}"
      
      Provide:
      1. Sentiment (Positive/Negative/Neutral)
      2. Key Pain Points
      3. Action Items
      4. Summary
      
      Return JSON: { "sentiment": "string", "painPoints": [], "actionItems": [], "summary": "string" }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("AI Summarization Error:", error);
    return null;
  }
};

module.exports = {
  scoreLead,
  summarizeCall
};
