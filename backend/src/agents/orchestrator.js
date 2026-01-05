import { queryAnalyzerAgent } from './queryAnalyzerAgent.js';
import { productRecommenderAgent } from './productRecommenderAgent.js';
import { blogSolutionFinderAgent } from './blogSolutionFinderAgent.js';
import { webSearchAgent } from './webSearchAgent.js';
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
      console.log('[Orchestrator] Analyzing query...');
      const analysis = await queryAnalyzerAgent.analyze(query);
      console.log('[Orchestrator] Analysis result:', analysis);

      let specialistResponse;
      switch (analysis.agentType) {
        case AgentType.PRODUCT_RECOMMENDER:
          console.log('[Orchestrator] Routing to Product Recommender Agent');
          specialistResponse = await productRecommenderAgent.process(
            query,
            analysis.extractedIntent
          );
          break;
        case AgentType.BLOG_SOLUTION_FINDER:
          console.log('[Orchestrator] Routing to Blog Solution Finder Agent');
          specialistResponse = await blogSolutionFinderAgent.process(
            query,
            analysis.extractedIntent
          );
          break;
        case AgentType.WEB_SEARCH:
          console.log('[Orchestrator] Routing to Web Search Agent');
          specialistResponse = await webSearchAgent.process(
            query,
            analysis.extractedIntent
          );
          break;
        default:
          console.log('[Orchestrator] Defaulting to Blog Solution Finder Agent');
          specialistResponse = await blogSolutionFinderAgent.process(
            query,
            analysis.extractedIntent
          );
      }

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
        sources: this.formatSources(specialistResponse, analysis.agentType),
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

  formatSources(specialistResponse, agentType) {
    if (!specialistResponse.context || specialistResponse.context.length === 0) {
      if (specialistResponse.sources) {
        return specialistResponse.sources.slice(0, 3);
      }
      return [];
    }

    return specialistResponse.context.slice(0, 3).map(s => {
      switch (agentType) {
        case AgentType.PRODUCT_RECOMMENDER:
          return { title: s.productName || 'Product', type: 'product' };
        case AgentType.BLOG_SOLUTION_FINDER:
          return { title: s.blogTitle || 'Article', type: 'blog' };
        case AgentType.WEB_SEARCH:
          return { title: s.title || 'Web Result', url: s.url, type: 'web' };
        default:
          return { title: s.title || s.productName || s.blogTitle || 'Source', type: 'unknown' };
      }
    });
  }
}

export const orchestrator = new AgentOrchestrator();
