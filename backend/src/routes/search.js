import { Router } from 'express';
import { searchController } from '../controllers/searchController.js';

const router = Router();

router.post('/products', searchController.searchProducts);
router.post('/blogs', searchController.searchBlogs);

export default router;
