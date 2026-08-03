import json
import math
import urllib.request
import uuid
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from datetime import datetime

from app.models.content import ContentItem
from app.models.ai import AIRetrievalChunk, AIConversation, AIMessage, AIMessageSource, AIPromptTemplate, AIPromptVersion
from app.core.tasks import get_embedding

OLLAMA_CHAT_URL = "http://ollama:11434/api/chat"
OLLAMA_MODELS_URL = "http://ollama:11434/api/tags"
DEFAULT_MODEL = "llama3.2:1b"

# --- Cosine Similarity Helpers ---
def dot_product(v1: List[float], v2: List[float]) -> float:
    return sum(a * b for a, b in zip(v1, v2))

def magnitude(v: List[float]) -> float:
    return math.sqrt(sum(a * a for a in v))

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    mag1 = magnitude(v1)
    mag2 = magnitude(v2)
    if not mag1 or not mag2:
        return 0.0
    return dot_product(v1, v2) / (mag1 * mag2)

# --- Fallback Ollama Model Discovery ---
def get_available_ollama_model() -> str:
    """
    Fetch the list of installed models from Ollama to pick an active one.
    Falls back to 'llama3.2:1b' or 'mistral' if requests fail.
    """
    try:
        req = urllib.request.Request(OLLAMA_MODELS_URL, method="GET")
        with urllib.request.urlopen(req, timeout=4.0) as response:
            data = json.loads(response.read().decode("utf-8"))
            models = data.get("models", [])
            if models:
                generation_models = [m for m in models if "embed" not in m.get("name", "").lower()]
                if generation_models:
                    return generation_models[0].get("name", DEFAULT_MODEL)
    except Exception:
        pass
    return DEFAULT_MODEL

# --- Grounding Context Search ---
def search_relevant_chunks(db: Session, query_text: str, limit: int = 3) -> List[Dict[str, Any]]:
    """
    Find relevant grounding chunks using hybrid search:
    1. Try vector Cosine Similarity if nomic-embed-text is available.
    2. Fall back to keyword matching (ILIKE) on database chunk texts.
    """
    # 1. Fetch query embedding
    query_vector = get_embedding(query_text)
    
    chunks_with_score = []
    
    if query_vector:
        # Load all chunks that have embeddings and belong to published content items
        db_chunks = db.query(AIRetrievalChunk).join(ContentItem).filter(
            ContentItem.status == "published",
            AIRetrievalChunk.search_vector != None
        ).all()
        
        for c in db_chunks:
            if c.search_vector and len(c.search_vector) == len(query_vector):
                score = cosine_similarity(query_vector, c.search_vector)
                chunks_with_score.append((c, score))
                
        # Sort by similarity score descending
        chunks_with_score.sort(key=lambda x: x[1], reverse=True)
        chunks_with_score = chunks_with_score[:limit]
    
    # 2. Keyword fallback if no vector matches were found
    if not chunks_with_score:
        # Split search query into lowercase keywords of 3+ letters to search
        words = [w.strip().lower() for w in query_text.split(" ") if len(w.strip()) > 2]
        if words:
            # Build dynamic keyword filters
            filters = []
            for w in words:
                filters.append(AIRetrievalChunk.chunk_text.ilike(f"%{w}%"))
            
            db_chunks = db.query(AIRetrievalChunk).join(ContentItem).filter(
                ContentItem.status == "published"
            ).filter(
                # Match any keyword filter
                *filters
            ).limit(limit).all()
            
            for c in db_chunks:
                chunks_with_score.append((c, 0.85))  # High fallback score
                
    # 3. Format result
    results = []
    for c, score in chunks_with_score:
        # Load content item to create dynamic citation URLs
        item = db.query(ContentItem).filter(ContentItem.id == c.content_id).first()
        if item:
            results.append({
                "chunk": c,
                "score": score,
                "title": item.title,
                "url": f"/{item.content_type}s/{item.slug}",
                "content_id": item.id
            })
            
    return results

