import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { config } from '../config/index.js';

export function createLLM(options = {}) {
  return new ChatGoogleGenerativeAI({
    apiKey: config.geminiApiKey,
    model: options.model || 'gemini-2.0-flash',
    temperature: options.temperature ?? 0.7,
    maxOutputTokens: options.maxOutputTokens || 2048,
  });
}

export const AgentType = {
  PRODUCT_RECOMMENDER: 'product_recommender',
  BLOG_SOLUTION_FINDER: 'blog_solution_finder',
  GENERAL: 'general',
};
