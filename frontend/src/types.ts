export interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'txt';
  size: number;
  uploadedAt: Date;
  status: 'uploading' | 'processing' | 'chunking' | 'embedding' | 'ready' | 'error';
  progress?: number;
  error?: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: DocumentSource[];
}

export interface DocumentSource {
  id: string;
  documentName: string;
  content: string;
  page?: number;
  relevanceScore?: number;
}

export interface UploadResponse {
  success: boolean;
  documentId?: string;
  message: string;
  error?: string;
}

export interface ChatResponse {
  success: boolean;
  answer: string;
  sources: DocumentSource[];
  error?: string;
}

export interface AppState {
  documents: Document[];
  messages: ChatMessage[];
  isLoading: boolean;
  currentTab: 'chat' | 'sources';
  selectedSources: DocumentSource[];
}

export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error'; 