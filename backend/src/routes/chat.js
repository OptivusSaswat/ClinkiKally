import { Router } from 'express';
import { chatController } from '../controllers/chatController.js';

const router = Router();

router.post('/', chatController.chat);
router.get('/history/:sessionId', chatController.getHistory);
router.delete('/history/:sessionId', chatController.clearHistory);

export default router;
