import { createLLM } from './baseAgent.js';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

const SYSTEM_PROMPT = `You are a friendly and knowledgeable customer service representative for Clinikally, an online dermatology and skincare platform.

Your role is to take the information gathered by our specialist agents and present it in a conversational, helpful manner to the user.

Guidelines:
1. Be warm, friendly, and professional
2. Present information clearly and concisely
3. Use simple language - avoid medical jargon unless necessary
4. Structure long responses with bullet points or numbered lists
5. Always end with an invitation for follow-up questions
6. Remind users to consult dermatologists for serious concerns
7. If the specialist couldn't find good information, be honest and helpful

Tone: Friendly, knowledgeable, caring, professional`;

class QnAAgent {
  constructor() {
    this.llm = createLLM({ temperature: 0.6 });
  }

  async generateResponse(query, specialistResponse, agentType, conversationHistory = []) {
    try {
      // Build conversation context
      const historyText = conversationHistory.length > 0
        ? conversationHistory
            .slice(-5) // Keep last 5 exchanges
            .map(h => `User: ${h.user}\nAssistant: ${h.assistant}`)
            .join('\n\n')
        : 'No previous conversation.';

      const agentTypeLabel = agentType === 'product_recommender'
        ? 'Product Recommendation Specialist'
        : 'Skincare & Haircare Expert';

      const messages = [
        new SystemMessage(SYSTEM_PROMPT),
        new HumanMessage(`Previous Conversation:
${historyText}

Current User Query: ${query}

Information from ${agentTypeLabel}:
${specialistResponse.response}

Retrieved ${specialistResponse.retrievedCount || 0} relevant items from our knowledge base.

Please provide a conversational response to the user based on the above information. Make it engaging and helpful.`),
      ];

      const response = await this.llm.invoke(messages);

      return {
        success: true,
        response: response.content,
        metadata: {
          agentUsed: agentType,
          sourcesCount: specialistResponse.retrievedCount || 0,
        },
      };
    } catch (error) {
      console.error('QnA agent error:', error);
      return {
        success: false,
        response: "I apologize, but I'm having trouble generating a response right now. Please try again or contact our support team for assistance.",
        error: error.message,
      };
    }
  }

  async handleFailedRetrieval(query, agentType) {
    const messages = [
      new SystemMessage(SYSTEM_PROMPT),
      new HumanMessage(`The user asked: "${query}"

Unfortunately, our ${agentType === 'product_recommender' ? 'product database' : 'knowledge base'} didn't have relevant information for this query.

Please provide a helpful response that:
1. Acknowledges we couldn't find specific information
2. Offers general guidance if possible
3. Suggests they might want to consult with a dermatologist
4. Invites them to ask other questions or rephrase their query`),
    ];

    try {
      const response = await this.llm.invoke(messages);
      return {
        success: true,
        response: response.content,
        metadata: {
          agentUsed: agentType,
          sourcesCount: 0,
          fallback: true,
        },
      };
    } catch (error) {
      return {
        success: false,
        response: "I couldn't find specific information for your query. Please try rephrasing or consult with a dermatologist for personalized advice.",
        error: error.message,
      };
    }
  }
}

export const qnaAgent = new QnAAgent();