# --- Main Prompt Generation & Inference Trigger ---
def generate_assistant_reply(db: Session, conversation_id: uuid.UUID, user_message: str) -> Dict[str, Any]:
    """
    RAG grounding assistant engine: retrieves context chunks,
    generates system prompt template, queries Ollama chat container,
    and stores messages history and citation links.
    """
    # 1. Retrieve Conversation
    conversation = db.query(AIConversation).filter(AIConversation.id == conversation_id).first()
    if not conversation:
        raise ValueError("Conversation session not found")

    # 2. Retrieve grounded RAG context chunks
    matched_sources = search_relevant_chunks(db, user_message, limit=3)
    context_str = ""
    if matched_sources:
        context_str = "\n\n".join([
            f"Source [{i+1}]: {src['title']} ({src['url']})\n{src['chunk'].chunk_text}"
            for i, src in enumerate(matched_sources)
        ])

    # 3. Retrieve system prompt template
    system_prompt = (
        "You are Joseph Lorilla's offline AI Assistant. Answer questions professionally "
        "and guide developers using Joseph's digital platform tutorials and case studies. "
        "Always ground your responses inside the provided context when applicable."
    )
    prompt_version_id = None
    
    # Try finding active template key
    template = db.query(AIPromptTemplate).filter(AIPromptTemplate.key == "public_assistant").first()
    if template and template.active_version_id:
        version = db.query(AIPromptVersion).filter(AIPromptVersion.id == template.active_version_id).first()
        if version:
            system_prompt = version.system_prompt
            prompt_version_id = version.id

    # 4. Construct recent chat history
    recent_messages = db.query(AIMessage).filter(
        AIMessage.conversation_id == conversation_id,
        AIMessage.status == "success"
    ).order_by(AIMessage.created_at.asc()).limit(8).all()
    
    history_payload = []
    for msg in recent_messages:
        history_payload.append({
            "role": msg.role,
            "content": msg.content
        })

    # 5. Assemble system message with retrieval context injected
    full_system_prompt = system_prompt
    if context_str:
        full_system_prompt += f"\n\nUse the following verified context sections for grounding your answer:\n{context_str}"

    # 6. Query Ollama chat API
    active_model = get_available_ollama_model()
    messages_payload = [{"role": "system", "content": full_system_prompt}]
    messages_payload.extend(history_payload)
    messages_payload.append({"role": "user", "content": user_message})

    payload = {
        "model": active_model,
        "messages": messages_payload,
        "stream": False
    }

    assistant_reply = "I apologize, but I could not connect to Joseph's offline AI agent model right now. Please try again shortly."
    latency_seconds = 0.0
    start_time = datetime.now()

    try:
        req = urllib.request.Request(
            OLLAMA_CHAT_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=60.0) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            assistant_reply = res_data.get("message", {}).get("content", assistant_reply)
            latency_seconds = (datetime.now() - start_time).total_seconds()
    except Exception as e:
        print(f"Ollama chat query failed: {str(e)}")

    # 7. Write messages in Database
    # Save User message
    user_msg_db = AIMessage(
        conversation_id=conversation_id,
        role="user",
        content=user_message,
        model=active_model,
        prompt_version_id=prompt_version_id,
        status="success"
    )
    db.add(user_msg_db)
    db.flush()

    # Save Assistant message
    assistant_msg_db = AIMessage(
        conversation_id=conversation_id,
        role="assistant",
        content=assistant_reply,
        model=active_model,
        prompt_version_id=prompt_version_id,
        latency=latency_seconds,
        status="success"
    )
    db.add(assistant_msg_db)
    db.flush()

    # 8. Record Citations (Message sources)
    citations = []
    for i, src in enumerate(matched_sources):
        source_db = AIMessageSource(
            message_id=assistant_msg_db.id,
            content_id=src["content_id"],
            chunk_id=src["chunk"].id,
            source_url=src["url"],
            source_title=src["title"],
            relevance_score=src["score"],
            citation_order=i+1
        )
        db.add(source_db)
        citations.append({
            "title": src["title"],
            "url": src["url"],
            "order": i+1
        })
        
    db.commit()

    return {
        "reply": assistant_reply,
        "model": active_model,
        "citations": citations
    }
