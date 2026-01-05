import { createLLM } from './baseAgent.js';
import { vectorSearchService } from '../services/vectorSearchService.js';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

const SYSTEM_PROMPT = `You are a Product Recommendation Specialist for Clinikally, an online dermatology and skincare platform.

Your role is to recommend suitable skincare and haircare products based on user needs and the product information provided to you.

Guidelines:
1. Only recommend products from the context provided - never make up product names
2. Explain WHY each product is suitable for the user's needs
3. Consider the user's specific concerns (skin type, conditions, goals)
4. Mention key ingredients and their benefits when relevant
5. If multiple products are suitable, rank them by relevance
6. Be honest if the available products don't perfectly match the user's needs
7. Always encourage consulting a dermatologist for serious concerns

Format your recommendations clearly with:
- Product name and brand (if available)
- Why it's recommended
- Key benefits/ingredients
- Any usage tips`;

class ProductRecommenderAgent {
  constructor() {
    this.llm = createLLM({ temperature: 0.3 });
  }

  async process(query, extractedIntent) {
    try {
      const relevantProducts = await vectorSearchService.searchProducts(
        extractedIntent || query,
        10
      );

      if (!relevantProducts || relevantProducts.length === 0) {
        return {
          success: false,
          context: [],
          response: 'I could not find any products matching your requirements in our database.',
        };
      }

      const context = relevantProducts.map((product, index) => ({
        rank: index + 1,
        content: product.content,
        productName: product.productName,
        brand: product.brand,
        category: product.category,
        similarity: product.similarity,
      }));

      const contextText = context
        .map(p => `[Product ${p.rank}]\n${p.content}\nSimilarity Score: ${parseFloat(p.similarity).toFixed(3)}`)
        .join('\n\n---\n\n');

      const messages = [
        new SystemMessage(SYSTEM_PROMPT),
        new HumanMessage(`User Query: ${query}

Relevant Products from Database:
${contextText}

Based on the above product information, provide personalized recommendations for the user's query.`),
      ];

      const response = await this.llm.invoke(messages);

      return {
        success: true,
        context: context,
        response: response.content,
        retrievedCount: relevantProducts.length,
      };
    } catch (error) {
      console.error('Product recommender error:', error);
      return {
        success: false,
        context: [],
        response: 'An error occurred while searching for product recommendations.',
        error: error.message,
      };
    }
  }
}

export const productRecommenderAgent = new ProductRecommenderAgent();
