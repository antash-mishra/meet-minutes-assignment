import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { HiCloudArrowUp, HiDocumentText, HiExclamationTriangle } from 'react-icons/hi2';

interface DocumentUploadProps {
  onUpload: (files: File[]) => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    const allowedTypes = ['application/pdf', 'text/plain'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      setUploadError('Only PDF and TXT files are supported');
      return false;
    }

    if (file.size > maxSize) {
      setUploadError('File size must be less than 10MB');
      return false;
    }

    return true;
  };

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setUploadError(null);
    
    if (rejectedFiles.length > 0) {
      setUploadError('Some files were rejected. Please check file type and size.');
      return;
    }

    const validFiles = acceptedFiles.filter(validateFile);
    
    if (validFiles.length > 0) {
      onUpload(validFiles);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt']
    },
    maxSize: 10 * 1024 * 1024,
    multiple: true
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          relative p-6 lg:p-8 border-2 border-dashed rounded-2xl cursor-pointer
          transition-all duration-300 ease-in-out group
          ${isDragActive 
            ? 'border-primary-400 bg-primary-50 scale-105' 
            : 'border-gray-300 hover:border-primary-300 hover:bg-gray-50'
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className={`
              p-3 rounded-full transition-all duration-300
              ${isDragActive 
                ? 'bg-primary-100 text-primary-600 scale-110' 
                : 'bg-gray-100 text-gray-500 group-hover:bg-primary-100 group-hover:text-primary-600'
              }
            `}>
              {HiCloudArrowUp({ className: "w-8 h-8" }) as React.ReactElement}
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-base font-semibold text-gray-800 mb-1">
              {isDragActive ? 'Drop files here!' : 'Upload Documents'}
            </p>
            <p className="text-sm text-gray-600">
              Drag & drop files here or <span className="text-primary-600 font-medium">click to browse</span>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Supports PDF and TXT files • Max 10MB per file
            </p>
          </div>
          
          <div className="flex items-center justify-center space-x-6 pt-2">
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                {HiDocumentText({ className: "w-4 h-4 text-red-600" }) as React.ReactElement}
              </div>
              <span className="font-medium">PDF</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                {HiDocumentText({ className: "w-4 h-4 text-blue-600" }) as React.ReactElement}
              </div>
              <span className="font-medium">TXT</span>
            </div>
          </div>
        </div>
        
        {/* Animated background effect */}
        {isDragActive && (
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-blue-500/10 rounded-2xl animate-pulse"></div>
        )}
      </div>

      {uploadError && (
        <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-red-50 to-red-50 border border-red-200 rounded-xl shadow-sm animate-fade-in">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              {HiExclamationTriangle({ className: "w-4 h-4 text-red-600" }) as React.ReactElement}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-red-800">Upload Failed</p>
            <p className="text-sm text-red-700 leading-relaxed">{uploadError}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload; 