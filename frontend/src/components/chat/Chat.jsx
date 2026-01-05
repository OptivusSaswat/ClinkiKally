import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { chatApi } from '@/services/api';

const STORAGE_KEY = 'clinikally_chat';

function loadFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.error('Failed to load chat from storage:', err);
  }
  return { messages: [], sessionId: null };
}

function saveToStorage(messages, sessionId) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, sessionId }));
  } catch (err) {
    console.error('Failed to save chat to storage:', err);
  }
}

function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear chat storage:', err);
  }
}

export function Chat() {
  const [messages, setMessages] = useState(() => loadFromStorage().messages);
  const [sessionId, setSessionId] = useState(() => loadFromStorage().sessionId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Save to localStorage whenever messages or sessionId change
  useEffect(() => {
    saveToStorage(messages, sessionId);
  }, [messages, sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (message) => {
    setError(null);

    // Add user message immediately
    const userMessage = {
      id: Date.now(),
      content: message,
      isUser: true,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await chatApi.sendMessage(message, sessionId);

      if (response.success) {
        // Save session ID for future messages
        if (response.sessionId) {
          setSessionId(response.sessionId);
        }

        // Add AI response
        const aiMessage = {
          id: Date.now() + 1,
          content: response.message,
          isUser: false,
          sources: response.sources,
          metadata: response.metadata,
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        setError('Failed to get response');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
      // Remove the user message if the request failed
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (sessionId) {
      try {
        await chatApi.clearHistory(sessionId);
      } catch (err) {
        console.error('Failed to clear history on server:', err);
      }
    }
    setMessages([]);
    setSessionId(null);
    setError(null);
    clearStorage();
  };

  return (
    <Card className="w-full max-w-4xl mx-auto h-[calc(100vh-4rem)] min-h-[500px] max-h-[900px] flex flex-col shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between border-b py-3 px-4 sm:py-4 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-black flex items-center justify-center">
            <span className="text-white font-bold text-xs sm:text-sm">CK</span>
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg">Clinikally Assistant</CardTitle>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Your skincare & haircare expert
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearChat}
            className="text-muted-foreground hover:text-destructive"
          >
            Clear Chat
          </Button>
        )}
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-4 sm:p-8 text-center">
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-black flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl sm:text-2xl">CK</span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">
                Welcome to Clinikally
              </h3>
              <p className="text-muted-foreground text-xs sm:text-sm max-w-md px-2">
                I'm your personal skincare and haircare assistant. Ask me about
                product recommendations, skincare routines, ingredients, or any
                beauty concerns you have!
              </p>
              <div className="flex flex-wrap gap-2 mt-4 sm:mt-6 justify-center px-2">
                {[
                  'Recommend a moisturizer for dry skin',
                  'How to reduce acne?',
                  'Best ingredients for hair growth',
                ].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSend(suggestion)}
                    className="text-xs"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message.content}
                  isUser={message.isUser}
                  sources={message.sources}
                />
              ))}
              {isLoading && (
                <div className="flex gap-3 p-4">
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                    <span className="text-xs font-medium">AI</span>
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {error && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm border-t">
          {error}
        </div>
      )}

      <ChatInput onSend={handleSend} disabled={isLoading} />
    </Card>
  );
}
