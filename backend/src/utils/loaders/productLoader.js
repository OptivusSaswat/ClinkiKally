import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';
import path from 'path';
import { config } from '../../config/index.js';

export function loadProductDatabase() {
  const filePath = path.resolve(config.knowledgeBase.productDatabase);
  const fileBuffer = readFileSync(filePath);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

  const documents = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (jsonData.length === 0) continue;

    const headers = jsonData[0];
    const rows = jsonData.slice(1);

    for (const row of rows) {
      if (!row || row.length === 0) continue;

      const rowData = {};
      headers.forEach((header, index) => {
        rowData[header] = row[index] || '';
      });

      const contentParts = [];
      for (const [key, value] of Object.entries(rowData)) {
        if (value && value.toString().trim()) {
          contentParts.push(`${key}: ${value}`);
        }
      }
      const content = contentParts.join('\n');

      if (content.trim()) {
        documents.push({
          content,
          metadata: {
            source: 'product_database',
            sheet: sheetName,
            productName: rowData['Product Name'] || rowData['Name'] || rowData['product_name'] || null,
            brand: rowData['Brand'] || rowData['brand'] || null,
            category: rowData['Category'] || rowData['category'] || null,
            concerns: extractConcerns(rowData),
            rawData: rowData,
          },
        });
      }
    }
  }

  return documents;
}

function extractConcerns(rowData) {
  const concerns = [];
  const concernsField = rowData['Concerns'] || rowData['concerns'] || rowData['Skin Concerns'] || '';

  if (concernsField) {
    const parsed = concernsField.toString().split(/[,;]/).map(c => c.trim()).filter(Boolean);
    concerns.push(...parsed);
  }

  return concerns;
}
