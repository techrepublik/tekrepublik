import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.ai import AIConversation, AIMessage
from app.core.deps import get_current_user_optional
from app.services.ai_agent import generate_assistant_reply

router = APIRouter()

# --- Pydantic Schemas ---
class StartConversationRequest(BaseModel):
    anonymous_session_id: Optional[str] = None
    related_content_id: Optional[uuid.UUID] = None

class MessageSendRequest(BaseModel):
    message: str

class CitationResponse(BaseModel):
    title: str
    url: str
    order: int

class MessageResponse(BaseModel):
    id: uuid.UUID
    role: str
    content: str
    created_at: str
    citations: List[CitationResponse] = []

# --- Endpoints ---

@router.post("/conversations", response_model=None)
def create_conversation(
    req: StartConversationRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Create a new AI Assistant conversation session linked to an authenticated user
    or an anonymous tracking cookie ID.
    """
    db_conv = AIConversation(
        user_id=current_user.id if current_user else None,
        anonymous_session_id=req.anonymous_session_id,
        conversation_type="chat",
        title="New Chat Session",
        related_content_id=req.related_content_id
    )
    db.add(db_conv)
    db.commit()
    db.refresh(db_conv)

    return {
        "success": True,
        "data": {
            "id": db_conv.id,
            "title": db_conv.title,
            "status": db_conv.status,
            "created_at": db_conv.created_at
        },
        "meta": {},
        "error": None
    }

@router.post("/conversations/{conversation_id}/messages", response_model=None)
def send_message(
    conversation_id: uuid.UUID,
    req: MessageSendRequest,
    db: Session = Depends(get_db)
):
    """
    Post a new user query to the conversation session, trigger Ollama grounding search,
    and return the response reply together with citations list.
    """
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message content cannot be blank")
        
    try:
        reply_data = generate_assistant_reply(db, conversation_id, req.message)
        return {
            "success": True,
            "data": {
                "reply": reply_data["reply"],
                "model": reply_data["model"],
                "citations": reply_data["citations"]
            },
            "meta": {},
            "error": None
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Assistant failed to compile answer: {str(e)}"
        )

@router.get("/conversations/{conversation_id}", response_model=None)
def get_conversation_messages(
    conversation_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    """
    Retrieve message logs for a given conversation.
    """
    conv = db.query(AIConversation).filter(AIConversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation session not found")
        
    messages = db.query(AIMessage).filter(
        AIMessage.conversation_id == conversation_id,
        AIMessage.status == "success"
    ).order_by(AIMessage.created_at.asc()).all()
    
    formatted = []
    for m in messages:
        citations = []
        for src in m.sources:
            citations.append(
                CitationResponse(
                    title=src.source_title,
                    url=src.source_url,
                    order=src.citation_order
                )
            )
            
        formatted.append(
            MessageResponse(
                id=m.id,
                role=m.role,
                content=m.content,
                created_at=m.created_at.isoformat(),
                citations=citations
            )
        )
        
    return {
        "success": True,
        "data": {
            "id": conv.id,
            "title": conv.title,
            "messages": formatted
        },
        "meta": {"count": len(formatted)},
        "error": None
    }
