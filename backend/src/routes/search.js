import { Router } from 'express';
import { searchController } from '../controllers/searchController.js';

const router = Router();

// Product search (for Product Recommendation Agent)
router.post('/products', searchController.searchProducts);

// Blog search (for Blog Reader Agent)
router.post('/blogs', searchController.searchBlogs);

export default router;
