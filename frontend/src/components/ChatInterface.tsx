import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { 
  HiPaperAirplane, 
  HiUser, 
  HiCpuChip, 
  HiExclamationTriangle,
  HiDocumentText,
  HiSparkles,
  HiArrowUp,
  HiChevronDown,
  HiChevronRight,
  HiLightBulb
} from 'react-icons/hi2';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  hasDocuments: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isLoading,
  onSendMessage,
  hasDocuments
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [expandedThinking, setExpandedThinking] = useState<{ [key: string]: boolean }>({});

  // Parse thinking sections from message content
  const parseMessageContent = (content: string) => {
    const thinkRegex = /<think>([\s\S]*?)<\/think>/;
    const match = content.match(thinkRegex);
    
    if (match) {
      return {
        thinking: match[1].trim(),
        mainContent: content.replace(thinkRegex, '').trim()
      };
    }
    
    return {
      thinking: null,
      mainContent: content
    };
  };

  // Toggle thinking section visibility
  const toggleThinking = (messageId: string) => {
    setExpandedThinking(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  // Format text for better mobile display
  const formatTextForMobile = (text: string) => {
    // Preserve intentional line breaks but improve word wrapping
    return text;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !isLoading) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const suggestedQuestions = [
    "What is the deductible for flood damage?",
    "What are the coverage limits for personal property?",
    "How do I file a claim?",
    "What exclusions are listed in my policy?",
    "What is the policy renewal date?"
  ];

  const handleSuggestedQuestion = (question: string) => {
    if (!isLoading && hasDocuments) {
      onSendMessage(question);
    }
  };

  if (!hasDocuments) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <div className="text-center max-w-md mx-auto">
          <div className="relative mb-6">
            {HiDocumentText({ className: "w-16 h-16 text-gray-300 mx-auto animate-pulse" }) as React.ReactElement}
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
              {HiSparkles({ className: "w-3 h-3 text-white" }) as React.ReactElement}
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Ready to Analyze Your Documents
          </h3>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Upload your documents to unlock AI-powered insights. I'll analyze them and provide detailed, accurate answers to your questions.
          </p>
          <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-4 border border-primary-100">
            <div className="text-sm text-primary-700 font-medium mb-1">
              📄 Supported formats
            </div>
            <div className="text-sm text-primary-600">
              PDF, TXT files up to 10MB each
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-b from-white to-gray-50 overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto overscroll-contain p-2 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 touch-pan-y scrollbar-hidden max-w-full">
        {messages.length === 0 ? (
          <div className="text-center py-8 lg:py-12">
            <div className="relative mb-6">
              {HiCpuChip({ className: "w-12 h-12 text-primary-400 mx-auto animate-pulse" }) as React.ReactElement}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-green-500 rounded-full animate-ping"></div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-green-500 rounded-full"></div>
            </div>
            <h3 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
              Ready to Answer Your Questions
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
              Ask me anything about your documents. I'll analyze them using AI and provide detailed, accurate answers.
            </p>
            
            <div className="max-w-2xl mx-auto">
              <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center justify-center">
                {HiSparkles({ className: "w-4 h-4 mr-2 text-primary-500" }) as React.ReactElement}
                Try these example questions:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuestion(question)}
                    className="p-4 text-left text-sm bg-gradient-to-r from-white to-gray-50 hover:from-primary-50 hover:to-primary-100 rounded-xl border border-gray-200 hover:border-primary-300 transition-all duration-200 shadow-sm hover:shadow-md group"
                  >
                    <div className="flex items-start">
                      <div className="flex-1">{question}</div>
                      {HiArrowUp({ className: "w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors ml-2 transform group-hover:-translate-y-1 duration-200" }) as React.ReactElement}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in w-full px-2 sm:px-0`}
              >
                <div
                  className={`w-full max-w-3xl flex space-x-2 sm:space-x-3 ${
                    message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  <div className="flex-shrink-0">
                    <div
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-lg ${
                        message.type === 'user'
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white'
                          : 'bg-gradient-to-r from-gray-700 to-gray-800 text-white'
                      }`}
                    >
                      {message.type === 'user' ? (
                        HiUser ({className: "w-4 h-4 sm:w-5 sm:h-5"}) as React.ReactElement
                      ) : (
                        HiCpuChip ({className: "w-4 h-4 sm:w-5 sm:h-5"}) as React.ReactElement
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0 max-w-full overflow-hidden">
                    {(() => {
                      const { thinking, mainContent } = parseMessageContent(message.content);
                      const isThinkingExpanded = expandedThinking[message.id];
                      
                      return (
                        <>
                          {/* Thinking Section */}
                          {thinking && message.type === 'assistant' && (
                            <div className="mb-3 w-full">
                              <button
                                onClick={() => toggleThinking(message.id)}
                                className="flex items-center space-x-2 text-xs text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-50 w-full"
                              >
                                {isThinkingExpanded ? (
                                  HiChevronDown({ className: "w-3 h-3" }) as React.ReactElement
                                ) : (
                                  HiChevronRight({ className: "w-3 h-3" }) as React.ReactElement
                                )}
                                {HiLightBulb({ className: "w-3 h-3" }) as React.ReactElement}
                                <span className="font-medium">Show AI Reasoning</span>
                              </button>
                              
                              {isThinkingExpanded && (
                                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg w-full overflow-hidden">
                                  <div className="flex items-center space-x-2 mb-2">
                                    {HiLightBulb({ className: "w-4 h-4 text-amber-600" }) as React.ReactElement}
                                    <span className="text-xs font-semibold text-amber-800">AI Thinking Process</span>
                                  </div>
                                  <p className="text-xs text-amber-900 leading-relaxed italic whitespace-pre-wrap" style={{ wordBreak: 'normal', overflowWrap: 'break-word', hyphens: 'auto' }}>
                                    {thinking}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Main Content */}
                    <div
                      className={`p-2 sm:p-3 md:p-4 lg:p-5 rounded-2xl shadow-sm w-full overflow-hidden ${
                        message.type === 'user'
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white'
                          : 'bg-white border border-gray-200 shadow-md'
                      }`}
                    >
                      <p className={`whitespace-pre-wrap leading-relaxed ${
                        message.type === 'user' ? 'text-white' : 'text-gray-900'
                      } text-sm sm:text-base`} 
                      style={{ 
                        wordBreak: 'normal', 
                        overflowWrap: 'break-word', 
                        hyphens: 'auto',
                        wordSpacing: 'normal', 
                        letterSpacing: 'normal',
                        textAlign: 'left'
                      }}>
                        {formatTextForMobile(message.type === 'user' ? message.content : mainContent)}
                      </p>
                      
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100 w-full overflow-hidden">
                          <p className="text-xs font-semibold text-gray-600 mb-3 flex items-center">
                            {HiDocumentText({ className: "w-3 h-3 mr-1" }) as React.ReactElement}
                            Sources ({message.sources.length}):
                          </p>
                          <div className="space-y-2">
                            {message.sources.map((source, index) => (
                              <div
                                key={source.id}
                                className="text-xs text-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 p-2 sm:p-3 rounded-lg border border-gray-200 w-full overflow-hidden"
                              >
                                <div className="flex items-start justify-between flex-wrap gap-2">
                                  <span className="font-semibold text-gray-800 break-words flex-1 min-w-0">{source.documentName}</span>
                                  {source.relevanceScore && (
                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0">
                                      {Math.round(source.relevanceScore * 100)}%
                                    </span>
                                  )}
                                </div>
                                {source.page && <div className="text-gray-500 mt-1">Page {source.page}</div>}
                                {source.content && (
                                  <div className="text-gray-600 mt-2 break-words overflow-wrap-anywhere text-xs">
                                    {source.content}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                        </>
                      );
                    })()}
                    
                    <div className="mt-1 text-xs text-gray-500">
                      {formatTimestamp(message.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="max-w-3xl flex space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-700 to-gray-800 text-white flex items-center justify-center shadow-lg">
                      {HiCpuChip({ className: "w-5 h-5 animate-pulse" }) as React.ReactElement}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="p-4 lg:p-5 bg-white border border-gray-200 rounded-2xl shadow-md">
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-1">
                          <div className="w-2.5 h-2.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2.5 h-2.5 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2.5 h-2.5 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-sm text-gray-600 font-medium">Analyzing your documents...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white p-4 lg:p-6">
        <form onSubmit={handleSubmit} className="flex space-x-3 lg:space-x-4">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask a question about your documents..."
              rows={1}
              className="w-full px-4 py-3 lg:px-5 lg:py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none overflow-hidden shadow-sm transition-all duration-200 placeholder-gray-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              disabled={isLoading}
              style={{ 
                minHeight: '52px',
                height: 'auto',
                maxHeight: '200px'  // allow more growth before scrollbar appears
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 200) + 'px';
              }}
            />
          </div>
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-3 lg:px-6 lg:py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl hover:from-primary-600 hover:to-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-105 disabled:hover:scale-100"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              HiPaperAirplane({ className: "w-5 h-5" }) as React.ReactElement
            )}
          </button>
        </form>
        
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center">
            {HiSparkles({ className: "w-3 h-3 mr-1 text-primary-400" }) as React.ReactElement}
            AI-powered document analysis
          </div>
          <div className="hidden sm:flex items-center">
            Press Enter to send • Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface; 