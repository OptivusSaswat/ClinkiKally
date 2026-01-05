import { createLLM } from './baseAgent.js';
import { vectorSearchService } from '../services/vectorSearchService.js';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

const SYSTEM_PROMPT = `You are a Skincare & Haircare Expert for Clinikally, an online dermatology and skincare platform.

Your role is to provide helpful, educational information about skincare and haircare based on the blog content provided to you.

Guidelines:
1. Only use information from the provided blog content - don't make up facts
2. Provide clear, actionable advice
3. Explain the science/reasoning behind recommendations when available
4. Be empathetic and understanding of skin/hair concerns
5. Always recommend consulting a dermatologist for serious or persistent issues
6. Cite the source blog when providing specific information
7. If the provided content doesn't fully answer the question, be honest about limitations

Format your response:
- Start with a direct answer to the user's question
- Provide supporting details and explanations
- Include practical tips when relevant
- Mention if professional consultation is recommended`;

class BlogSolutionFinderAgent {
  constructor() {
    this.llm = createLLM({ temperature: 0.4 });
  }

  async process(query, extractedIntent) {
    try {
      // Perform RAG - search for relevant blog content
      const relevantBlogs = await vectorSearchService.searchBlogs(
        extractedIntent || query,
        8
      );

      if (!relevantBlogs || relevantBlogs.length === 0) {
        return {
          success: false,
          context: [],
          response: 'I could not find relevant information in our knowledge base for your query.',
        };
      }

      // Format context from retrieved blogs
      const context = relevantBlogs.map((blog, index) => ({
        rank: index + 1,
        content: blog.content,
        blogTitle: blog.blogTitle,
        author: blog.author,
        tags: blog.tags,
        sourceLink: blog.sourceLink,
        similarity: blog.similarity,
      }));

      const contextText = context
        .map(b => `[Source ${b.rank}: "${b.blogTitle}" by ${b.author}]
${b.content}
Tags: ${b.tags?.join(', ') || 'N/A'}
Similarity Score: ${parseFloat(b.similarity).toFixed(3)}`)
        .join('\n\n---\n\n');

      // Generate response using LLM with context
      const messages = [
        new SystemMessage(SYSTEM_PROMPT),
        new HumanMessage(`User Query: ${query}

Relevant Blog Content from Knowledge Base:
${contextText}

Based on the above information, provide a helpful and informative response to the user's query.`),
      ];

      const response = await this.llm.invoke(messages);

      return {
        success: true,
        context: context,
        response: response.content,
        retrievedCount: relevantBlogs.length,
      };
    } catch (error) {
      console.error('Blog solution finder error:', error);
      return {
        success: false,
        context: [],
        response: 'An error occurred while searching for information.',
        error: error.message,
      };
    }
  }
}

export const blogSolutionFinderAgent = new BlogSolutionFinderAgent();
