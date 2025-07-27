# Insurance Policy Q&A Backend

A FastAPI-based backend service for RAG-powered insurance policy document analysis with LangGraph workflows and conversation memory.

## Features

- **Document Processing**: Extract text from PDF and TXT files with metadata preservation
- **Intelligent Chunking**: Smart text chunking with overlap handling using RecursiveCharacterTextSplitter
- **Vector Search**: FAISS-powered similarity search with relevance scoring
- **RAG Pipeline**: LangGraph workflows with conversation memory and session management
- **LLM Integration**: Groq (primary) + OpenAI (fallback) with LangChain integration
- **Session Management**: Persistent conversation history with automatic contextualization
- **RESTful API**: Well-documented API endpoints with real-time processing status

## Tech Stack

- **Framework**: FastAPI 0.116.1
- **RAG Framework**: LangChain 0.3.27 + LangGraph 0.5.4
- **Document Processing**: LangChain Community (PyPDF, TextLoader)
- **Text Splitting**: LangChain RecursiveCharacterTextSplitter
- **Embeddings**: HuggingFaceEmbeddings (BAAI/bge-base-en-v1.5)
- **Vector Database**: FAISS with GPU acceleration (CUDA 12)
- **LLM**: Groq (Llama-4-Scout-17B) + OpenAI GPT-4o-mini (fallback)
- **Server**: Uvicorn with async/await support

## Setup Instructions

### 1. Prerequisites

- Python 3.10+
- CUDA-capable GPU (optional, for faster embeddings)
- pip or conda

### 2. Environment Setup

```bash
# Navigate to server directory
cd server

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configuration

Create a `.env` file in the server directory:

```env
# Primary LLM (Groq)
GROQ_API_KEY=your_groq_api_key_here

# Fallback LLM (OpenAI)
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=True

# CORS Origins (for frontend integration)
CORS_ORIGINS=http://localhost:3000,https://meet-minutes-frontend.netlify.app

# RAG Configuration
EMBEDDING_MODEL=BAAI/bge-base-en-v1.5
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
VECTOR_DB_PATH=vector_store

# File Upload Configuration
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR=uploads
```

### 4. Run the Server

```bash
# Development mode with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or using Python directly
python main.py
```

The server will start at `http://localhost:8000`

## API Endpoints

### Health Check
- **GET** `/` - Health check endpoint
- **GET** `/health` - Detailed health check with RAG status
- **GET** `/ping` - Simple ping endpoint

### Document Upload
- **POST** `/upload`
  - Upload insurance policy documents (PDF/TXT)
  - Max file size: 10MB
  - Supports multiple files
  - Returns processing status with background processing

### Chat Query
- **POST** `/chat`
  - Send queries about uploaded documents
  - Returns AI-generated answers with source citations
  - Supports session-based conversation memory
  - Requires documents to be uploaded first

### Document Management
- **GET** `/documents` - List all uploaded documents with status
- **GET** `/documents/{document_id}/status` - Get processing status of specific document
- **DELETE** `/documents/{document_id}` - Delete a specific document

## API Documentation

Interactive API documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Architecture

### Document Processing Pipeline

1. **File Upload**: Validate and store uploaded files with unique IDs
2. **Text Extraction**: Extract text from PDF/TXT files with LangChain loaders
3. **Chunking**: Split text into overlapping chunks using RecursiveCharacterTextSplitter
4. **Embedding**: Generate vector embeddings using HuggingFace models
5. **Storage**: Store embeddings in FAISS vector database with metadata

### RAG Query Pipeline (LangGraph)

1. **Query Processing**: Receive user question with session context
2. **Contextualization**: Reformulate question based on conversation history
3. **Similarity Search**: Find relevant document chunks with relevance scores
4. **Context Assembly**: Combine relevant chunks with metadata
5. **Answer Generation**: Generate response using Groq/OpenAI LLM
6. **Response**: Return answer with source citations and conversation memory

### Session Management

- **Automatic Session Creation**: Sessions created on first chat request
- **Conversation Memory**: Persistent chat history per session
- **Contextualization**: Questions reformulated based on conversation context
- **LangGraph Checkpoints**: Built-in persistence for conversation state

## Design Choices & Tradeoffs

### LangGraph Framework
**Why**: Advanced RAG workflows with conversation memory and state management
**Benefits**: 
- Built-in conversation memory and contextualization
- State-based workflows with automatic persistence
- Session isolation and conversation continuity
- Advanced prompt engineering with multi-step reasoning
**Tradeoff**: More complex than simple RAG chains, but much more powerful

### Embedding Model: BAAI/bge-base-en-v1.5
**Why**: High-quality embeddings optimized for semantic search
**Benefits**: Better semantic understanding, good performance
**Tradeoff**: Larger model size but better accuracy

### Vector Database: FAISS with GPU
**Why**: Fast similarity search with GPU acceleration, LangChain integration
**Benefits**: Automatic persistence, metadata handling, GPU acceleration
**Tradeoff**: Requires CUDA for optimal performance

### LLM Strategy: Groq Primary + OpenAI Fallback
**Why**: Groq provides fast, high-quality responses with fallback reliability
**Benefits**: 
- Groq: Fast responses, high-quality models (Llama-4-Scout-17B)
- OpenAI: Reliable fallback with GPT-4o-mini
- Automatic failover between providers
**Tradeoff**: Requires API keys, but provides redundancy

### Document Processing: LangChain Loaders
**Why**: Robust PDF/text extraction with metadata preservation
**Benefits**: Better text quality, proper page numbering, error handling
**Tradeoff**: More dependencies than simple PyPDF2

### Async Processing
**Why**: Non-blocking document processing, better user experience
**Benefits**: Real-time status updates, responsive API
**Tradeoff**: More complex error handling and state management

## Error Handling

- File type validation (PDF/TXT only)
- File size limits (10MB max)
- Empty query detection
- LLM rate limit handling with automatic fallback
- Graceful degradation when APIs unavailable
- Background processing with status tracking

## Storage Structure

```
server/
├── uploads/          # Uploaded documents
├── vector_store/     # FAISS index and metadata
│   ├── index.faiss   # Vector index
│   ├── index.pkl     # FAISS metadata
│   └── metadata.pkl  # Document/chunk metadata
└── logs/            # Application logs (if configured)
```

## Performance Considerations

- **Embedding Generation**: ~50-100ms per document chunk (GPU)
- **Vector Search**: ~5-20ms for similarity search
- **LLM Response**: ~500ms-2s depending on provider
- **Memory Usage**: ~200MB for embedding model + vector storage
- **Disk Usage**: ~2MB per 100 document pages

## Security Notes

- File upload validation prevents malicious files
- CORS configured for specific origins
- No sensitive data stored in logs
- API keys should be kept secure
- Background processing prevents blocking

## Deployment

### Local Development
```bash
uvicorn main:app --reload
```

### Production
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Docker (Optional)
```dockerfile
FROM python:3.11
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```