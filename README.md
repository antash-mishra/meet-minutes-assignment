# Insurance Policy Q&A Application

A full-stack web application that allows users to upload insurance policy documents and ask questions using Retrieval-Augmented Generation (RAG) technology.

## Features

### Frontend (React + TypeScript)
- **Document Upload**: Drag-and-drop interface for PDF/TXT files
- **Chat Interface**: Conversational UI for asking questions
- **Sources Display**: View document excerpts used to generate answers
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Live upload progress and processing status

### Backend (FastAPI + LangGraph + Python)
- **Document Processing**: LangChain-powered PDF/TXT extraction with metadata
- **Smart Chunking**: RecursiveCharacterTextSplitter for optimal text segmentation
- **Vector Search**: LangChain FAISS integration with persistent storage
- **RAG Pipeline**: LangGraph workflows with conversation memory and session management
- **LLM Integration**: Groq-hosted Llama (primary) + OpenAI GPT-4o-mini (fallback)
- **RESTful API**: Well-documented endpoints with automatic docs

## Architecture

```
Frontend (React)     →     Backend (FastAPI + LangGraph)     →     Vector DB (FAISS)
     ↓                                    ↓                              ↓
- File Upload        →     - LangChain Document Loaders      →     - HuggingFace Embeddings
- Chat Interface     →     - RecursiveCharacterTextSplitter  →     - LangGraph Workflows
- Sources Display    →     - Groq Qwen LLM + OpenAI Fallback →     - Similarity Search + LLM
```

## Prerequisites

- **Node.js** 16+ and npm
- **Python** 3.10+
- **Git**

## Installation & Setup

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
nano .env
# Edit .env to add your API keys:
#   GROQ_API_KEY=<your_groq_key>   # primary (Groq Qwen)
#   OPENAI_API_KEY=<your_openai_key> # optional fallback
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install
```

## Running the Application

### Start the Backend

```bash
cd server

# Activate virtual environment if not already active
source venv/bin/activate

# Start the backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`

### Start the Frontend

```bash
cd frontend

# Start the React development server
npm start
```

The frontend will be available at `http://localhost:3000`

## API Documentation

Once the backend is running, you can access:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/

## Project Structure

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
│   │   ├── rag_service.py
│   │   ├── graph_builder.py # LangGraph workflows
│   │   └── vector_store_manager.py
│   ├── models/              # Data models
│   │   └── schemas.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration
│   ├── env.template         # Environment template
│   └── requirements.txt
└── README.md
```

## 🔍 Usage

1. **Start both servers** (backend and frontend)
2. **Upload documents**: Drag and drop PDF or TXT insurance policy files
3. **Wait for processing**: Documents will be processed and indexed automatically
4. **Ask questions**: Type questions about your insurance policies
5. **View sources**: Check the "Sources" tab to see document excerpts used

## 🎯 Key Design Decisions

### Backend Choices

1. **FastAPI**: Fast, modern Python web framework with automatic API docs
2. **LangGraph**: State-based conversation workflows with built-in persistence
3. **HuggingFace Embeddings**: Efficient embedding generation for semantic search
4. **LangChain FAISS**: High-performance vector search with persistence
5. **LangChain Document Loaders**: Robust PDF/TXT processing with metadata
6. **Groq Qwen LLM**: Ultra-fast, cost-effective open-source model
7. **OpenAI GPT-4o**: Reliable fallback for answer generation

### Frontend Choices

1. **React + TypeScript**: Type-safe, component-based UI development
2. **TailwindCSS**: Utility-first CSS framework for rapid styling
3. **React Dropzone**: Elegant file upload interface
4. **Hero Icons**: Consistent, professional icon set

### Trade-offs

- **Local vs. Cloud**: FAISS for local deployment vs. cloud vector databases
- **Model Size**: Smaller embedding model for speed vs. larger for accuracy
- **Processing**: Async document processing for better UX
- **LLM**: Groq Qwen for speed/cost vs. OpenAI for reliability
- **Conversation**: LangGraph workflows vs. simple QA chains

## 🛡️ Security Features

- File type validation (PDF/TXT only)
- File size limits (10MB max)
- CORS protection for frontend origins
- Input sanitization and validation
- Error handling without sensitive data exposure

### Performance Tips

- **Memory**: Reduce chunk size for lower memory usage
- **Speed**: Use smaller embedding models for faster processing
- **Storage**: Regular cleanup of uploaded files and vector store

### Technical Improvements

- Better error handling and user feedback
- Progressive loading for large documents
- Real-time processing status updates
- Advanced search filters and sorting
- Document versioning and history