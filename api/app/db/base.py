# Import all the models, so that Base has them before being imported by Alembic env.py
from app.db.base_class import Base  # noqa
from app.models.user import User, Profile, Role, Permission, RefreshToken, role_permissions  # noqa
from app.models.content import Category, Tag, ContentItem, ContentRevision, ContentRelation, content_categories, content_tags  # noqa
from app.models.media import MediaFile, content_media  # noqa
from app.models.resources import Resource, ResourceFile, ResourceDownload, content_resources  # noqa
from app.models.products import Product, Order, OrderItem, Payment, AccessEntitlement, product_resources  # noqa
from app.models.ai import AIProvider, AIModel, AIPromptTemplate, AIPromptVersion, AIConversation, AIMessage, AIMessageSource, AIUsageRecord, AIFeedback, AIRetrievalChunk  # noqa
from app.models.audit import AuditLog, SiteSetting  # noqa
