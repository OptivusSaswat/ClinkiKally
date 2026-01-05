import { readFileSync, readdirSync, existsSync } from 'fs';
import path from 'path';
import { config } from '../../config/index.js';

export function loadBlogDocuments() {
  const blogFolderPath = path.resolve(config.knowledgeBase.blogFolder);
  const documents = [];

  if (!existsSync(blogFolderPath)) {
    console.error(`Blog folder not found: ${blogFolderPath}`);
    return documents;
  }

  const blogFolders = readdirSync(blogFolderPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  for (const folderName of blogFolders) {
    const contentPath = path.join(blogFolderPath, folderName, 'content_plain.txt');
    const metadataPath = path.join(blogFolderPath, folderName, 'metadata.json');

    if (!existsSync(contentPath)) {
      console.warn(`Content file not found: ${contentPath}`);
      continue;
    }

    try {
      const content = readFileSync(contentPath, 'utf-8');

      let metadata = {};
      if (existsSync(metadataPath)) {
        const metadataRaw = readFileSync(metadataPath, 'utf-8');
        metadata = JSON.parse(metadataRaw);
      }

      const tags = metadata.tags
        ? metadata.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : [];

      documents.push({
        content,
        metadata: {
          source: 'blog',
          blogFolder: folderName,
          blogTitle: metadata.title || folderName,
          author: metadata.author || 'Unknown',
          tags,
          sourceLink: metadata.link || null,
          createdAt: metadata.created_at || null,
          updatedAt: metadata.updated_at || null,
        },
      });
    } catch (error) {
      console.error(`Error loading blog ${folderName}:`, error.message);
    }
  }

  return documents;
}
