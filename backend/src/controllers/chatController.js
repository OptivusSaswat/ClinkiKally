import { orchestrator } from '../agents/orchestrator.js';

export const chatController = {
  async chat(req, res) {
    try {
      const { message, sessionId } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Message is required and must be a string',
        });
      }

      const trimmedMessage = message.trim();
      if (trimmedMessage.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Message cannot be empty',
        });
      }

      if (trimmedMessage.length > 2000) {
        return res.status(400).json({
          success: false,
          error: 'Message is too long (max 2000 characters)',
        });
      }

      const effectiveSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const result = await orchestrator.processQuery(trimmedMessage, effectiveSessionId);

      res.json({
        success: result.success,
        message: result.response,
        sessionId: effectiveSessionId,
        metadata: result.metadata,
        sources: result.sources,
      });
    } catch (error) {
      console.error('Chat controller error:', error);
      res.status(500).json({
        success: false,
        error: 'An error occurred while processing your message',
        details: error.message,
      });
    }
  },

  async getHistory(req, res) {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Session ID is required',
        });
      }

      const history = orchestrator.getHistory(sessionId);

      res.json({
        success: true,
        sessionId,
        history,
        count: history.length,
      });
    } catch (error) {
      console.error('Get history error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve conversation history',
      });
    }
  },

  async clearHistory(req, res) {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Session ID is required',
        });
      }

      orchestrator.clearHistory(sessionId);

      res.json({
        success: true,
        message: 'Conversation history cleared',
        sessionId,
      });
    } catch (error) {
      console.error('Clear history error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear conversation history',
      });
    }
  },
};
