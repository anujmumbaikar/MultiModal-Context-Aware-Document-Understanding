import { useState, useRef, useEffect } from 'react';
import { ChatMessage, Citation } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Trash2, RotateCw, FileText, ChevronDown, ChevronUp, Bot, User, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ChatPanelProps {
  projectId: string;
  messages: ChatMessage[];
  onSend: (content: string) => void;
  onClear: () => void;
}

function SourcesPanel({ citations }: { citations: Citation[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 border rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary/50 transition-colors">
        <span className="flex items-center gap-1.5">
          <FileText className="h-3 w-3" />
          {citations.length} source{citations.length > 1 ? 's' : ''}
        </span>
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {open && (
        <div className="border-t divide-y">
          {citations.map((c, i) => (
            <div key={i} className="p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{c.documentName}</span>
                <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded">{(c.relevanceScore * 100).toFixed(0)}%</span>
              </div>
              {c.page && <p className="text-[10px] text-muted-foreground">Page {c.page}</p>}
              <p className="text-xs text-muted-foreground leading-relaxed">{c.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MessageActions({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex gap-1 mt-2">
      <button onClick={copy} className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors" title="Copy">
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      </button>
    </div>
  );
}

export function ChatPanel({ projectId, messages, onSend, onClear }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    const query = input.trim();
    setInput('');
    onSend(query);
    setIsLoading(true);

    setTimeout(() => {
      onSend('__assistant__' + 'Based on the indexed documents in your project, here is a synthesized response to your query. The system analyzed relevant chunks across your document collection and identified key passages that address your question.');
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-125 rounded-lg border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="text-sm font-medium">Chat</h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClear} title="Clear chat">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-5">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center mb-3">
              <Bot className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">Ask about your documents</p>
            <p className="text-xs text-muted-foreground mt-1">Responses are grounded in your indexed knowledge base</p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'assistant' && (
              <div className="h-7 w-7 rounded-md bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            )}
            <div className={cn(
              'max-w-[75%] rounded-lg px-4 py-3 text-sm leading-relaxed',
              msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
            )}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
              {msg.role === 'assistant' && <MessageActions content={msg.content} />}
              {msg.citations && msg.citations.length > 0 && (
                <SourcesPanel citations={msg.citations} />
              )}
            </div>
            {msg.role === 'user' && (
              <div className="h-7 w-7 rounded-md bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="h-7 w-7 rounded-md bg-secondary flex items-center justify-center shrink-0">
              <Bot className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="bg-secondary rounded-lg px-4 py-3">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask a question about your documents..."
            className="h-10"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <Button onClick={handleSend} disabled={!input.trim() || isLoading} className="shrink-0 h-10 w-10" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
