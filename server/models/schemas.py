from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ChatRequest(BaseModel):
    """Request model for chat endpoint"""
    message: str
    session_id: Optional[str] = "default"  # For conversation continuity

class DocumentSource(BaseModel):
    """Document source information"""
    id: str
    documentName: str
    content: str
    page: Optional[int] = None
    relevanceScore: Optional[float] = None

class ChatResponse(BaseModel):
    """Response model for chat endpoint"""
    success: bool
    answer: str
    sources: List[DocumentSource] = []
    error: Optional[str] = None

class UploadResponse(BaseModel):
    """Response model for upload endpoint"""
    success: bool
    message: str
    documents: Optional[List[dict]] = None
    error: Optional[str] = None

 