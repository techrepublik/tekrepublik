import uuid
from typing import Optional
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, ForeignKey, Table, Column, Float, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

# Association table for Product-Resources many-to-many relationship
product_resources = Table(
    "product_resources",
    Base.metadata,
    Column("product_id", UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), primary_key=True),
    Column("resource_id", UUID(as_uuid=True), ForeignKey("resources.id", ondelete="CASCADE"), primary_key=True),
)

class Product(Base):
    __tablename__ = "products"
    
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    price: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Relationships
    resources: Mapped[list["Resource"]] = relationship("Resource", secondary=product_resources)

class Order(Base):
    __tablename__ = "orders"
    
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending", index=True, nullable=False)  # pending, paid, cancelled, refunded
    total_amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    tracking_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    
    # Relationships
    user: Mapped["User"] = relationship("User")
    items: Mapped[list["OrderItem"]] = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payments: Mapped[list["Payment"]] = relationship("Payment", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"
    
    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    
    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="items")
    product: Mapped["Product"] = relationship("Product")

class Payment(Base):
    __tablename__ = "payments"
    
    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    payment_method: Mapped[str] = mapped_column(String(50), nullable=False)  # manual_bank, paypal, Stripe
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)  # pending, verified, rejected
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    transaction_id: Mapped[Optional[str]] = mapped_column(String(255), unique=True, index=True, nullable=True)
    proof_filepath: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # receipt upload path
    
    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="payments")

class AccessEntitlement(Base):
    __tablename__ = "access_entitlements"
    
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content_item_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("content_items.id", ondelete="CASCADE"), nullable=True)
    resource_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("resources.id", ondelete="CASCADE"), nullable=True)
    product_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=True)
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)  # NULL = lifetime
    
    # Relationships
    user: Mapped["User"] = relationship("User")
    content_item: Mapped[Optional["ContentItem"]] = relationship("ContentItem")
    resource: Mapped[Optional["Resource"]] = relationship("Resource")
    product: Mapped[Optional["Product"]] = relationship("Product")
