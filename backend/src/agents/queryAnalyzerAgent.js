import { createLLM, AgentType } from './baseAgent.js';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

const SYSTEM_PROMPT = `You are a query analyzer for a skincare and haircare platform called Clinikally.

Your job is to analyze user queries and determine which specialized agent should handle them.

There are THREE specialized agents:

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

3. WEB_SEARCH - Use this when the user:
   - Asks about topics NOT related to skincare, haircare, or dermatology
   - Asks general knowledge questions
   - Asks about current events, news, or general information
   - Asks about topics outside our expertise (e.g., technology, sports, cooking, etc.)
   - The query doesn't fit into product recommendations or skincare/haircare advice

IMPORTANT: Only use WEB_SEARCH when the query is clearly unrelated to skincare/haircare. If there's any connection to skin, hair, beauty, or wellness, prefer the other agents.

Respond with ONLY a JSON object in this exact format:
{
  "agentType": "product_recommender" | "blog_solution_finder" | "web_search",
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

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return this.getDefaultAnalysis(query);
      }

      const analysis = JSON.parse(jsonMatch[0]);

      let agentType;
      switch (analysis.agentType) {
        case 'product_recommender':
          agentType = AgentType.PRODUCT_RECOMMENDER;
          break;
        case 'blog_solution_finder':
          agentType = AgentType.BLOG_SOLUTION_FINDER;
          break;
        case 'web_search':
          agentType = AgentType.WEB_SEARCH;
          break;
        default:
          agentType = AgentType.BLOG_SOLUTION_FINDER;
      }

      return {
        agentType,
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
    const lowerQuery = query.toLowerCase();

    const skincareKeywords = ['skin', 'face', 'acne', 'pimple', 'wrinkle', 'moistur', 'sunscreen', 'glow', 'dark spot', 'pigment', 'oily', 'dry skin', 'sensitive skin', 'rash', 'eczema', 'dermat'];
    const haircareKeywords = ['hair', 'scalp', 'dandruff', 'hairfall', 'hair fall', 'shampoo', 'conditioner', 'frizz', 'bald', 'grey hair', 'hair growth'];
    const productKeywords = ['recommend', 'product', 'buy', 'best', 'suggest', 'which', 'brand', 'cream', 'serum', 'lotion', 'gel', 'oil'];

    const isSkincareRelated = skincareKeywords.some(k => lowerQuery.includes(k));
    const isHaircareRelated = haircareKeywords.some(k => lowerQuery.includes(k));
    const hasProductKeywords = productKeywords.some(k => lowerQuery.includes(k));

    if (isSkincareRelated || isHaircareRelated) {
      if (hasProductKeywords) {
        return {
          agentType: AgentType.PRODUCT_RECOMMENDER,
          confidence: 0.7,
          reasoning: 'Keyword-based: skincare/haircare product query',
          extractedIntent: query,
        };
      }
      return {
        agentType: AgentType.BLOG_SOLUTION_FINDER,
        confidence: 0.7,
        reasoning: 'Keyword-based: skincare/haircare advice query',
        extractedIntent: query,
      };
    }

    return {
      agentType: AgentType.WEB_SEARCH,
      confidence: 0.5,
      reasoning: 'Query does not appear related to skincare/haircare',
      extractedIntent: query,
    };
  }
}

export const queryAnalyzerAgent = new QueryAnalyzerAgent();
