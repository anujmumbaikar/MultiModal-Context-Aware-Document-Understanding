export type ProjectStatus = 'idle' | 'processing' | 'ready' | 'failed';
export type DocumentStatus = 'queued' | 'uploading' | 'processing' | 'completed' | 'failed';
export type IngestionStage = 'upload_received' | 'text_extraction' | 'ocr' | 'multimodal_extraction' | 'chunking' | 'embeddings' | 'vector_storage' | 'ready';
export type ContentType = 'text' | 'table' | 'image' | 'chart' | 'ocr';

export interface Project {
  id: string;
  name: string;
  description: string;
  domain: string;
  instructions?: string;
  tags: string[];
  status: ProjectStatus;
  totalDocuments: number;
  totalChunks: number;
  totalPages: number;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  projectId: string;
  name: string;
  fileType: string;
  size: number;
  status: DocumentStatus;
  pages: number;
  chunks: number;
  contentTypes: ContentType[];
  uploadedAt: string;
  processedAt?: string;
}

export interface IngestionJob {
  id: string;
  projectId: string;
  documentId: string;
  currentStage: IngestionStage;
  stages: { stage: IngestionStage; status: 'pending' | 'running' | 'completed' | 'failed'; startedAt?: string; completedAt?: string }[];
  progress: number;
  logs: { timestamp: string; message: string; level: 'info' | 'warn' | 'error' }[];
}

export interface ChatMessage {
  id: string;
  projectId: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  timestamp: string;
  isStreaming?: boolean;
}

export interface Citation {
  documentId: string;
  documentName: string;
  chunkId: string;
  text: string;
  page?: number;
  relevanceScore: number;
}

export interface Chunk {
  id: string;
  documentId: string;
  documentName: string;
  text: string;
  page?: number;
  contentType: ContentType;
}
