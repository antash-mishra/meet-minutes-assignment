import React, { useState } from 'react';
import { DocumentSource } from '../types';
import { 
  HiDocumentText, 
  HiEye, 
  HiStar, 
  HiMagnifyingGlass,
  HiExclamationCircle 
} from 'react-icons/hi2';

interface SourcesPanelProps {
  sources: DocumentSource[];
}

const SourcesPanel: React.FC<SourcesPanelProps> = ({ sources }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState<DocumentSource | null>(null);

  const filteredSources = sources.filter(source =>
    source.documentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    source.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const getRelevanceColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRelevanceLabel = (score?: number) => {
    if (!score) return 'Unknown';
    if (score >= 0.9) return 'High';
    if (score >= 0.7) return 'Medium';
    return 'Low';
  };

  if (sources.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          {HiDocumentText({ className: "w-16 h-16 text-gray-300 mx-auto mb-4" }) as React.ReactElement}
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Sources Available
          </h3>
          <p className="text-gray-500 mb-4">
            Ask a question in the chat to see the document sources used to generate the answer.
          </p>
          <p className="text-sm text-gray-400">
            Sources will show excerpts from your uploaded documents with relevance scores.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Document Sources</h2>
            <p className="text-sm text-gray-500">
              {sources.length} source{sources.length !== 1 ? 's' : ''} used to generate the response
            </p>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          {HiMagnifyingGlass({ className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" }) as React.ReactElement}
          <input
            type="text"
            placeholder="Search sources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Sources List */}
      <div className="flex-1 overflow-y-auto scrollbar-hidden">
        <div className="p-4 lg:p-6 space-y-4">
                {filteredSources.length === 0 ? (
                  <div className="text-center py-8">
                    {HiExclamationCircle({ className: "w-8 h-8 text-gray-300 mx-auto mb-2" }) as React.ReactElement}
                    <p className="text-sm text-gray-500">No sources match your search</p>
                  </div>
                ) : (
                  filteredSources.map((source, index) => (
                    <div
                      key={source.id}
                      className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow w-full overflow-hidden"
                    >
                      <div className="p-3 sm:p-4">
                        {/* Source Header */}
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 gap-2">
                          <div className="flex items-start space-x-3 flex-1 min-w-0">
                            <div className="flex-shrink-0 mt-1">
                              {HiDocumentText({ className: "w-5 h-5 text-primary-600" }) as React.ReactElement}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-gray-900 break-words">
                                {source.documentName}
                              </h3>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1">
                                {source.page && (
                                  <span className="text-xs text-gray-500">
                                    Page {source.page}
                                  </span>
                                )}
                                {source.relevanceScore && (
                                  <div className="flex items-center space-x-1 flex-wrap">
                                    {HiStar({ className: `w-3 h-3 ${getRelevanceColor(source.relevanceScore)}` }) as React.ReactElement}
                                    <span className={`text-xs font-medium ${getRelevanceColor(source.relevanceScore)}`}>
                                      {getRelevanceLabel(source.relevanceScore)} relevance
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      ({Math.round((source.relevanceScore || 0) * 100)}%)
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => setSelectedSource(selectedSource?.id === source.id ? null : source)}
                            className="flex items-center space-x-1 px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 rounded flex-shrink-0"
                          >
                            {HiEye({ className: "w-3 h-3" }) as React.ReactElement}
                            <span>{selectedSource?.id === source.id ? 'Hide' : 'View'}</span>
                          </button>
                        </div>

                        {/* Source Content Preview */}
                        <div className="bg-gray-50 rounded-lg p-3 w-full overflow-hidden">
                          <p className="text-sm text-gray-700 leading-relaxed break-words overflow-wrap-anywhere">
                            {searchTerm ? highlightText(source.content, searchTerm) : source.content}
                          </p>
                        </div>

                        {/* Expanded View */}
                        {selectedSource?.id === source.id && (
                          <div className="mt-4 pt-4 border-t border-gray-200 w-full overflow-hidden">
                            <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                              <h4 className="text-sm font-medium text-gray-900 mb-2">
                                Full Context
                              </h4>
                              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">
                                {/* In a real implementation, this would show more context around the excerpt */}
                                <p className="text-gray-500 italic mb-2">
                                  [This would show expanded context from the document...]
                                </p>
                                <p>
                                  ...{source.content}...
                                </p>
                                <p className="text-gray-500 italic mt-2">
                                  [Additional context would continue here...]
                                </p>
                              </div>
                              
                              <div className="mt-4 pt-3 border-t border-gray-100">
                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                                  <span>Source: {source.documentName}</span>
                                  {source.page && <span>Page: {source.page}</span>}
                                  {source.relevanceScore && (
                                    <span>Relevance: {Math.round(source.relevanceScore * 100)}%</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
         </div>
       </div>
     </div>
  );
};

export default SourcesPanel; 