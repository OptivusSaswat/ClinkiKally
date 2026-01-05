import 'dotenv/config';
import { prisma } from '../config/database.js';
import { loadBlogDocuments } from '../utils/loaders/blogLoader.js';
import { chunkDocuments } from '../utils/chunking.js';
import { embeddingService } from '../services/embeddingService.js';

const BATCH_SIZE = 10;

async function ingestBlogs() {
  console.log('Starting blog ingestion...');

  try {
    console.log('Loading blog documents...');
    const documents = loadBlogDocuments();
    console.log(`Loaded ${documents.length} blogs`);

    console.log('Chunking documents...');
    const chunkedDocs = await chunkDocuments(documents);
    console.log(`Created ${chunkedDocs.length} chunks`);

    console.log('Clearing existing blog embeddings...');
    await prisma.$executeRaw`TRUNCATE TABLE blog_embeddings`;

    console.log('Generating embeddings and storing...');
    for (let i = 0; i < chunkedDocs.length; i += BATCH_SIZE) {
      const batch = chunkedDocs.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(chunkedDocs.length / BATCH_SIZE);

      console.log(`Processing batch ${batchNumber}/${totalBatches}...`);

      const texts = batch.map(doc => doc.content);
      const embeddings = await embeddingService.embedDocuments(texts);

      for (let j = 0; j < batch.length; j++) {
        const doc = batch[j];
        const embedding = embeddings[j];
        const vectorString = `[${embedding.join(',')}]`;

        await prisma.$executeRaw`
          INSERT INTO blog_embeddings (id, content, embedding, metadata, "blogTitle", author, tags, "sourceLink", "blogFolder", "createdAt", "updatedAt")
          VALUES (
            ${crypto.randomUUID()},
            ${doc.content},
            ${vectorString}::vector,
            ${JSON.stringify(doc.metadata)}::jsonb,
            ${doc.metadata.blogTitle || null},
            ${doc.metadata.author || null},
            ${doc.metadata.tags || []},
            ${doc.metadata.sourceLink || null},
            ${doc.metadata.blogFolder || null},
            NOW(),
            NOW()
          )
        `;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('Blog ingestion completed successfully!');
  } catch (error) {
    console.error('Error during blog ingestion:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

ingestBlogs();
