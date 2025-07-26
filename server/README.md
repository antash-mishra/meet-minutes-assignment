# Insurance Policy Q&A Backend

A FastAPI-based backend service for RAG-powered insurance policy document analysis.

## Features

- **Document Processing**: Extract text from PDF and TXT files
- **Intelligent Chunking**: Smart text chunking with overlap handling
- **Vector Search**: FAISS-powered similarity search
- **RAG Pipeline**: Retrieval-Augmented Generation for accurate answers
- **LLM Integration**: OpenAI GPT integration with fallback responses
- **RESTful API**: Well-documented API endpoints

## Tech Stack

- **Framework**: FastAPI 0.116.1
- **RAG Framework**: LangChain 0.3.13
- **Document Processing**: LangChain Community (PyPDF, TextLoader)
- **Text Splitting**: LangChain RecursiveCharacterTextSplitter
- **Embeddings**: HuggingFaceEmbeddings (all-MiniLM-L6-v2)
- **Vector Database**: LangChain FAISS integration
- **LLM**: OpenAI GPT-3.5-turbo with LangChain integration (optional)
- **Server**: Uvicorn

## Setup Instructions

### 1. Prerequisites

- Python 3.10+
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
# Optional: OpenAI API Key for better responses
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=True

# CORS Origins (for frontend integration)
CORS_ORIGINS=http://localhost:3000

# RAG Configuration
EMBEDDING_MODEL=all-MiniLM-L6-v2
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
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

### Document Upload
- **POST** `/upload`
  - Upload insurance policy documents (PDF/TXT)
  - Max file size: 10MB
  - Supports multiple files
  - Returns processing status

### Chat Query
- **POST** `/chat`
  - Send queries about uploaded documents
  - Returns AI-generated answers with sources
  - Requires documents to be uploaded first

### Document Management
- **GET** `/documents` - List all uploaded documents
- **DELETE** `/documents/{document_id}` - Delete a specific document

## API Documentation

Interactive API documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Architecture

### Document Processing Pipeline

1. **File Upload**: Validate and store uploaded files
2. **Text Extraction**: Extract text from PDF/TXT files
3. **Chunking**: Split text into overlapping chunks
4. **Embedding**: Generate vector embeddings using Sentence Transformers
5. **Storage**: Store embeddings in FAISS vector database

### RAG Query Pipeline

1. **Query Processing**: Receive user question
2. **Similarity Search**: Find relevant document chunks
3. **Context Assembly**: Combine relevant chunks
4. **Answer Generation**: Generate response using LLM or fallback
5. **Response**: Return answer with source citations

## Design Choices & Tradeoffs

### LangChain Framework
**Why**: Comprehensive RAG pipeline, standardized interfaces, robust document processing
**Benefits**: 
- Better PDF text extraction with metadata preservation
- Intelligent text splitting with RecursiveCharacterTextSplitter
- Integrated QA chains for streamlined question-answering
- Standardized vector store abstractions
**Tradeoff**: Additional dependencies, but much more robust and maintainable

### Embedding Model: all-MiniLM-L6-v2
**Why**: Fast, efficient, good for semantic search
**Tradeoff**: Less accurate than larger models but much faster

### Vector Database: LangChain FAISS
**Why**: Fast similarity search, LangChain integration, good for local deployment
**Benefits**: Automatic persistence, metadata handling, standardized interface
**Tradeoff**: Limited delete operations (requires rebuild for true deletion)

### Document Processing: LangChain Loaders
**Why**: Robust PDF/text extraction, automatic metadata extraction, page tracking
**Benefits**: Better text quality, proper page numbering, error handling
**Tradeoff**: More dependencies than simple PyPDF2

### LLM Integration: LangChain + OpenAI
**Why**: Streamlined QA chains, prompt templates, better error handling
**Benefits**: Automatic context management, retrieval integration, prompt optimization
**Tradeoff**: Requires API key and internet, costs money
**Fallback**: Template-based responses for common insurance questions

### Async Processing
**Why**: Non-blocking document processing, better user experience
**Tradeoff**: More complex error handling

## Error Handling

- File type validation (PDF/TXT only)
- File size limits (10MB max)
- Empty query detection
- LLM rate limit handling
- Graceful degradation when OpenAI unavailable

## Storage Structure

```
server/
├── uploads/          # Uploaded documents
├── vector_store/     # FAISS index and metadata
│   ├── index.faiss   # Vector index
│   └── metadata.pkl  # Document/chunk metadata
└── logs/            # Application logs (if configured)
```

## Performance Considerations

- **Embedding Generation**: ~100-200ms per document chunk
- **Vector Search**: ~10-50ms for similarity search
- **Memory Usage**: ~100MB for embedding model + vector storage
- **Disk Usage**: ~1MB per 100 document pages

## Security Notes

- File upload validation prevents malicious files
- CORS configured for specific origins
- No sensitive data stored in logs
- OpenAI API key should be kept secure

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

## Testing

The backend can be tested using:
- FastAPI's built-in test client
- Postman/Insomnia for API testing
- Frontend integration testing

## Future Improvements

1. **Advanced Chunking**: Implement recursive chunking strategies
2. **Multiple LLMs**: Support for local models (Ollama, etc.)
3. **Better Vector DB**: Migrate to ChromaDB or Pinecone
4. **Caching**: Add Redis for embedding caching
5. **Monitoring**: Add logging and metrics
6. **Authentication**: Add user authentication
7. **Batch Processing**: Support batch document uploads

## Troubleshooting

### Common Issues

1. **"Module not found" errors**: Ensure virtual environment is activated and dependencies installed
2. **OpenAI API errors**: Check API key or use fallback responses
3. **Memory issues**: Reduce chunk size or use smaller embedding model
4. **CORS errors**: Check frontend origin in CORS configuration
5. **File upload failures**: Check file size and type restrictions

### Logs

Check console output for detailed error messages and processing status.

## License

This project is part of a technical assessment for insurance policy Q&A functionality. 