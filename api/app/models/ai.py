from __future__ import annotations
import uuid
from sqlalchemy import String, Boolean, ForeignKey, Integer, Float, Text
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class AIProvider(Base):
    __tablename__ = "ai_providers"
    
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    base_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    priority: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    settings_jsonb: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    
    # Relationships
    models: Mapped[list["AIModel"]] = relationship("AIModel", back_populates="provider", cascade="all, delete-orphan")

class AIModel(Base):
    __tablename__ = "ai_models"
    
    provider_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("ai_providers.id", ondelete="CASCADE"), nullable=False)
    model_key: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    model_type: Mapped[str] = mapped_column(String(50), nullable=False)  # chat, embedding, reranker
    context_size: Mapped[int] = mapped_column(Integer, default=4096, nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    supports_streaming: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    supports_structured_output: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    supports_embeddings: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    cost_metadata: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    
    # Relationships
    provider: Mapped["AIProvider"] = relationship("AIProvider", back_populates="models")

class AIPromptTemplate(Base):
    __tablename__ = "ai_prompt_templates"
    
    key: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    active_version_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    allowed_roles: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    task_type: Mapped[str] = mapped_column(String(50), index=True, nullable=False)  # e.g., public_assistant, outline_generator

class AIPromptVersion(Base):
    __tablename__ = "ai_prompt_versions"
    
    prompt_template_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("ai_prompt_templates.id", ondelete="CASCADE"), nullable=False)
    version_number: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    system_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    user_template: Mapped[str] = mapped_column(Text, nullable=False)
    output_schema: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    model_settings: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="draft", nullable=False)  # draft, active, archived

class AIConversation(Base):
    __tablename__ = "ai_conversations"
    
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    anonymous_session_id: Mapped[str | None] = mapped_column(String(255), index=True, nullable=True)
    conversation_type: Mapped[str] = mapped_column(String(50), default="chat", nullable=False)
    title: Mapped[str] = mapped_column(String(255), default="New Conversation", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)
    related_content_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("content_items.id", ondelete="SET NULL"), nullable=True)
    
    # Relationships
    messages: Mapped[list["AIMessage"]] = relationship("AIMessage", back_populates="conversation", cascade="all, delete-orphan")

class AIMessage(Base):
    __tablename__ = "ai_messages"
    
    conversation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False)  # user, assistant, system
    content: Mapped[str] = mapped_column(Text, nullable=False)
    model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    prompt_version_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("ai_prompt_versions.id", ondelete="SET NULL"), nullable=True)
    token_counts: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    latency: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="success", nullable=False)
    safety_classification: Mapped[str | None] = mapped_column(String(100), nullable=True)
    
    # Relationships
    conversation: Mapped["AIConversation"] = relationship("AIConversation", back_populates="messages")
    sources: Mapped[list["AIMessageSource"]] = relationship("AIMessageSource", back_populates="message", cascade="all, delete-orphan")

class AIMessageSource(Base):
    __tablename__ = "ai_message_sources"
    
    message_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("ai_messages.id", ondelete="CASCADE"), primary_key=True)
    content_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("content_items.id", ondelete="SET NULL"), nullable=True)
    chunk_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("ai_retrieval_chunks.id", ondelete="SET NULL"), nullable=True)
    source_url: Mapped[str] = mapped_column(String(255), nullable=False)
    source_title: Mapped[str] = mapped_column(String(255), nullable=False)
    relevance_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    citation_order: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Relationships
    message: Mapped["AIMessage"] = relationship("AIMessage", back_populates="sources")

class AIUsageRecord(Base):
    __tablename__ = "ai_usage_records"
    
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    anonymous_session_id: Mapped[str | None] = mapped_column(String(255), index=True, nullable=True)
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    task_type: Mapped[str] = mapped_column(String(50), nullable=False)
    input_tokens: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    output_tokens: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_tokens: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    estimated_cost: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    duration: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    success: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    error_code: Mapped[str | None] = mapped_column(String(100), nullable=True)

class AIFeedback(Base):
    __tablename__ = "ai_feedback"
    
    message_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("ai_messages.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str | None] = mapped_column(String(100), nullable=True)
    comment: Mapped[str | None] = mapped_column(String(500), nullable=True)

class AIRetrievalChunk(Base):
    __tablename__ = "ai_retrieval_chunks"
    
    content_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("content_items.id", ondelete="CASCADE"), nullable=False)
    section_heading: Mapped[str | None] = mapped_column(String(255), nullable=True)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    chunk_text: Mapped[str] = mapped_column(Text, nullable=False)
    token_estimate: Mapped[int] = mapped_column(Integer, nullable=False)
    access_level: Mapped[str] = mapped_column(String(50), default="public", nullable=False)
    content_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    checksum: Mapped[str] = mapped_column(String(100), nullable=False)
    search_vector: Mapped[list[float] | None] = mapped_column(ARRAY(Float), nullable=True)
