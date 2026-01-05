import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export function ChatMessage({ message, isUser, sources }) {
  return (
    <div
      className={cn(
        'flex gap-3 p-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className={cn(
          isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary'
        )}>
          {isUser ? 'U' : 'AI'}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          'flex flex-col gap-2 max-w-[80%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'rounded-2xl px-4 py-2 text-sm',
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-muted rounded-tl-sm'
          )}
        >
          <p className="whitespace-pre-wrap">{message}</p>
        </div>

        {sources && sources.length > 0 && (
          <div className="text-xs text-muted-foreground mt-1">
            <span className="font-medium">Sources: </span>
            {sources.map((source, index) => (
              <span key={index}>
                {source.title || source.productName || source.blogTitle}
                {index < sources.length - 1 && ', '}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
