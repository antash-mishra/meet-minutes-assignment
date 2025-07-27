from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import os
import uuid
import asyncio
from datetime import datetime

from services.document_processor import DocumentProcessor
from services.rag_service import RAGService
from models.schemas import ChatRequest, ChatResponse, UploadResponse, DocumentSource
from config import Config

# Initialize FastAPI app
app = FastAPI(
    title="Insurance Policy Q&A API",
    description="RAG-powered API for insurance policy document analysis",
    version="1.0.0"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=Config.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
document_processor = DocumentProcessor(
    chunk_size=Config.CHUNK_SIZE,
    overlap=Config.CHUNK_OVERLAP
)
rag_service = RAGService(
    embedding_model=Config.EMBEDDING_MODEL,
    vector_db_path=Config.VECTOR_DB_PATH,
    groq_api_key=Config.GROQ_API_KEY
)

# Storage directories
os.makedirs(Config.UPLOAD_DIR, exist_ok=True)

# Run RAG initialization in the background so the server can start listening immediately.
init_task: asyncio.Task | None = None


@app.on_event("startup")
async def startup_event():
    """Kick-off background initialization of heavy RAG components"""
    global init_task
    print("🚀 Scheduling RAG service initialization in background…")

    async def _init():
        try:
            await rag_service.initialize()
            print("✅ RAG service initialized successfully! Ready to accept queries.")
        except Exception as e:
            print(f"❌ RAG service failed to initialize: {e}")

    init_task = asyncio.create_task(_init())
    print("🌐 FastAPI server is up – waiting for RAG background init to finish.")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Insurance Policy Q&A API is running",
        "status": "healthy",
        "host": Config.HOST,
        "port": Config.PORT,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Detailed health check endpoint"""
    return {
        "status": "healthy",
        "service": "RAG API",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "config": {
            "host": Config.HOST,
            "port": Config.PORT,
            "debug": Config.DEBUG,
            "has_documents": rag_service.has_documents(),
            "rag_initialized": rag_service.is_initialized
        }
    }

@app.get("/ping")
async def ping():
    """Simple ping endpoint for quick health checks"""
    return {"message": "pong", "rag_initialized": rag_service.is_initialized, "timestamp": datetime.now().isoformat()}

@app.post("/upload", response_model=UploadResponse)
async def upload_documents(files: List[UploadFile] = File(...)):
    """
    Upload and process insurance policy documents
    """
    try:
        uploaded_documents = []
        
        for file in files:
            # Validate file type
            if not file.filename.lower().endswith(('.pdf', '.txt')):
                raise HTTPException(
                    status_code=400, 
                    detail=f"Unsupported file type: {file.filename}. Only PDF and TXT files are allowed."
                )
            
            # Validate file size
            content = await file.read()
            if len(content) > Config.MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=400, 
                    detail=f"File too large: {file.filename}. Maximum size is {Config.MAX_FILE_SIZE // (1024*1024)}MB."
                )
            
            # Generate unique document ID
            document_id = str(uuid.uuid4())

            # Store initial document metadata with processing status
            rag_service.documents[document_id] = {
                "filename": file.filename,
                "chunks_count": 0,
                "uploaded_at": datetime.now(),
                "size": len(content),
                "status": "processing"
            }
            
            # Save file
            file_path = os.path.join(Config.UPLOAD_DIR, f"{document_id}_{file.filename}")
            with open(file_path, "wb") as f:
                f.write(content)
            
            # Process document in background
            asyncio.create_task(process_document_async(document_id, file_path, file.filename))
            
            uploaded_documents.append({
                "id": document_id,
                "filename": file.filename,
                "size": len(content)
            })
        
        return UploadResponse(
            success=True,
            message=f"Successfully uploaded {len(files)} document(s). Processing in background.",
            documents=uploaded_documents
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

async def process_document_async(document_id: str, file_path: str, filename: str):
    """
    Process document asynchronously using LangChain
    """
    try:
        print(f"Starting processing for document: {filename}")
        
        # Update status to show chunking is in progress
        if document_id in rag_service.documents:
            rag_service.documents[document_id]["status"] = "chunking"
        
        # Load and chunk documents using LangChain
        chunks = await document_processor.chunk_documents(file_path, filename)
        print(f"Chunking completed for {filename}: {len(chunks)} chunks created")
        
        # Update status to show embedding is in progress
        if document_id in rag_service.documents:
            rag_service.documents[document_id]["status"] = "embedding"
        
        # Add to vector store (this will set status to "ready")
        await rag_service.add_document(document_id, chunks, filename)
        
        # Update final status
        if document_id in rag_service.documents:
            rag_service.documents[document_id]["status"] = "ready"
            rag_service.documents[document_id]["chunks_count"] = len(chunks)
        
        print(f"Successfully processed document: {filename} ({len(chunks)} chunks)")
        
    except Exception as e:
        error_msg = f"Error processing document {filename}: {str(e)}"
        print(f" {error_msg}")
        
        # Update status to error if processing fails
        if document_id in rag_service.documents:
            rag_service.documents[document_id]["status"] = "error"
            rag_service.documents[document_id]["error"] = str(e)
        
        # Re-raise to ensure the error is logged properly
        raise Exception(error_msg)

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Process a chat query using the full RAG pipeline and return a structured response.
    """
    try:
        if not request.message or not request.message.strip():
            raise HTTPException(status_code=400, detail="Empty query not allowed.")
        
        if not rag_service.has_documents():
            raise HTTPException(
                status_code=400, 
                detail="No documents available. Please upload documents first."
            )

        # Delegate the entire RAG process to the service layer
        result = await rag_service.generate_answer_with_graph(
            request.message, 
            session_id=request.session_id
        )

        # Format the sources from the result
        sources = [
            DocumentSource(
                id=src["id"],
                documentName=src["documentName"],
                content=src["content"],
                page=src.get("page"),
                relevanceScore=src.get("relevanceScore", 0.0)
            ) for src in result.get("sources", [])
        ]
        
        return ChatResponse(
            success=True,
            answer=result["answer"],
            sources=sources
        )
        
    except Exception as e:
        error_msg = str(e)
        if "RAG service is not ready" in error_msg or "OpenAI API key" in error_msg:
            raise HTTPException(
                status_code=424,  # Failed Dependency
                detail=f"Chat service is not ready: {error_msg}"
            )
        else:
            raise HTTPException(status_code=500, detail=f"Chat processing failed: {error_msg}")

@app.get("/documents")
async def list_documents():
    """
    List all processed documents
    """
    try:
        documents = await rag_service.get_documents_info()
        return {"documents": documents}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list documents: {str(e)}")

@app.get("/documents/{document_id}/status")
async def get_document_status(document_id: str):
    """
    Get the processing status of a specific document
    """
    try:
        if document_id not in rag_service.documents:
            raise HTTPException(status_code=404, detail="Document not found")
        
        doc_info = rag_service.documents[document_id]
        return {
            "document_id": document_id,
            "filename": doc_info["filename"],
            "status": doc_info["status"],
            "chunks_count": doc_info.get("chunks_count", 0),
            "error": doc_info.get("error"),
            "uploaded_at": doc_info["uploaded_at"].isoformat(),
            "size": doc_info.get("size", 0)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get document status: {str(e)}")

@app.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """
    Delete a specific document
    """
    try:
        await rag_service.delete_document(document_id)
        return {"message": "Document deleted successfully"}
    except Exception as e:
        error_message = str(e)
        if "not found" in error_message.lower():
            raise HTTPException(status_code=404, detail=error_message)
        else:
            raise HTTPException(status_code=500, detail=error_message)

if __name__ == "__main__":
    import uvicorn
    print(f"Starting server on {Config.HOST}:{Config.PORT}")
    print(f"Binding to: 0.0.0.0:8000")
    uvicorn.run(
        app, 
        host="0.0.0.0",  # Force explicit binding
        port=8000,        # Force explicit port
        reload=Config.DEBUG,
        log_level="info",
        access_log=True
    ) 