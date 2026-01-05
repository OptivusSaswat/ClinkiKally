import { Router } from 'express';
import { chatController } from '../controllers/chatController.js';

const router = Router();

// Main chat endpoint
router.post('/', chatController.chat);

// Get conversation history
router.get('/history/:sessionId', chatController.getHistory);

// Clear conversation history
router.delete('/history/:sessionId', chatController.clearHistory);

export default router;
