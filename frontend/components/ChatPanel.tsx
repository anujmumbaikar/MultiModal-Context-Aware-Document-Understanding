import { useState, useRef, useEffect } from 'react';
import { ChatMessage, Citation, Document } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Send, Trash2, FileText, ChevronDown, ChevronUp, Bot, User,
  Copy, Check, X, FileImage, File, ExternalLink, PanelRight, PanelRightClose,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import axios from 'axios';

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';

interface ChatPanelProps {
  projectId: string;
  messages: ChatMessage[];
  documents?: Document[];
  onSend: (content: string) => void;
  onClear: () => void;
}

const PREVIEWABLE_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'text/html',
  'text/csv',
]);

function isPreviewable(fileType: string) {
  return fileType.startsWith('image/') || PREVIEWABLE_TYPES.has(fileType);
}

function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) return FileImage;
  return File;
}

function getFileColor(fileType: string) {
  if (fileType === 'application/pdf') return 'text-red-500 bg-red-50 dark:bg-red-950';
  if (fileType.startsWith('image/')) return 'text-purple-500 bg-purple-50 dark:bg-purple-950';
  return 'text-blue-500 bg-blue-50 dark:bg-blue-950';
}

function mimeToLabel(fileType: string): string {
  const map: Record<string, string> = {
    'application/pdf': 'PDF',
    'text/plain': 'TXT',
    'text/csv': 'CSV',
    'text/html': 'HTML',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/msword': 'DOC',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
    'application/vnd.ms-excel': 'XLS',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
    'application/vnd.ms-powerpoint': 'PPT',
  };
  if (map[fileType]) return map[fileType];
  if (fileType.startsWith('image/')) return fileType.split('/')[1].toUpperCase();
  return fileType.split('/').pop()?.toUpperCase() ?? 'FILE';
}

