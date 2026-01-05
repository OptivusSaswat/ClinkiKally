import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { config } from '../config/index.js';

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: config.chunking.chunkSize,
  chunkOverlap: config.chunking.chunkOverlap,
  separators: ['\n\n', '\n', '. ', ' ', ''],
});

export async function chunkText(text) {
  const chunks = await textSplitter.splitText(text);
  return chunks;
}

export async function chunkDocuments(documents) {
  const chunkedDocs = [];

  for (const doc of documents) {
    const chunks = await chunkText(doc.content);
    chunks.forEach((chunk, index) => {
      chunkedDocs.push({
        content: chunk,
        metadata: {
          ...doc.metadata,
          chunkIndex: index,
          totalChunks: chunks.length,
        },
      });
    });
  }

  return chunkedDocs;
}
