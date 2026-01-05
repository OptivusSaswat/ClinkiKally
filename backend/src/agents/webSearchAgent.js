import Exa from 'exa-js';
import { createLLM } from './baseAgent.js';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { config } from '../config/index.js';

const SYSTEM_PROMPT = `You are a helpful assistant for Clinikally, a skincare and haircare platform.

The user has asked a question that is outside our core expertise of skincare and haircare.
You have been provided with web search results to help answer their question.

Guidelines:
1. Use the search results to provide an accurate, helpful answer
2. Be concise but informative
3. Cite sources when providing specific facts
4. If the search results don't fully answer the question, acknowledge this
5. Gently remind the user that Clinikally specializes in skincare and haircare if relevant
6. Be friendly and helpful even for off-topic questions`;

class WebSearchAgent {
  constructor() {
    this.exa = new Exa(config.exaApiKey);
    this.llm = createLLM({ temperature: 0.5 });
  }

  async process(query, extractedIntent) {
    try {
      // Perform web search using Exa
      const searchQuery = extractedIntent || query;

      const searchResults = await this.exa.searchAndContents(searchQuery, {
        type: 'auto',
        numResults: 5,
        text: {
          maxCharacters: 1000,
        },
        highlights: {
          numSentences: 3,
        },
      });

      if (!searchResults.results || searchResults.results.length === 0) {
        return {
          success: false,
          context: [],
          response: 'I could not find relevant information for your query on the web.',
        };
      }

      // Format context from search results
      const context = searchResults.results.map((result, index) => ({
        rank: index + 1,
        title: result.title,
        url: result.url,
        text: result.text,
        highlights: result.highlights,
        publishedDate: result.publishedDate,
      }));

      const contextText = context
        .map(r => `[Source ${r.rank}: "${r.title}"]
URL: ${r.url}
${r.highlights ? `Key Points: ${r.highlights.join(' ')}` : ''}
Content: ${r.text?.substring(0, 500) || 'No content available'}...`)
        .join('\n\n---\n\n');

      // Generate response using LLM with context
      const messages = [
        new SystemMessage(SYSTEM_PROMPT),
        new HumanMessage(`User Query: ${query}

Web Search Results:
${contextText}

Based on the above search results, provide a helpful response to the user's query.`),
      ];

      const response = await this.llm.invoke(messages);

      return {
        success: true,
        context: context,
        response: response.content,
        retrievedCount: searchResults.results.length,
        sources: context.map(c => ({ title: c.title, url: c.url })),
      };
    } catch (error) {
      console.error('Web search agent error:', error);

      // Check if it's an API key error
      if (error.message?.includes('API key') || error.message?.includes('unauthorized')) {
        return {
          success: false,
          context: [],
          response: 'Web search is currently unavailable. Please try again later or ask a skincare/haircare related question.',
          error: 'API configuration error',
        };
      }

      return {
        success: false,
        context: [],
        response: 'An error occurred while searching the web. Please try again.',
        error: error.message,
      };
    }
  }
}

export const webSearchAgent = new WebSearchAgent();
