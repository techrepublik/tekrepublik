import uuid
from typing import Optional
from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)  # IPv4/IPv6 support
    description: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Relationships
    user: Mapped[Optional["User"]] = relationship("User")

class SiteSetting(Base):
    __tablename__ = "site_settings"
    
    key: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    value: Mapped[Optional[dict | list | str | int | float | bool]] = mapped_column(JSONB, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
