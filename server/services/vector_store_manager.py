import os
import pickle
import asyncio
from typing import List, Dict
from datetime import datetime
import torch
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.schema import Document


class VectorStoreManager:
    """
    Manages vector store operations including FAISS, embeddings, and document storage
    """
    
    def __init__(self, embedding_model: str = "BAAI/bge-large-en-v1.5", vector_db_path: str = "vector_store"):
        self.embedding_model_name = embedding_model
        self.vector_db_path = vector_db_path
        self.vector_store = None
        self.embeddings = None
        self.retriever = None
        self.documents = {}  # Store document metadata
        self.is_initialized = False
        
        os.makedirs(vector_db_path, exist_ok=True)
    
    async def initialize(self):
        """Initialize embeddings and load vector store"""
        try:
            
            # Initialize embeddings
            self.embeddings = HuggingFaceEmbeddings(
                model_name=self.embedding_model_name,
                model_kwargs={"device": "cuda" if torch.cuda.is_available() else "cpu"},
                encode_kwargs={
                    'normalize_embeddings': True,
                    'batch_size': 8 # Smaller batches for CPU to avoid memory issues
                } 
            )
            print(f"Loaded embedding model: {self.embedding_model_name}")
            
            # Load vector store
            await self._load_or_create_vector_store()
            
            # Setup retriever
            if self.vector_store:
                self.retriever = self.vector_store.as_retriever(search_kwargs={"k": 5})
            
            self.is_initialized = True
            print("VectorStoreManager initialized successfully")
            
        except Exception as e:
            print(f"Error initializing VectorStoreManager: {str(e)}")
            raise
    
    async def _load_or_create_vector_store(self):
        """Load existing vector store or create new one"""
        paths = {
            'faiss_index': os.path.join(self.vector_db_path, "index.faiss"),
            'faiss_pkl': os.path.join(self.vector_db_path, "index.pkl"),
            'metadata': os.path.join(self.vector_db_path, "metadata.pkl")
        }
        
        # Load existing vector store if available
        if all(os.path.exists(paths[key]) for key in ['faiss_index', 'faiss_pkl', 'metadata']):
            try:
                self.vector_store = await asyncio.to_thread(
                    FAISS.load_local,
                    self.vector_db_path,
                    self.embeddings,
                    allow_dangerous_deserialization=True
                )
                
                # Load metadata
                with open(paths['metadata'], 'rb') as f:
                    self.documents = pickle.load(f)
                
                doc_count = len(self.vector_store.docstore._dict) if self.vector_store else 0
                metadata_count = len(self.documents)
                print(f"✅ Loaded existing vector store with {doc_count} chunks and {metadata_count} documents")
                
            except Exception as e:
                print(f"Error loading existing vector store: {str(e)}")
                await self._create_new_vector_store()
        else:
            await self._create_new_vector_store()
    
    async def _create_new_vector_store(self):
        """Create a new FAISS vector store"""
        dummy_doc = Document(page_content="initialization", metadata={"source": "init"})
        self.vector_store = await asyncio.to_thread(FAISS.from_documents, [dummy_doc], self.embeddings)
        self.vector_store.delete([list(self.vector_store.docstore._dict.keys())[0]])
        self.documents = {}
        print("Created new vector store")
    
    async def add_document(self, document_id: str, chunks: List[Dict], filename: str):
        """Add a document's chunks to the vector store"""
        try:
            if not self.is_initialized:
                await self.initialize()
            
            print(f"Converting {len(chunks)} chunks to LangChain Documents...")
            
            # Convert chunks to LangChain Documents
            documents = [
                Document(
                    page_content=chunk["text"],
                    metadata={
                        "source": filename,
                        "document_id": document_id,
                        "chunk_id": chunk["chunk_id"],
                        "page": chunk.get("page"),
                        "word_count": chunk["word_count"],
                        "char_count": chunk["char_count"],
                        **chunk.get("metadata", {})
                    }
                )
                for chunk in chunks
            ]
            
            print(f"Adding {len(documents)} documents to vector store...")
            
            # Add to vector store
            if self.vector_store is None:
                self.vector_store = await asyncio.to_thread(FAISS.from_documents, documents, self.embeddings)
            else:
                await asyncio.to_thread(self.vector_store.add_documents, documents)
            
            # Store metadata
            self.documents[document_id] = {
                "filename": filename,
                "chunks_count": len(chunks),
                "uploaded_at": datetime.now(),
                "size": sum(chunk["char_count"] for chunk in chunks),
                "status": "ready"
            }
            
            # Update retriever
            if self.vector_store:
                self.retriever = self.vector_store.as_retriever(search_kwargs={"k": 5})
            
            await self._save_vector_store()
            print(f"Added {len(chunks)} chunks from {filename} to vector store")
            
        except Exception as e:
            error_msg = f"Error adding document to vector store: {str(e)}"
            print(f"Err: {error_msg}")
            # Re-raise with more context
            raise Exception(f"Vector store error for {filename}: {str(e)}")
    
    async def search_similar_chunks(self, query: str, k: int = 5) -> List[Dict]:
        """Search for similar chunks using vector store"""
        try:
            if not self.is_initialized or not self.vector_store:
                return []
            
            docs_with_scores = await asyncio.to_thread(
                self.vector_store.similarity_search_with_score, query, k=k
            )
            
            return [
                {
                    "id": f"{doc.metadata.get('document_id', 'unknown')}_{doc.metadata.get('chunk_id', i)}",
                    "text": doc.page_content,
                    "filename": doc.metadata.get("source", "unknown"),
                    "chunk_id": doc.metadata.get("chunk_id", i),
                    "page": doc.metadata.get("page"),
                    "word_count": doc.metadata.get("word_count", len(doc.page_content.split())),
                    "char_count": doc.metadata.get("char_count", len(doc.page_content)),
                    "score": float(score),
                    "metadata": doc.metadata
                }
                for i, (doc, score) in enumerate(docs_with_scores)
            ]
            
        except Exception as e:
            print(f"Error searching similar chunks: {str(e)}")
            return []
    
    async def _save_vector_store(self):
        """Save vector store and metadata to disk"""
        try:
            if self.vector_store:
                await asyncio.to_thread(self.vector_store.save_local, self.vector_db_path)
            
            metadata_path = os.path.join(self.vector_db_path, "metadata.pkl")
            with open(metadata_path, 'wb') as f:
                pickle.dump(self.documents, f)
                
        except Exception as e:
            print(f"Error saving vector store: {str(e)}")
    
    def has_documents(self) -> bool:
        """Check if any documents are loaded"""
        return len(self.documents) > 0
    
    async def get_documents_info(self) -> List[Dict]:
        """Get information about all loaded documents"""
        result = []
        for doc_id, doc_info in self.documents.items():
            try:
                # Handle potential datetime serialization issues
                uploaded_at = doc_info["uploaded_at"]
                if hasattr(uploaded_at, 'isoformat'):
                    uploaded_at_str = uploaded_at.isoformat()
                else:
                    # If it's already a string, use it as is
                    uploaded_at_str = str(uploaded_at)
                
                result.append({
                    "id": doc_id,
                    "filename": doc_info["filename"],
                    "chunks_count": doc_info.get("chunks_count", 0),
                    "uploaded_at": uploaded_at_str,
                    "size": doc_info.get("size", 0),
                    "status": doc_info.get("status", "ready")
                })
            except Exception as e:
                print(f"Error processing document info for {doc_id}: {e}")
                # Skip this document if there's an issue
                continue
        
        return result
    
    async def delete_document(self, document_id: str):
        """Delete a document from the vector store and rebuild index"""
        if document_id not in self.documents:
            raise Exception(f"Document {document_id} not found")
        
        try:
            filename = self.documents[document_id].get("filename", "unknown")
            print(f"Deleting document: {filename} (ID: {document_id})")
            
            # Remove from metadata first
            del self.documents[document_id]
            
            # Handle vector store deletion
            if self.vector_store and hasattr(self.vector_store, 'docstore') and hasattr(self.vector_store.docstore, '_dict'):
                print("Rebuilding vector store without deleted document...")
                
                # Get all documents except those from the document being deleted
                remaining_docs = []
                try:
                    for doc_id, doc in self.vector_store.docstore._dict.items():
                        doc_metadata = doc.metadata if hasattr(doc, 'metadata') else {}
                        if doc_metadata.get('document_id') != document_id:
                            remaining_docs.append(doc)
                    
                    print(f"Keeping {len(remaining_docs)} chunks, removing chunks from {filename}")
                    
                    # Rebuild vector store with remaining documents
                    if remaining_docs:
                        self.vector_store = await asyncio.to_thread(
                            FAISS.from_documents, 
                            remaining_docs, 
                            self.embeddings
                        )
                        # Update retriever
                        self.retriever = self.vector_store.as_retriever(search_kwargs={"k": 5})
                    else:
                        # If no documents remain, create empty vector store
                        await self._create_new_vector_store()
                    
                    print("Vector store rebuilt successfully")
                    
                except Exception as rebuild_error:
                    print(f"Error during vector store rebuild: {str(rebuild_error)}")
                    # Create new empty vector store if rebuild fails
                    await self._create_new_vector_store()
            else:
                print("Vector store not properly initialized, creating new one")
                await self._create_new_vector_store()
            
            # Save updated vector store and metadata
            await self._save_vector_store()
            
            print(f"Document {filename} completely removed from RAG system")
            
        except Exception as e:
            # Restore document metadata if something went wrong after deletion
            if document_id not in self.documents:
                # Try to restore if we have the info
                print(f"Error during deletion, document metadata was removed")
            
            error_msg = f"Failed to delete document {filename}: {str(e)}"
            print(f"Error: {error_msg}")
            raise Exception(error_msg) 