import 'dotenv/config';

export const config = {
  port: process.env.PORT || 3000,
  databaseUrl: process.env.DATABASE_URL,
  geminiApiKey: process.env.GEMINI_API_KEY,

  // Embedding configuration
  embedding: {
    model: 'gemini-embedding-001',
    dimensions: 3072,
  },

  // Chunking configuration
  chunking: {
    chunkSize: 1000,
    chunkOverlap: 200,
  },

  // Knowledge base paths
  knowledgeBase: {
    productDatabase: './knowledge base/DermaGPT Product Database.xlsx',
    blogFolder: './knowledge base/Skin _ Hair Care Guide',
  },
};
