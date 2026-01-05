import { vectorSearchService } from '../services/vectorSearchService.js';

export const searchController = {
  async searchProducts(req, res) {
    try {
      const { query, limit = 5, filters = {} } = req.body;

      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      let results;
      if (Object.keys(filters).length > 0) {
        results = await vectorSearchService.searchProductsWithFilter(query, filters, limit);
      } else {
        results = await vectorSearchService.searchProducts(query, limit);
      }

      res.json({
        success: true,
        query,
        count: results.length,
        results,
      });
    } catch (error) {
      console.error('Product search error:', error);
      res.status(500).json({ error: 'Failed to search products', details: error.message });
    }
  },

  async searchBlogs(req, res) {
    try {
      const { query, limit = 5, filters = {} } = req.body;

      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      let results;
      if (Object.keys(filters).length > 0) {
        results = await vectorSearchService.searchBlogsWithFilter(query, filters, limit);
      } else {
        results = await vectorSearchService.searchBlogs(query, limit);
      }

      res.json({
        success: true,
        query,
        count: results.length,
        results,
      });
    } catch (error) {
      console.error('Blog search error:', error);
      res.status(500).json({ error: 'Failed to search blogs', details: error.message });
    }
  },
};
