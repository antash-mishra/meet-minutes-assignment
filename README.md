# Insurance Policy Q&A Application

A full-stack web application that allows users to upload insurance policy documents and ask questions using Retrieval-Augmented Generation (RAG) technology.

## 🚀 Features

### Frontend (React + TypeScript)
- **Document Upload**: Drag-and-drop interface for PDF/TXT files
- **Chat Interface**: Conversational UI for asking questions
- **Sources Display**: View document excerpts used to generate answers
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Live upload progress and processing status

### Backend (FastAPI + LangChain + Python)
- **Document Processing**: LangChain-powered PDF/TXT extraction with metadata
- **Smart Chunking**: RecursiveCharacterTextSplitter for optimal text segmentation
- **Vector Search**: LangChain FAISS integration with persistent storage
- **RAG Pipeline**: End-to-end LangChain QA chains for accurate answers
- **LLM Integration**: LangChain + OpenAI GPT-3.5-turbo with fallback responses
- **RESTful API**: Well-documented endpoints with automatic docs

## 🏗️ Architecture

```
Frontend (React)     →     Backend (FastAPI + LangChain)     →     Vector DB (FAISS)
     ↓                                    ↓                              ↓
- File Upload        →     - LangChain Document Loaders      →     - HuggingFace Embeddings
- Chat Interface     →     - RecursiveCharacterTextSplitter  →     - LangChain FAISS Store
- Sources Display    →     - LangChain QA Chains             →     - Similarity Search + LLM
```

## 📋 Prerequisites

- **Node.js** 16+ and npm
- **Python** 3.10+
- **Git**

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd meet-minutes
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd server

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create configuration file (optional)
cp .env.example .env
# Edit .env to add your OpenAI API key (optional)
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install
```

## 🚀 Running the Application

### Start the Backend

```bash
cd server

# Activate virtual environment if not already active
source venv/bin/activate

# Start the backend server
python start.py
```

The backend will be available at `http://localhost:8000`

### Start the Frontend

```bash
cd frontend

# Start the React development server
npm start
```

The frontend will be available at `http://localhost:3000`

## 📚 API Documentation

Once the backend is running, you can access:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/

## 🧪 Testing

### Backend Testing

```bash
cd server

# Run the test script
python test_backend.py
```

This will test:
- Health check endpoint
- File upload functionality
- Document processing
- Chat query processing

### Frontend Testing

```bash
cd frontend

# Run React tests
npm test
```

## 🔧 Configuration

### Backend Configuration (.env)

```env
# Optional: OpenAI API Key for enhanced responses
OPENAI_API_KEY=your_openai_api_key_here

# Server settings
HOST=0.0.0.0
PORT=8000
DEBUG=True

# CORS origins
CORS_ORIGINS=http://localhost:3000

# RAG configuration
EMBEDDING_MODEL=all-MiniLM-L6-v2
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
```

### Frontend Configuration

The frontend is configured to connect to the backend at `http://localhost:8000`. If you need to change this, update the API URLs in `frontend/src/App.tsx`.

## 📁 Project Structure

```
meet-minutes/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── types.ts         # TypeScript interfaces
│   │   └── App.tsx          # Main application
│   └── package.json
├── server/                   # FastAPI backend
│   ├── services/            # Business logic
│   │   ├── document_processor.py
│   │   └── rag_service.py
│   ├── models/              # Data models
│   │   └── schemas.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration
│   ├── start.py             # Startup script
│   ├── test_backend.py      # Test script
│   └── requirements.txt
└── README.md
```

## 🔍 Usage

1. **Start both servers** (backend and frontend)
2. **Upload documents**: Drag and drop PDF or TXT insurance policy files
3. **Wait for processing**: Documents will be processed and indexed automatically
4. **Ask questions**: Type questions about your insurance policies
5. **View sources**: Check the "Sources" tab to see document excerpts used

### Example Questions

- "What is the deductible for flood damage?"
- "What are the coverage limits for personal property?"
- "How do I file a claim?"
- "What exclusions are listed in my policy?"
- "What is the policy renewal date?"

## 🎯 Key Design Decisions

### Backend Choices

1. **FastAPI**: Fast, modern Python web framework with automatic API docs
2. **LangChain**: Comprehensive RAG framework with standardized interfaces
3. **HuggingFace Embeddings**: Efficient embedding generation for semantic search
4. **LangChain FAISS**: High-performance vector search with persistence
5. **LangChain Document Loaders**: Robust PDF/TXT processing with metadata
6. **LangChain QA Chains**: Streamlined question-answering pipeline
7. **OpenAI GPT-3.5**: High-quality answer generation with fallback options

### Frontend Choices

1. **React + TypeScript**: Type-safe, component-based UI development
2. **TailwindCSS**: Utility-first CSS framework for rapid styling
3. **React Dropzone**: Elegant file upload interface
4. **Hero Icons**: Consistent, professional icon set

### Trade-offs

- **Local vs. Cloud**: FAISS for local deployment vs. cloud vector databases
- **Model Size**: Smaller embedding model for speed vs. larger for accuracy
- **Processing**: Async document processing for better UX
- **LLM**: OpenAI for quality vs. local models for privacy

## 🛡️ Security Features

- File type validation (PDF/TXT only)
- File size limits (10MB max)
- CORS protection for frontend origins
- Input sanitization and validation
- Error handling without sensitive data exposure

## 🚀 Deployment

### Backend Deployment

```bash
# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Frontend Deployment

```bash
# Build for production
npm run build

# Deploy the build folder to your hosting service
```

### Docker Support (Optional)

```dockerfile
# Backend Dockerfile example
FROM python:3.11
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 🔧 Troubleshooting

### Common Issues

1. **Backend won't start**:
   - Check Python version (3.10+ required)
   - Ensure virtual environment is activated
   - Install dependencies: `pip install -r requirements.txt`

2. **Frontend won't start**:
   - Check Node.js version (16+ required)
   - Install dependencies: `npm install`
   - Clear cache: `npm start -- --reset-cache`

3. **CORS errors**:
   - Ensure backend is running on port 8000
   - Check CORS_ORIGINS in backend configuration

4. **Upload failures**:
   - Check file size (max 10MB)
   - Ensure file type is PDF or TXT
   - Check backend console for detailed errors

5. **Chat not working**:
   - Ensure documents are uploaded and processed
   - Check backend logs for processing status
   - Verify embedding model download completed

### Performance Tips

- **Memory**: Reduce chunk size for lower memory usage
- **Speed**: Use smaller embedding models for faster processing
- **Storage**: Regular cleanup of uploaded files and vector store

## 📈 Future Enhancements

### Planned Features

1. **Authentication**: User accounts and document privacy
2. **Advanced Chunking**: Recursive text splitting strategies
3. **Multiple LLMs**: Support for local models (Ollama, etc.)
4. **Better Vector DB**: Migration to ChromaDB or Pinecone
5. **Caching**: Redis for embedding and response caching
6. **Monitoring**: Logging, metrics, and health monitoring
7. **Batch Processing**: Multiple document upload optimization

### Technical Improvements

- Better error handling and user feedback
- Progressive loading for large documents
- Real-time processing status updates
- Advanced search filters and sorting
- Document versioning and history

## 📄 License

This project is developed as part of a technical assessment for insurance policy Q&A functionality.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📧 Support

For questions or issues:
1. Check the troubleshooting section
2. Review the API documentation
3. Check console outputs for detailed error messages
4. Test with the provided test script

---

**Happy coding! 🎉** 