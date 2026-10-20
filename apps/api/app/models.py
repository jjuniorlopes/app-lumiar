from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Integer, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base

class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Organization(TimestampMixin, Base):
    __tablename__ = 'organizations'
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(180), unique=True, index=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    plan: Mapped[str] = mapped_column(String(30), default='starter')
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(40), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    contact_email: Mapped[str | None] = mapped_column(String(180), nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)

    users = relationship('User', back_populates='organization', cascade='all, delete-orphan')
    spaces = relationship('CulturalSpace', back_populates='organization', cascade='all, delete-orphan')
    items = relationship('CulturalItem', back_populates='organization', cascade='all, delete-orphan')

class User(TimestampMixin, Base):
    __tablename__ = 'users'
    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int | None] = mapped_column(ForeignKey('organizations.id'), nullable=True)
    name: Mapped[str] = mapped_column(String(160))
    email: Mapped[str] = mapped_column(String(180), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(40), default='member')
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    last_login: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    organization = relationship('Organization', back_populates='users')
    refresh_tokens = relationship('RefreshToken', back_populates='user', cascade='all, delete-orphan')

class RefreshToken(TimestampMixin, Base):
    """Token de refresh para autenticação de longa duração"""
    __tablename__ = 'refresh_tokens'
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), index=True)
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False)
    
    user = relationship('User', back_populates='refresh_tokens')

class ProductSubscription(TimestampMixin, Base):
    __tablename__ = 'product_subscriptions'
    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey('organizations.id'))
    product_key: Mapped[str] = mapped_column(String(40))
    status: Mapped[str] = mapped_column(String(30), default='active')
    settings: Mapped[dict] = mapped_column(JSON, default=dict)

class AuditLog(Base):
    __tablename__ = 'audit_logs'
    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    actor: Mapped[str] = mapped_column(String(180))
    action: Mapped[str] = mapped_column(String(120))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class CulturalSpace(TimestampMixin, Base):
    __tablename__ = 'cultural_spaces'
    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey('organizations.id'), index=True)
    name: Mapped[str] = mapped_column(String(180))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    floor_plan: Mapped[str | None] = mapped_column(String(255), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    organization = relationship('Organization', back_populates='spaces')
    items = relationship('CulturalItem', back_populates='space', cascade='all, delete-orphan')

class CulturalItem(TimestampMixin, Base):
    __tablename__ = 'cultural_items'
    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey('organizations.id'), index=True)
    space_id: Mapped[int | None] = mapped_column(ForeignKey('cultural_spaces.id'), nullable=True, index=True)
    code: Mapped[str] = mapped_column(String(80), index=True)
    title: Mapped[str] = mapped_column(String(220))
    author: Mapped[str | None] = mapped_column(String(160), nullable=True)
    year: Mapped[str | None] = mapped_column(String(40), nullable=True)
    category: Mapped[str | None] = mapped_column(String(80), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    audio_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    short_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    audio_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    curator_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_reviewed: Mapped[bool] = mapped_column(Boolean, default=False)
    reviewed_by: Mapped[str | None] = mapped_column(String(160), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    qr_token: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    scan_count: Mapped[int] = mapped_column(Integer, default=0)
    active: Mapped[bool] = mapped_column(Boolean, default=True)

    organization = relationship('Organization', back_populates='items')
    space = relationship('CulturalSpace', back_populates='items')
    documents = relationship('ItemDocument', back_populates='item', cascade='all, delete-orphan')

class ItemDocument(TimestampMixin, Base):
    __tablename__ = 'item_documents'
    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey('organizations.id'), index=True)
    item_id: Mapped[int | None] = mapped_column(ForeignKey('cultural_items.id'), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(220))
    file_url: Mapped[str] = mapped_column(String(500))
    extracted_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    doc_metadata: Mapped[dict] = mapped_column(JSON, default=dict)
    
    item = relationship('CulturalItem', back_populates='documents')
