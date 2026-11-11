import datetime
import json
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from app.config import settings

# Engine configuration (works with PostgreSQL and SQLite)
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(settings.DATABASE_URL, connect_args=connect_args, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class CustomerAccount(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    salesforce_id = Column(String(50), unique=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    phone = Column(String(30))
    tier = Column(String(30), default="Standard")  # Standard, Gold, Enterprise
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    orders = relationship("Order", back_populates="customer")
    cases = relationship("SupportCase", back_populates="customer")

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    status = Column(String(40), default="Processing")  # Processing, Shipped, Delivered, Cancelled
    total_amount = Column(Float, nullable=False)
    items_json = Column(Text, default="[]")  # JSON string of items
    shipping_address = Column(String(255), default="123 Market St, San Francisco, CA")
    tracking_number = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    customer = relationship("CustomerAccount", back_populates="orders")
    refunds = relationship("RefundRequest", back_populates="order")

class RefundRequest(Base):
    __tablename__ = "refund_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    amount = Column(Float, nullable=False)
    reason = Column(String(255), nullable=False)
    status = Column(String(40), default="PENDING_APPROVAL")  # PENDING_APPROVAL, APPROVED, REJECTED
    requires_human_approval = Column(Boolean, default=True)
    approved_by = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    order = relationship("Order", back_populates="refunds")

class SupportCase(Base):
    __tablename__ = "support_cases"
    
    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String(50), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    subject = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(30), default="Medium")  # Low, Medium, High, Critical
    status = Column(String(40), default="Open")  # Open, In Progress, Escalated, Closed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    customer = relationship("CustomerAccount", back_populates="cases")

class ConversationSession(Base):
    __tablename__ = "conversation_sessions"
    
    id = Column(String(64), primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_active = Column(DateTime, default=datetime.datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    action = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    latency_ms = Column(Float, default=0.0)
    session_id = Column(String(64), nullable=True)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

