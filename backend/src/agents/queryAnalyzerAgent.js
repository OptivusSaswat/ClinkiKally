import { createLLM, AgentType } from './baseAgent.js';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

const SYSTEM_PROMPT = `You are a query analyzer for a skincare and haircare platform called Clinikally.

Your job is to analyze user queries and determine which specialized agent should handle them.

There are two specialized agents:
1. PRODUCT_RECOMMENDER - Use this when the user:
   - Asks for product recommendations
   - Wants to find products for specific skin/hair concerns
   - Asks about specific products, brands, or ingredients
   - Wants to compare products
   - Asks "what should I use for..." type questions

2. BLOG_SOLUTION_FINDER - Use this when the user:
   - Asks for skincare/haircare tips or advice
   - Wants to learn about skincare/haircare routines
   - Asks about causes, symptoms, or treatments of skin/hair conditions
   - Wants educational content about ingredients or techniques
   - Asks "how do I..." or "why does..." type questions about skin/hair health

Respond with ONLY a JSON object in this exact format:
{
  "agentType": "product_recommender" | "blog_solution_finder",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation",
  "extractedIntent": "what the user is looking for"
}`;

class QueryAnalyzerAgent {
  constructor() {
    this.llm = createLLM({ temperature: 0.1 });
  }

  async analyze(query) {
    try {
      const messages = [
        new SystemMessage(SYSTEM_PROMPT),
        new HumanMessage(query),
      ];

      const response = await this.llm.invoke(messages);
      const content = response.content;

      // Parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return this.getDefaultAnalysis(query);
      }

      const analysis = JSON.parse(jsonMatch[0]);

      return {
        agentType: analysis.agentType === 'product_recommender'
          ? AgentType.PRODUCT_RECOMMENDER
          : AgentType.BLOG_SOLUTION_FINDER,
        confidence: analysis.confidence || 0.5,
        reasoning: analysis.reasoning || '',
        extractedIntent: analysis.extractedIntent || query,
      };
    } catch (error) {
      console.error('Query analysis error:', error);
      return this.getDefaultAnalysis(query);
    }
  }

  getDefaultAnalysis(query) {
    // Simple keyword-based fallback
    const productKeywords = ['recommend', 'product', 'buy', 'best', 'suggest', 'which', 'brand'];
    const blogKeywords = ['how', 'why', 'what is', 'tips', 'advice', 'routine', 'cause', 'treatment'];

    const lowerQuery = query.toLowerCase();
    const hasProductKeywords = productKeywords.some(k => lowerQuery.includes(k));
    const hasBlogKeywords = blogKeywords.some(k => lowerQuery.includes(k));

    if (hasProductKeywords && !hasBlogKeywords) {
      return {
        agentType: AgentType.PRODUCT_RECOMMENDER,
        confidence: 0.6,
        reasoning: 'Keyword-based fallback detection',
        extractedIntent: query,
      };
    }

    return {
      agentType: AgentType.BLOG_SOLUTION_FINDER,
      confidence: 0.5,
      reasoning: 'Default to blog/advice content',
      extractedIntent: query,
    };
  }
}

export const queryAnalyzerAgent = new QueryAnalyzerAgent();
