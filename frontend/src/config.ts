// API Configuration
export const API_CONFIG = {
  // Use environment variable or fallback to Fly.dev URL
  BASE_URL: process.env.REACT_APP_API_URL || 'https://server-meet-minutes.fly.dev',
  
  // API endpoints
  ENDPOINTS: {
    DOCUMENTS: '/documents',
    UPLOAD: '/upload',
    CHAT: '/chat',
    DOCUMENT_STATUS: (id: string) => `/documents/${id}/status`,
    DELETE_DOCUMENT: (id: string) => `/documents/${id}`
  }
} as const;

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
}; 