import { useState, useRef, useEffect } from 'react';
import { ChatMessage, Citation, Document } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Send, Trash2, FileText, Bot, User,
  Copy, Check, X, FileImage, File, ExternalLink, PanelRight, PanelRightClose,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

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
  if (fileType === 'application/pdf') return 'text-red-400 bg-red-500/10';
  if (fileType.startsWith('image/')) return 'text-purple-400 bg-purple-500/10';
  return 'text-blue-400 bg-blue-500/10';
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
  const [open, setOpen] = useState(true);
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-3 border border-border/50 rounded-xl overflow-hidden bg-secondary/30"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-muted-foreground hover:bg-secondary/50 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          {citations.length} source{citations.length > 1 ? 's' : ''}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <PanelRight className="h-3.5 w-3.5" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border/50 divide-y divide-border/30"
          >
            {citations.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-3 space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium truncate">{c.documentName}</span>
                  <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full shrink-0 font-medium">
                    {(c.relevanceScore * 100).toFixed(0)}%
                  </span>
                </div>
                {c.page && <p className="text-[10px] text-muted-foreground">Page {c.page}</p>}
                <p className="text-xs text-muted-foreground leading-relaxed">{c.text}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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
        className="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-secondary/50 transition-colors"
        title="Copy"
      >
        {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
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
    <div className="flex flex-col h-full bg-card">
      {/* Doc panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          Documents
        </h3>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-secondary/50 transition-colors"
          title="Close viewer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Document list */}
      <div className="border-b border-border/50">
        <div className="p-2 space-y-1 max-h-44 overflow-y-auto scrollbar-thin">
          {documents.map((doc) => {
            const Icon = getFileIcon(doc.fileType);
            const colorClass = getFileColor(doc.fileType);
            const isSelected = selectedDoc?.id === doc.id;
            return (
              <motion.button
                key={doc.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => onSelect(doc)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all text-xs',
                  isSelected
                    ? 'bg-primary/15 text-primary border border-primary/30 shadow-sm'
                    : 'hover:bg-secondary/50 text-muted-foreground hover:text-foreground'
                )}
              >
                <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', colorClass)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate text-foreground">{doc.name}</p>
                  <p className="text-[10px] text-muted-foreground">{mimeToLabel(doc.fileType)} · {doc.pages} pages</p>
                </div>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="h-2 w-2 rounded-full bg-primary shrink-0"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Viewer area */}
      <div className="flex-1 overflow-hidden bg-muted/20">
        {!selectedDoc ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="h-14 w-14 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4"
            >
              <FileText className="h-7 w-7 text-muted-foreground" />
            </motion.div>
            <p className="text-sm font-medium">Select a document</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-48 leading-relaxed">
              Choose a document from the list to preview
            </p>
          </div>
        ) : !canPreview ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn('h-16 w-16 rounded-2xl flex items-center justify-center', getFileColor(selectedDoc.fileType))}
            >
              <File className="h-8 w-8" />
            </motion.div>
            <div>
              <p className="text-sm font-semibold">{mimeToLabel(selectedDoc.fileType)} preview unavailable</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-56 leading-relaxed">
                Download to open locally
              </p>
            </div>
            <a
              href={docUrl!}
              download={selectedDoc.name}
              className="inline-flex items-center gap-2 text-xs bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Download
            </a>
          </div>
        ) : isImage ? (
          <div className="h-full overflow-auto flex items-start justify-center p-4">
            <motion.img
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              src={docUrl!}
              alt={selectedDoc.name}
              className="max-w-full rounded-lg shadow-lg"
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

      {selectedDoc && docUrl && (
        <div className="px-4 py-2 border-t border-border/50 shrink-0">
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
        citations: [],
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-[calc(100vh-140px)] min-h-125"
    >
      <ResizablePanelGroup orientation="horizontal" className="rounded-xl border bg-card overflow-hidden shadow-lg">
        {/* Chat Panel */}
        <ResizablePanel defaultSize={showDocViewer ? 55 : 100} minSize={35} maxSize={100} className="flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/80 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-2.5">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="h-8 w-8 rounded-lg bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-sm"
              >
                <Bot className="h-4 w-4 text-primary" />
              </motion.div>
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
                  className="h-8 w-8"
                  onClick={() => setShowDocViewer(v => !v)}
                  title={showDocViewer ? 'Hide document viewer' : 'Show document viewer'}
                >
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                  >
                    {showDocViewer ? <PanelRightClose className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
                  </motion.div>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={handleClear}
                title="Clear chat"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center h-full text-center py-12"
              >
                <div className="relative mb-4">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="h-16 w-16 rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg"
                  >
                    <Bot className="h-8 w-8 text-primary" />
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-card"
                  />
                </div>
                <p className="text-base font-semibold">Ask anything about your documents</p>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm leading-relaxed">
                  Get accurate answers powered by your knowledge base with full citations.
                </p>
                {documents.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-6 flex flex-wrap gap-2 justify-center max-w-md"
                  >
                    {documents.slice(0, 3).map(doc => (
                      <span key={doc.id} className="text-xs bg-secondary/50 text-muted-foreground px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-border/50">
                        <FileText className="h-3 w-3" />
                        {doc.name}
                      </span>
                    ))}
                    {documents.length > 3 && (
                      <span className="text-xs bg-secondary/50 text-muted-foreground px-3 py-1.5 rounded-full border border-border/50">
                        +{documents.length - 3} more
                      </span>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}

            <AnimatePresence>
              {messages.map((msg, idx) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className={cn('flex gap-3 group', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  {msg.role === 'assistant' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="h-8 w-8 rounded-lg bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 mt-0.5 shadow-sm"
                    >
                      <Bot className="h-4 w-4 text-primary" />
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn('max-w-[80%] space-y-1', msg.role === 'user' ? 'items-end' : 'items-start')}
                  >
                    <div className={cn(
                      'rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm border',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-md border-primary/20'
                        : 'bg-secondary/40 rounded-tl-md border-border/40'
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
                  </motion.div>

                  {msg.role === 'user' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5"
                    >
                      <User className="h-4 w-4 text-primary" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="h-8 w-8 rounded-lg bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-secondary/40 rounded-2xl rounded-tl-md border border-border/40 px-4 py-3">
                  <div className="flex gap-1.5 items-center h-4">
                    <motion.span
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      className="h-2 w-2 rounded-full bg-primary/60"
                    />
                    <motion.span
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.16 }}
                      className="h-2 w-2 rounded-full bg-primary/60"
                    />
                    <motion.span
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.32 }}
                      className="h-2 w-2 rounded-full bg-primary/60"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border/50 bg-card/80 backdrop-blur-sm shrink-0">
            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask a question about your documents..."
                  className="h-12 pr-4 rounded-xl bg-secondary/30 border-border/50 focus-visible:ring-1 focus-visible:ring-primary/30 text-sm"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
              </div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="h-12 w-12 rounded-xl shadow-lg"
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </ResizablePanel>

        {/* Document Viewer Panel */}
        {showDocViewer && documents.length > 0 && (
          <>
            <ResizableHandle withHandle className="bg-border/50 hover:bg-border transition-colors" />
            <ResizablePanel defaultSize={45} minSize={25} maxSize={65}>
              <DocumentViewer
                projectId={projectId}
                documents={documents}
                selectedDoc={selectedDoc}
                onSelect={setSelectedDoc}
                onClose={() => setShowDocViewer(false)}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </motion.div>
  );
}
