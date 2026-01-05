import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { TaskType } from '@google/generative-ai';
import { config } from '../config/index.js';

class EmbeddingService {
  constructor() {
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: config.geminiApiKey,
      model: config.embedding.model,
    });
  }

  async embedDocument(text, title = '') {
    const embeddingsWithDocTask = new GoogleGenerativeAIEmbeddings({
      apiKey: config.geminiApiKey,
      model: config.embedding.model,
      taskType: TaskType.RETRIEVAL_DOCUMENT,
      title: title,
    });

    const vector = await embeddingsWithDocTask.embedQuery(text);
    return vector;
  }

  async embedQuery(query) {
    const embeddingsWithQueryTask = new GoogleGenerativeAIEmbeddings({
      apiKey: config.geminiApiKey,
      model: config.embedding.model,
      taskType: TaskType.RETRIEVAL_QUERY,
    });

    const vector = await embeddingsWithQueryTask.embedQuery(query);
    return vector;
  }

  async embedDocuments(texts) {
    const vectors = await this.embeddings.embedDocuments(texts);
    return vectors;
  }
}

export const embeddingService = new EmbeddingService();
