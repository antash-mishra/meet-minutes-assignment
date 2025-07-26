import os
import asyncio
from typing import List, Dict
from pathlib import Path

from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.schema import Document

class DocumentProcessor:
    """
    Service for processing documents using LangChain
    Handles document loading and intelligent chunking with LangChain loaders and splitters
    """
    
    def __init__(self, chunk_size: int = 1000, overlap: int = 200):
        self.chunk_size = chunk_size
        self.overlap = overlap
        
        # Initialize LangChain text splitter
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=overlap,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
    
    async def load_documents(self, file_path: str) -> List[Document]:
        """
        Load documents using LangChain loaders
        """
        file_extension = Path(file_path).suffix.lower()
        filename = Path(file_path).name
        
        try:
            print(f"🔄 Loading {file_extension} file: {filename}")
            
            if file_extension == '.pdf':
                loader = PyPDFLoader(file_path)
            elif file_extension == '.txt':
                loader = TextLoader(file_path, encoding='utf-8')
            else:
                raise ValueError(f"Unsupported file type: {file_extension}")
            
            # Load documents asynchronously
            documents = await asyncio.to_thread(loader.load)
            print(f"✅ Successfully loaded {len(documents)} pages from {filename}")
            return documents
            
        except Exception as e:
            error_msg = f"Error loading document {filename}: {str(e)}"
            print(f"❌ {error_msg}")
            raise Exception(error_msg)
    
    async def chunk_documents(self, file_path: str, filename: str) -> List[Dict[str, any]]:
        """
        Load and chunk documents using LangChain
        """
        try:
            print(f"🔄 Loading document: {filename}")
            
            # Load documents using LangChain loaders
            documents = await self.load_documents(file_path)
            print(f"✅ Loaded {len(documents)} document pages")
            
            # Split documents into chunks
            chunks = []
            for i, doc in enumerate(documents):
                print(f"🔄 Chunking page {i+1}/{len(documents)}...")
                
                # Split the document content
                split_docs = self.text_splitter.split_documents([doc])
                
                # Convert to our format
                for j, chunk_doc in enumerate(split_docs):
                    chunk_data = self._create_chunk_from_document(
                        chunk_doc, 
                        j, 
                        filename
                    )
                    chunks.append(chunk_data)
                
                print(f"✅ Page {i+1} split into {len(split_docs)} chunks")
            
            print(f"✅ Total chunks created: {len(chunks)}")
            return chunks
            
        except Exception as e:
            error_msg = f"Error chunking documents for {filename}: {str(e)}"
            print(f"❌ {error_msg}")
            raise Exception(error_msg)
    
    def _create_chunk_from_document(self, doc: Document, chunk_id: int, filename: str) -> Dict[str, any]:
        """
        Create a chunk object from LangChain Document with metadata
        """
        text = doc.page_content
        metadata = doc.metadata
        
        # Extract page number from metadata if available
        page_number = metadata.get('page', None)
        if page_number is not None:
            # LangChain PDF loader uses 0-based indexing, convert to 1-based
            page_number = page_number + 1 if isinstance(page_number, int) else page_number
        
        return {
            "id": f"{filename}_{chunk_id}",
            "text": text.strip(),
            "filename": filename,
            "chunk_id": chunk_id,
            "page": page_number,
            "word_count": len(text.split()),
            "char_count": len(text),
            "metadata": metadata
        }