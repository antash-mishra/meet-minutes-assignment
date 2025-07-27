import os
from typing import List, Dict, Tuple
import asyncio
from langchain_openai import ChatOpenAI
from langchain.chat_models import init_chat_model
from langchain.schema import Document
from langchain_core.runnables.config import RunnableConfig

from .vector_store_manager import VectorStoreManager
from .graph_builder import GraphBuilder, ConversationState

class RAGService:
    """
    RAG (Retrieval-Augmented Generation) service orchestrator
    Coordinates vector store, session management, and LangGraph components
    """
    
    def __init__(self, 
                 embedding_model: str = "Qwen/Qwen3-Embedding-4B",
                 vector_db_path: str = "vector_store",
                 api_key: str = None):
        
        # Initialize components
        self.vector_store_manager = VectorStoreManager(embedding_model, vector_db_path)
        
        # Initialize OpenAI LLM
        # (Assuming ChatOpenAI is imported or handled within GraphBuilder)
        import os
        
        api_key = api_key or os.getenv("GROQ_API_KEY")
        self.llm = None
        if api_key:
            try:
                self.llm = init_chat_model("qwen/qwen3-32b", model_provider="groq", api_key=api_key)
            except Exception as e:
                print(f"Failed to initialize OpenAI LLM: {e}")
        
        # Initialize graph builder
        self.graph_builder = GraphBuilder(self.llm)
        self.is_initialized = False
    
    async def initialize(self):
        """Initialize the RAG service components"""
        try:
            print("Initializing RAG service components...")
            
            # Initialize vector store manager
            await self.vector_store_manager.initialize()
            
            # Update graph builder with retriever
            if self.vector_store_manager.retriever:
                self.graph_builder.update_retriever(self.vector_store_manager.retriever)
            
            self.is_initialized = True
            print("RAG service initialized successfully")
            
        except Exception as e:
            print(f"Error initializing RAG service: {str(e)}")
            raise
    
    # Delegate to VectorStoreManager
    @property
    def documents(self):
        """Access to document metadata"""
        return self.vector_store_manager.documents
    
    async def clear_session(self, session_id: str):
        """Clear conversation history for a specific session"""
        self.graph_builder.clear_session_graph(session_id)
    
    async def add_document(self, document_id: str, chunks: List[Dict], filename: str):
        """Add a document's chunks to the vector store"""
        await self.vector_store_manager.add_document(document_id, chunks, filename)
        
        # Update graph builder with new retriever
        if self.vector_store_manager.retriever:
            self.graph_builder.update_retriever(self.vector_store_manager.retriever)
            
    async def generate_answer_with_graph(self, query: str, session_id: str = "default") -> Dict:
        """
        Generate answer and retrieve sources using the full LangGraph workflow.
        This is now the primary method for handling chat requests.
        """
        try:
            if not self.llm or not self.vector_store_manager.has_documents():
                raise Exception(
                    "RAG service is not ready. Ensure documents are uploaded and OpenAI API key is configured."
                )

            # Get the session-specific graph
            graph = self.graph_builder.get_or_create_session_graph(session_id)
            
            # Define the inputs and configuration for the graph
            inputs = {"question": query}
            config: RunnableConfig = {"configurable": {"thread_id": session_id}}

            # Invoke the graph asynchronously
            final_state: ConversationState = await graph.ainvoke(inputs, config)

            # Format the sources from the final state's context
            sources = []
            if final_state.get("context"):
                for i, doc in enumerate(final_state["context"]):
                    score = final_state["scores"][i] if final_state.get("scores") and i < len(final_state["scores"]) else 0.0
                    sources.append({
                        "id": str(i),
                        "documentName": doc.metadata.get("source", "Unknown"),
                        "content": doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
                        "page": doc.metadata.get("page"),
                        "relevanceScore": score
                    })

            return {
                "answer": final_state.get("answer", "No answer generated."),
                "sources": sources
            }

        except Exception as e:
            print(f"Error generating answer with graph: {str(e)}")
            raise
            
    # Session management methods
    @property
    def session_graphs(self):
        """Access to session graphs for backward compatibility"""
        return self.graph_builder.session_graphs
    
    def has_documents(self) -> bool:
        """Check if any documents are loaded"""
        return self.vector_store_manager.has_documents()
    
    async def get_documents_info(self) -> List[Dict]:
        """Get information about all loaded documents"""
        return await self.vector_store_manager.get_documents_info()
    
    async def delete_document(self, document_id: str):
        """Delete a document from the vector store and update graph builder"""
        await self.vector_store_manager.delete_document(document_id)
        
        # Update graph builder with new retriever after deletion
        if self.vector_store_manager.retriever:
            self.graph_builder.update_retriever(self.vector_store_manager.retriever) 