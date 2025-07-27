import React from 'react';
import { Document } from '../types';
import { 
  HiDocumentText, 
  HiCheckCircle, 
  HiExclamationCircle, 
  HiClock, 
  HiArrowPath,
  HiTrash
} from 'react-icons/hi2';

interface DocumentListProps {
  documents: Document[];
  onDeleteDocument?: (documentId: string) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ documents, onDeleteDocument }) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
      case 'chunking':
      case 'embedding':
        return HiArrowPath({ className: "w-4 h-4 text-blue-500 animate-spin" }) as React.ReactElement;
      case 'ready':
        return HiCheckCircle({ className: "w-4 h-4 text-green-500" }) as React.ReactElement;
      case 'error':
        return HiExclamationCircle({ className: "w-4 h-4 text-red-500" }) as React.ReactElement;
      default:
        return HiClock({ className: "w-4 h-4 text-gray-400" }) as React.ReactElement;
    }
  };

  const getStatusText = (status: Document['status']) => {
    switch (status) {
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Processing...';
      case 'chunking':
        return 'Chunking...';
      case 'embedding':
        return 'Embedding...';
      case 'ready':
        return 'Ready';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
      case 'chunking':
      case 'embedding':
        return 'text-blue-600';
      case 'ready':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  if (documents.length === 0) {
    return (
      <div className="p-4 lg:p-6 text-center">
        <div className="animate-bounce-subtle">
          {HiDocumentText({ className: "w-12 h-12 text-gray-300 mx-auto mb-3" }) as React.ReactElement}
        </div>
        <p className="text-sm font-medium text-gray-600">No documents uploaded yet</p>
        <p className="text-xs text-gray-500 mt-1">Upload PDF or TXT files to get started</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">
          Documents
        </h3>
        <span className="bg-primary-100 text-primary-700 text-xs font-medium px-2 py-1 rounded-full">
          {documents.length}
        </span>
      </div>
      
      <div className="space-y-3">
        {documents.map((document) => (
          <div
            key={document.id}
            className="p-3 lg:p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-200 animate-fade-in overflow-hidden"
          >
            <div className="flex items-start space-x-3 min-w-0">
              <div className="flex-shrink-0">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  document.type === 'pdf' 
                    ? 'bg-red-100 text-red-600' 
                    : 'bg-blue-100 text-blue-600'
                }`}>
                  {HiDocumentText({ className: "w-5 h-5" }) as React.ReactElement}
                </div>
              </div>
              
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {document.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatFileSize(document.size)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 flex-wrap gap-2 flex-shrink-0">
                    {getStatusIcon(document.status)}
                    <span className={`text-xs font-medium px-2 py-1 rounded-full break-words whitespace-nowrap ${
                      document.status === 'ready' 
                        ? 'bg-green-100 text-green-700'
                        : document.status === 'error'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {getStatusText(document.status)}
                    </span>

                    {onDeleteDocument && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete "${document.name}"? This will remove it from the RAG system permanently.`)) {
                            onDeleteDocument(document.id);
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete document"
                      >
                        {HiTrash({ className: "w-4 h-4" }) as React.ReactElement}
                      </button>
                    )}
                  </div>
                </div>
                
                {(document.status === 'uploading' || document.status === 'processing' || document.status === 'chunking' || document.status === 'embedding') && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                      <span className="font-medium">
                        {document.status === 'chunking' ? 'Breaking into chunks...' :
                         document.status === 'embedding' ? 'Creating embeddings...' :
                         'Processing...'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {document.size > 5 * 1024 * 1024 ? 'Large file - may take longer' : ''}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-primary-400 to-primary-600 h-2 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${document.progress || 0}%` }}
                      />
                    </div>
                    {document.size > 5 * 1024 * 1024 && (
                      <p className="text-xs text-gray-500 mt-1">
                        ⏱️ Large file detected - processing may take several minutes
                      </p>
                    )}
                  </div>
                )}
                
                {document.error && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      {HiExclamationCircle({ className: "w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" }) as React.ReactElement}
                      <p className="text-xs text-red-700 leading-relaxed break-words whitespace-normal">{document.error}</p>
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mt-2 flex items-center">
                  {HiClock({ className: "w-3 h-3 mr-1" }) as React.ReactElement}
                  {document.uploadedAt.toLocaleDateString()} • {document.uploadedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentList; 