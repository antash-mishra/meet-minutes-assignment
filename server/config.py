import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Application configuration"""
    
    # OpenAI Configuration
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    
    # Server Configuration
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", 8000))
    DEBUG = os.getenv("DEBUG", "True").lower() == "true"
    
    # CORS Configuration
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    
    # RAG Configuration
    EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "BAAI/bge-large-en-v1.5")
    CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", 1000))
    CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", 200))
    VECTOR_DB_PATH = os.getenv("VECTOR_DB_PATH", "vector_store")
    
    # File Upload Configuration
    MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", 10485760))  # 10MB
    UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
    
    @classmethod
    def get_cors_origins(cls):
        """Get CORS origins as a list"""
        return [origin.strip() for origin in cls.CORS_ORIGINS] 