from typing import Dict, List, Tuple
from langchain_openai import ChatOpenAI
from langchain_core.language_models.chat_models import BaseChatModel
from langchain.schema import Document, HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langgraph.graph import START, END, StateGraph
from langgraph.checkpoint.memory import MemorySaver
from typing_extensions import TypedDict


# State definition for LangGraph
class ConversationState(TypedDict):
    """State for conversation with memory"""
    question: str
    chat_history: List[Tuple[str, str]]  # List of (human, ai) message pairs
    context: List[Document]
    answer: str
    scores: List[float]


class GraphBuilder:
    """
    Builds and manages LangGraph workflows for RAG conversations with built-in persistence
    """
    
    def __init__(self, llm: BaseChatModel, retriever=None):
        self.llm = llm
        self.retriever = retriever
        self.session_graphs = {}  # Store LangGraph instances per session
        self.memory_saver = MemorySaver()  # LangGraph's built-in persistence
    
    def create_rag_graph(self, session_id: str) -> StateGraph:
        """Create a LangGraph for RAG with conversation memory"""
        
        # Prompts
        contextualize_prompt = ChatPromptTemplate.from_messages([
            ("system", "Given a chat history and the latest user question which might reference context in the chat history, formulate a standalone question which can be understood without the chat history. Do NOT answer the question, just reformulate it."),
            MessagesPlaceholder("chat_history"),
            ("human", "{question}"),
        ])
        
        qa_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an experienced insurance policy analyst and advisor. Your expertise includes interpreting policy terms, coverage details, deductibles, exclusions, and claim procedures. Use the following retrieved context from insurance documents to provide accurate, professional answers. Always cite specific policy sections when possible. If information is not available in the provided context, clearly state 'This information is not available in the uploaded documents.' Keep responses clear and professional, using 2-4 sentences.\n\n{context}"),
            MessagesPlaceholder("chat_history"),
            ("human", "{question}"),
        ])
        
        # Graph nodes
        def contextualize_question(state: ConversationState) -> Dict:
            history = state.get("chat_history", [])
            if not history:
                return {"question": state["question"], "chat_history": []}
            
            messages = []
            for human, ai in history:
                messages.extend([HumanMessage(content=human), AIMessage(content=ai)])
            
            contextualized = contextualize_prompt | self.llm | StrOutputParser()
            reformulated = contextualized.invoke({
                "chat_history": messages,
                "question": state["question"]
            })
            return {"question": reformulated}
        
        def retrieve(state: ConversationState) -> Dict:
            """Retrieve documents and their relevance scores."""
            if self.retriever and hasattr(self.retriever, 'vectorstore'):
                docs_with_scores = self.retriever.vectorstore.similarity_search_with_score(
                    state["question"], k=5
                )
                docs = [doc for doc, score in docs_with_scores]
                # Ensure scores are built-in Python float (msgpack-serialisable)
                scores = [float(score) for doc, score in docs_with_scores]
                return {"context": docs, "scores": scores}
            
            # Fallback if retriever doesn't support scoring
            if self.retriever:
                docs = self.retriever.invoke(state["question"])
                return {"context": docs, "scores": []}
                
            return {"context": [], "scores": []}
        
        def generate_answer(state: ConversationState) -> Dict:
            history = state.get("chat_history", [])
            messages = []
            for human, ai in history:
                messages.extend([HumanMessage(content=human), AIMessage(content=ai)])
            
            context_text = "\n\n".join(doc.page_content for doc in state["context"])
            chain = qa_prompt | self.llm | StrOutputParser()
            answer = chain.invoke({
                "chat_history": messages,
                "question": state["question"],
                "context": context_text
            })
            
            # Update chat history with new conversation turn
            updated_history = history + [(state["question"], answer)]
            
            return {
                "answer": answer,
                "chat_history": updated_history  # LangGraph will persist this automatically
            }
        
        # Build graph
        workflow = StateGraph(ConversationState)
        workflow.add_node("contextualize", contextualize_question)
        workflow.add_node("retrieve", retrieve)
        workflow.add_node("generate", generate_answer)
        workflow.add_edge(START, "contextualize")
        workflow.add_edge("contextualize", "retrieve")
        workflow.add_edge("retrieve", "generate")
        
        workflow.add_edge("generate", END)
        
        # Add checkpointing for persistence
        return workflow.compile(checkpointer=self.memory_saver)
    
    def get_or_create_session_graph(self, session_id: str) -> StateGraph:
        """Get or create a LangGraph instance for a specific session"""
        if session_id not in self.session_graphs:
            self.session_graphs[session_id] = self.create_rag_graph(session_id)
            print(f"Created new RAG graph for session: {session_id}")
        return self.session_graphs[session_id]
    
    def update_retriever(self, retriever):
        """Update the retriever for all future graphs"""
        self.retriever = retriever
        # Clear existing graphs so they get recreated with new retriever
        self.session_graphs.clear()