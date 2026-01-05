import { prisma } from '../config/database.js';
import { embeddingService } from './embeddingService.js';

// Minimum similarity threshold for relevant results
const SIMILARITY_THRESHOLD = 0.5;

class VectorSearchService {
  async searchProducts(query, limit = 5, threshold = SIMILARITY_THRESHOLD) {
    const queryEmbedding = await embeddingService.embedQuery(query);
    const vectorString = `[${queryEmbedding.join(',')}]`;

    const results = await prisma.$queryRaw`
      SELECT
        id,
        content,
        metadata,
        "productName",
        brand,
        category,
        concerns,
        1 - (embedding <=> ${vectorString}::vector) as similarity
      FROM product_embeddings
      WHERE 1 - (embedding <=> ${vectorString}::vector) > ${threshold}
      ORDER BY similarity DESC
      LIMIT ${limit}
    `;

    return results;
  }

  async searchBlogs(query, limit = 5, threshold = SIMILARITY_THRESHOLD) {
    const queryEmbedding = await embeddingService.embedQuery(query);
    const vectorString = `[${queryEmbedding.join(',')}]`;

    const results = await prisma.$queryRaw`
      SELECT
        id,
        content,
        metadata,
        "blogTitle",
        author,
        tags,
        "sourceLink",
        "blogFolder",
        1 - (embedding <=> ${vectorString}::vector) as similarity
      FROM blog_embeddings
      WHERE 1 - (embedding <=> ${vectorString}::vector) > ${threshold}
      ORDER BY similarity DESC
      LIMIT ${limit}
    `;

    return results;
  }

  async searchProductsWithFilter(query, filters = {}, limit = 5, threshold = SIMILARITY_THRESHOLD) {
    const queryEmbedding = await embeddingService.embedQuery(query);
    const vectorString = `[${queryEmbedding.join(',')}]`;

    const conditions = [`1 - (embedding <=> '${vectorString}'::vector) > ${threshold}`];

    if (filters.brand) {
      conditions.push(`brand = '${filters.brand}'`);
    }
    if (filters.category) {
      conditions.push(`category = '${filters.category}'`);
    }
    if (filters.concerns && filters.concerns.length > 0) {
      conditions.push(`concerns && ARRAY[${filters.concerns.map(c => `'${c}'`).join(',')}]`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const results = await prisma.$queryRawUnsafe(`
      SELECT
        id,
        content,
        metadata,
        "productName",
        brand,
        category,
        concerns,
        1 - (embedding <=> '${vectorString}'::vector) as similarity
      FROM product_embeddings
      ${whereClause}
      ORDER BY similarity DESC
      LIMIT ${limit}
    `);

    return results;
  }

  async searchBlogsWithFilter(query, filters = {}, limit = 5, threshold = SIMILARITY_THRESHOLD) {
    const queryEmbedding = await embeddingService.embedQuery(query);
    const vectorString = `[${queryEmbedding.join(',')}]`;

    const conditions = [`1 - (embedding <=> '${vectorString}'::vector) > ${threshold}`];

    if (filters.author) {
      conditions.push(`author = '${filters.author}'`);
    }
    if (filters.tags && filters.tags.length > 0) {
      conditions.push(`tags && ARRAY[${filters.tags.map(t => `'${t}'`).join(',')}]`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const results = await prisma.$queryRawUnsafe(`
      SELECT
        id,
        content,
        metadata,
        "blogTitle",
        author,
        tags,
        "sourceLink",
        "blogFolder",
        1 - (embedding <=> '${vectorString}'::vector) as similarity
      FROM blog_embeddings
      ${whereClause}
      ORDER BY similarity DESC
      LIMIT ${limit}
    `);

    return results;
  }
}

export const vectorSearchService = new VectorSearchService();
