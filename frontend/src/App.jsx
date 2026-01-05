import { Chat } from '@/components/chat/Chat';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-2 px-2 sm:py-4 sm:px-4 md:py-8">
      <div className="container mx-auto">
        <Chat />
      </div>
    </div>
  );
}

export default App;
