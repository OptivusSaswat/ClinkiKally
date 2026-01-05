import 'dotenv/config';
import { prisma } from '../config/database.js';
import { loadProductDatabase } from '../utils/loaders/productLoader.js';
import { chunkDocuments } from '../utils/chunking.js';
import { embeddingService } from '../services/embeddingService.js';

const BATCH_SIZE = 10;

async function ingestProducts() {
  console.log('Starting product ingestion...');

  try {
    // Load product documents from xlsx
    console.log('Loading product database...');
    const documents = loadProductDatabase();
    console.log(`Loaded ${documents.length} products`);

    // Chunk documents
    console.log('Chunking documents...');
    const chunkedDocs = await chunkDocuments(documents);
    console.log(`Created ${chunkedDocs.length} chunks`);

    // Clear existing product embeddings
    console.log('Clearing existing product embeddings...');
    await prisma.$executeRaw`TRUNCATE TABLE product_embeddings`;

    // Process in batches
    console.log('Generating embeddings and storing...');
    for (let i = 0; i < chunkedDocs.length; i += BATCH_SIZE) {
      const batch = chunkedDocs.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(chunkedDocs.length / BATCH_SIZE);

      console.log(`Processing batch ${batchNumber}/${totalBatches}...`);

      // Generate embeddings for batch
      const texts = batch.map(doc => doc.content);
      const embeddings = await embeddingService.embedDocuments(texts);

      // Insert into database
      for (let j = 0; j < batch.length; j++) {
        const doc = batch[j];
        const embedding = embeddings[j];
        const vectorString = `[${embedding.join(',')}]`;

        await prisma.$executeRaw`
          INSERT INTO product_embeddings (id, content, embedding, metadata, "productName", brand, category, concerns, "createdAt", "updatedAt")
          VALUES (
            ${crypto.randomUUID()},
            ${doc.content},
            ${vectorString}::vector,
            ${JSON.stringify(doc.metadata)}::jsonb,
            ${doc.metadata.productName || null},
            ${doc.metadata.brand || null},
            ${doc.metadata.category || null},
            ${doc.metadata.concerns || []},
            NOW(),
            NOW()
          )
        `;
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('Product ingestion completed successfully!');
  } catch (error) {
    console.error('Error during product ingestion:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

ingestProducts();
