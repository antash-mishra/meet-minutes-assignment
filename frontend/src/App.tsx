import React, { useState, useCallback, useEffect } from 'react';
import { Document, ChatMessage, DocumentSource, AppState } from './types';
import { buildApiUrl, API_CONFIG } from './config';
import Header from './components/Header';
import DocumentUpload from './components/DocumentUpload';
import ChatInterface from './components/ChatInterface';
import SourcesPanel from './components/SourcesPanel';
import DocumentList from './components/DocumentList';
import { HiDocumentText, HiChatBubbleLeft, HiBars3, HiXMark } from 'react-icons/hi2';

function App() {
  const [appState, setAppState] = useState<AppState>({
    documents: [],
    messages: [],
    isLoading: false,
    currentTab: 'chat',
    selectedSources: []
  });
  
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Load existing documents on app startup
  useEffect(() => {
    const loadExistingDocuments = async () => {
      try {
        const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.DOCUMENTS));
        if (response.ok) {
          const result = await response.json();
          const existingDocuments: Document[] = result.documents.map((doc: any) => ({
            id: doc.id,
            name: doc.filename,
            type: doc.filename.toLowerCase().endsWith('.pdf') ? 'pdf' as const : 'txt' as const,
            size: doc.size,
            uploadedAt: new Date(doc.uploaded_at),
            status: doc.status as Document['status'],
            progress: doc.status === 'ready' ? 100 : 0,
            error: doc.error
          }));
          
          setAppState(prev => ({
            ...prev,
            documents: existingDocuments
          }));
        }
      } catch (error) {
        console.error('Failed to load existing documents:', error);
      }
    };

    loadExistingDocuments();
  }, []);

  const handleDocumentUpload = useCallback(async (files: File[]) => {
    const newDocuments: Document[] = files.map(file => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'txt',
      size: file.size,
      uploadedAt: new Date(),
      status: 'uploading',
      progress: 0
    }));

    setAppState(prev => ({
      ...prev,
      documents: [...prev.documents, ...newDocuments]
    }));

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.UPLOAD), {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Update documents with backend IDs and start simple polling
        const updatedDocuments = newDocuments.map((doc, index) => ({
          ...doc,
          id: result.documents[index]?.id || doc.id,
          status: 'processing' as const,
          progress: 50
        }));

        setAppState(prev => ({
          ...prev,
          documents: prev.documents.map(doc => {
            const updatedDoc = updatedDocuments.find(ud => 
              newDocuments.some(nd => nd.id === doc.id)
            );
            return updatedDoc || doc;
          })
        }));

        // Start simple polling for each document
        updatedDocuments.forEach(doc => {
          pollDocumentStatus(doc.id);
        });
      } else {
        setAppState(prev => ({
          ...prev,
          documents: prev.documents.map(doc => 
            newDocuments.some(newDoc => newDoc.id === doc.id)
              ? { ...doc, status: 'error', error: 'Upload failed' }
              : doc
          )
        }));
      }
    } catch (error) {
      setAppState(prev => ({
        ...prev,
        documents: prev.documents.map(doc =>
          newDocuments.some(newDoc => newDoc.id === doc.id)
            ? { ...doc, status: 'error', error: 'Network error' }
            : doc
        )
      }));
    }
  }, []);

  const pollDocumentStatus = useCallback(async (documentId: string) => {
    const maxPolls = 30; // Poll for up to 5 minutes
    let pollCount = 0;

    const poll = async () => {
      try {
        const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.DOCUMENT_STATUS(documentId)));
        
        if (response.ok) {
          const statusData = await response.json();
          
          setAppState(prev => ({
            ...prev,
            documents: prev.documents.map(doc => 
              doc.id === documentId 
                ? { 
                    ...doc, 
                    status: statusData.status as Document['status'],
                    error: statusData.error,
                    progress: statusData.status === 'ready' ? 100 : 75
                  }
                : doc
            )
          }));

          // Stop polling if done or continue if still processing
          if (statusData.status === 'ready' || statusData.status === 'error') {
            return;
          }

          pollCount++;
          if (pollCount < maxPolls) {
            setTimeout(poll, 10000); // Simple 10-second intervals
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    poll();
  }, []);

  const handleDeleteDocument = useCallback(async (documentId: string) => {
    try {
              const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.DELETE_DOCUMENT(documentId)), {
          method: 'DELETE',
        });

      if (response.ok) {
        setAppState(prev => ({
          ...prev,
          documents: prev.documents.filter(doc => doc.id !== documentId)
        }));
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  }, []);

  const handleSendMessage = useCallback(async (message: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setAppState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true
    }));

    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.CHAT), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: result.answer,
          timestamp: new Date(),
          sources: result.sources
        };

        setAppState(prev => ({
          ...prev,
          messages: [...prev.messages, assistantMessage],
          isLoading: false,
          selectedSources: result.sources
        }));
      } else {
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: result.error || 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date()
        };

        setAppState(prev => ({
          ...prev,
          messages: [...prev.messages, errorMessage],
          isLoading: false
        }));
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I couldn\'t connect to the server. Please try again.',
        timestamp: new Date()
      };

      setAppState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
        isLoading: false
      }));
    }
  }, []);

  const handleTabChange = (tab: 'chat' | 'sources') => {
    setAppState(prev => ({ ...prev, currentTab: tab }));
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col"
      style={{ minHeight: '100dvh' }}
    >
      <Header />
      
      <div className="flex-1 flex overflow-hidden relative" style={{ height: '100%' }}>
        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50
          w-80 bg-white border-r border-gray-200 shadow-xl lg:shadow-none
          flex flex-col transform transition-transform duration-300 ease-in-out
        `}>
          {/* Mobile Close Button */}
          <div className="lg:hidden flex justify-end p-4">
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              {HiXMark({ className: "w-6 h-6" }) as React.ReactElement}
            </button>
          </div>
          
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Documents</h2>
            <DocumentUpload onUpload={handleDocumentUpload} />
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <DocumentList 
              documents={appState.documents} 
              onDeleteDocument={handleDeleteDocument}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header with Menu Button */}
          <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              {HiBars3({ className: "w-6 h-6" }) as React.ReactElement}
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Insurance Policy Q&A</h1>
            <div className="w-10"></div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex-shrink-0">
            <nav className="flex space-x-4 lg:space-x-8">
              <button
                onClick={() => handleTabChange('chat')}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                  appState.currentTab === 'chat'
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {HiChatBubbleLeft({ className: "w-4 h-4 mr-2" }) as React.ReactElement}
                Chat
              </button>
              <button
                onClick={() => handleTabChange('sources')}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                  appState.currentTab === 'sources'
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {HiDocumentText({ className: "w-4 h-4 mr-2" }) as React.ReactElement}
                Sources
                {appState.selectedSources.length > 0 && (
                  <span className="ml-2 bg-white/20 text-current text-xs px-2 py-1 rounded-full">
                    {appState.selectedSources.length}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {appState.currentTab === 'chat' ? (
              <ChatInterface
                messages={appState.messages}
                isLoading={appState.isLoading}
                onSendMessage={handleSendMessage}
                hasDocuments={appState.documents.some(doc => doc.status === 'ready')}
              />
            ) : (
              <SourcesPanel sources={appState.selectedSources} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