function SourcesPanel({ citations }: { citations: Citation[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 border border-border/50 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary/50 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <FileText className="h-3 w-3" />
          {citations.length} source{citations.length > 1 ? 's' : ''}
        </span>
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {open && (
        <div className="border-t border-border/50 divide-y divide-border/30">
          {citations.map((c, i) => (
            <div key={i} className="p-3 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium truncate">{c.documentName}</span>
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full shrink-0 font-medium">
                  {(c.relevanceScore * 100).toFixed(0)}%
                </span>
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
    <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={copy}
        className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-secondary transition-colors"
        title="Copy"
      >
        {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
      </button>
    </div>
  );
}

function DocumentViewer({
  projectId,
  documents,
  selectedDoc,
  onSelect,
  onClose,
}: {
  projectId: string;
  documents: Document[];
  selectedDoc: Document | null;
  onSelect: (doc: Document) => void;
  onClose: () => void;
}) {
  const docUrl = selectedDoc
    ? `/api/files/${projectId}/${encodeURIComponent(selectedDoc.name)}`
    : null;

  const isImage = selectedDoc?.fileType?.startsWith('image/');
  const canPreview = selectedDoc ? isPreviewable(selectedDoc.fileType) : false;

  return (
    <div className="flex flex-col h-full border-l bg-card">
      {/* Doc panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          Documents
        </h3>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-secondary transition-colors"
          title="Close viewer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Document list */}
      <div className="border-b">
        <div className="p-2 space-y-1 max-h-44 overflow-y-auto">
          {documents.map((doc) => {
            const Icon = getFileIcon(doc.fileType);
            const colorClass = getFileColor(doc.fileType);
            const isSelected = selectedDoc?.id === doc.id;
            return (
              <button
                key={doc.id}
                onClick={() => onSelect(doc)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors text-xs',
                  isSelected
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
                )}
              >
                <div className={cn('h-7 w-7 rounded-md flex items-center justify-center shrink-0', colorClass)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate text-foreground">{doc.name}</p>
                  <p className="text-[10px] text-muted-foreground">{mimeToLabel(doc.fileType)} · {doc.pages} pages · {(doc.size / 1024).toFixed(0)} KB</p>
                </div>
                {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Viewer area */}
      <div className="flex-1 overflow-hidden bg-muted/30">
        {!selectedDoc ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center mb-3">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">Select a document</p>
            <p className="text-xs text-muted-foreground mt-1">Choose a document from the list above to preview it here</p>
          </div>
        ) : !canPreview ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-4">
            <div className={cn('h-14 w-14 rounded-2xl flex items-center justify-center', getFileColor(selectedDoc.fileType))}>
              <File className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-semibold">{mimeToLabel(selectedDoc.fileType)} files cannot be previewed</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-55 leading-relaxed">
                Browser preview is not supported for this format. Download it to open locally.
              </p>
            </div>
            <a
              href={docUrl!}
              download={selectedDoc.name}
              className="inline-flex items-center gap-2 text-xs bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Download {selectedDoc.name}
            </a>
          </div>
        ) : isImage ? (
          <div className="h-full overflow-auto flex items-start justify-center p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={docUrl!}
              alt={selectedDoc.name}
              className="max-w-full rounded-lg shadow-sm"
            />
          </div>
        ) : (
          <iframe
            src={docUrl!}
            className="w-full h-full"
            title={selectedDoc.name}
          />
        )}
      </div>

      {/* Open in new tab */}
      {selectedDoc && docUrl && (
        <div className="px-4 py-2 border-t shrink-0">
          <a
            href={docUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Open in new tab
          </a>
        </div>
      )}
    </div>
  );
}

export function ChatPanel({
  projectId,
  messages: initialMessages,
  documents = [],
  onSend,
  onClear,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDocViewer, setShowDocViewer] = useState(documents.length > 0);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(documents[0] ?? null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (documents.length > 0 && !showDocViewer) {
      setShowDocViewer(true);
      setSelectedDoc(documents[0]);
    }
  }, [documents.length]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const query = input.trim();
    setInput('');

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      projectId,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    onSend(query);
    setIsLoading(true);

    try {
      const res = await axios.post(`${FASTAPI_URL}/chat`, {
        query,
        project_id: projectId,
      });

      const savedMessages = await axios.post(`/api/projects/${projectId}/chat`, {
        query,
        answer: res.data.answer,
        citations: [], // TODO: extract citations from search results if needed
      });

      const assistantMessage: ChatMessage = {
        id: savedMessages.data.assistantMessage.id,
        projectId,
        role: 'assistant',
        content: savedMessages.data.assistantMessage.content,
        timestamp: savedMessages.data.assistantMessage.timestamp,
        citations: savedMessages.data.assistantMessage.citations,
      };

      setMessages(prev => {
        const withoutOptimisticUser = prev.filter(m => m.id !== userMessage.id);
        return [...withoutOptimisticUser,
          {
            id: savedMessages.data.userMessage.id,
            role: 'user',
            content: savedMessages.data.userMessage.content,
            timestamp: savedMessages.data.userMessage.timestamp,
            projectId,
          },
          assistantMessage
        ];
      });
    } catch (error) {
      toast.error('Failed to get response. Please try again.');
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    try {
      await axios.delete(`/api/projects/${projectId}/chat`);
      setMessages([]);
      onClear();
      toast.success('Chat history cleared');
    } catch {
      toast.error('Failed to clear chat history');
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] min-h-125 rounded-xl border bg-card overflow-hidden shadow-sm">

      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-card/95 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bot className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">AI Assistant</h3>
              <p className="text-[10px] text-muted-foreground">Grounded in your documents</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {documents.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setShowDocViewer(v => !v)}
                title={showDocViewer ? 'Hide document viewer' : 'Show document viewer'}
              >
                {showDocViewer ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRight className="h-3.5 w-3.5" />}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={handleClear}
              title="Clear chat"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="relative mb-4">
                <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-sm">
                  <Bot className="h-7 w-7 text-primary" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-card" />
              </div>
              <p className="text-base font-semibold">Ask anything about your documents</p>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-xs leading-relaxed">
                I can answer questions, summarize, and extract insights from your indexed knowledge base.
              </p>
              {documents.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {documents.slice(0, 3).map(doc => (
                    <span key={doc.id} className="text-xs bg-secondary text-muted-foreground px-2.5 py-1 rounded-full flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {doc.name}
                    </span>
                  ))}
                  {documents.length > 3 && (
                    <span className="text-xs bg-secondary text-muted-foreground px-2.5 py-1 rounded-full">
                      +{documents.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {messages.map(msg => (
            <div
              key={msg.id}
              className={cn('flex gap-3 group', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {msg.role === 'assistant' && (
                <div className="h-7 w-7 rounded-lg bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
              )}

              <div className={cn('max-w-[80%] space-y-1', msg.role === 'user' ? 'items-end' : 'items-start')}>
                <div className={cn(
                  'rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : 'bg-secondary/80 rounded-tl-sm border border-border/40'
                )}>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  {msg.role === 'assistant' && <MessageActions content={msg.content} />}
                  {msg.citations && msg.citations.length > 0 && (
                    <SourcesPanel citations={msg.citations} />
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {msg.role === 'user' && (
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="h-7 w-7 rounded-lg bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="bg-secondary/80 rounded-2xl rounded-tl-sm border border-border/40 px-4 py-3">
                <div className="flex gap-1.5 items-center h-4">
                  <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '160ms' }} />
                  <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '320ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-card/95 backdrop-blur-sm shrink-0">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask a question about your documents..."
                className="h-11 pr-4 rounded-xl bg-secondary/50 border-border/60 focus-visible:ring-1 focus-visible:ring-primary/30 text-sm"
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="shrink-0 h-11 w-11 rounded-xl"
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>

      {showDocViewer && documents.length > 0 && (
        <div className="w-150 shrink-0">
          <DocumentViewer
            projectId={projectId}
            documents={documents}
            selectedDoc={selectedDoc}
            onSelect={setSelectedDoc}
            onClose={() => setShowDocViewer(false)}
          />
        </div>
      )}
    </div>
  );
}
