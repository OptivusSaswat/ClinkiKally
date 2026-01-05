import { queryAnalyzerAgent } from './queryAnalyzerAgent.js';
import { productRecommenderAgent } from './productRecommenderAgent.js';
import { blogSolutionFinderAgent } from './blogSolutionFinderAgent.js';
import { qnaAgent } from './qnaAgent.js';
import { AgentType } from './baseAgent.js';

class AgentOrchestrator {
  constructor() {
    this.conversationHistory = new Map(); // sessionId -> history[]
  }

  async processQuery(query, sessionId = 'default') {
    const startTime = Date.now();
    const history = this.conversationHistory.get(sessionId) || [];

    try {
      // Step 1: Analyze the query to determine which agent to use
      console.log('[Orchestrator] Analyzing query...');
      const analysis = await queryAnalyzerAgent.analyze(query);
      console.log('[Orchestrator] Analysis result:', analysis);

      // Step 2: Route to the appropriate specialist agent
      let specialistResponse;
      if (analysis.agentType === AgentType.PRODUCT_RECOMMENDER) {
        console.log('[Orchestrator] Routing to Product Recommender Agent');
        specialistResponse = await productRecommenderAgent.process(
          query,
          analysis.extractedIntent
        );
      } else {
        console.log('[Orchestrator] Routing to Blog Solution Finder Agent');
        specialistResponse = await blogSolutionFinderAgent.process(
          query,
          analysis.extractedIntent
        );
      }

      // Step 3: Generate final response using QnA Agent
      let finalResponse;
      if (specialistResponse.success) {
        console.log('[Orchestrator] Generating final response with QnA Agent');
        finalResponse = await qnaAgent.generateResponse(
          query,
          specialistResponse,
          analysis.agentType,
          history
        );
      } else {
        console.log('[Orchestrator] Handling failed retrieval');
        finalResponse = await qnaAgent.handleFailedRetrieval(
          query,
          analysis.agentType
        );
      }

      // Update conversation history
      this.updateHistory(sessionId, query, finalResponse.response);

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        response: finalResponse.response,
        metadata: {
          sessionId,
          processingTimeMs: processingTime,
          queryAnalysis: {
            agentType: analysis.agentType,
            confidence: analysis.confidence,
            reasoning: analysis.reasoning,
          },
          retrieval: {
            success: specialistResponse.success,
            sourcesCount: specialistResponse.retrievedCount || 0,
          },
        },
        // Optionally include sources for transparency
        sources: specialistResponse.context?.slice(0, 3).map(s => ({
          title: s.productName || s.blogTitle,
          type: analysis.agentType === AgentType.PRODUCT_RECOMMENDER ? 'product' : 'blog',
        })),
      };
    } catch (error) {
      console.error('[Orchestrator] Error:', error);
      return {
        success: false,
        response: "I apologize, but I encountered an error processing your request. Please try again.",
        error: error.message,
        metadata: {
          sessionId,
          processingTimeMs: Date.now() - startTime,
        },
      };
    }
  }

  updateHistory(sessionId, userMessage, assistantMessage) {
    const history = this.conversationHistory.get(sessionId) || [];
    history.push({
      user: userMessage,
      assistant: assistantMessage,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 10 exchanges
    if (history.length > 10) {
      history.shift();
    }

    this.conversationHistory.set(sessionId, history);
  }

  getHistory(sessionId) {
    return this.conversationHistory.get(sessionId) || [];
  }

  clearHistory(sessionId) {
    this.conversationHistory.delete(sessionId);
  }
}

export const orchestrator = new AgentOrchestrator();
