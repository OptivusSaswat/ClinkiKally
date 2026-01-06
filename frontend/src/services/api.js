const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const chatApi = {
  async sendMessage(message, sessionId = null) {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, sessionId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send message');
    }

    return response.json();
  },

  async getHistory(sessionId) {
    const response = await fetch(`${API_BASE_URL}/chat/history/${sessionId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get history');
    }

    return response.json();
  },

  async clearHistory(sessionId) {
    const response = await fetch(`${API_BASE_URL}/chat/history/${sessionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to clear history');
    }

    return response.json();
  },
};
