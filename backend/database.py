from sqlalchemy import (
    create_engine, Column, Integer, String, Float,
    Boolean, DateTime, ForeignKey, Enum, Text, Index
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.dialects.postgresql import UUID
import datetime
import uuid
import enum
from config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,          # drop stale connections
    pool_size=10,
    max_overflow=20,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ── Enums ──────────────────────────────────────────────────────────────────────

class AccountType(str, enum.Enum):
    tourist = "tourist"
    business = "business"
    admin = "admin"

class BookingStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    minted = "minted"
    cancelled = "cancelled"

class ResaleStatus(str, enum.Enum):
    active = "active"
    sold = "sold"
    cancelled = "cancelled"

class EsimStatus(str, enum.Enum):
    available = "available"
    rented = "rented"
    maintenance = "maintenance"

class RentalStatus(str, enum.Enum):
    active = "active"
    returned = "returned"
    overdue = "overdue"
    forfeited = "forfeited"


# ── Models ─────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    account_type = Column(Enum(AccountType), default=AccountType.tourist, nullable=False)
    wallet_address = Column(String(44), unique=True, nullable=True)  # Solana pubkey = 44 chars
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    bookings = relationship("Booking", back_populates="user", cascade="all, delete-orphan")
    esim_rentals = relationship("EsimRental", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")


class Activity(Base):
    """Events/activities that can be booked as NFT tickets."""
    __tablename__ = "activities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String(255), nullable=False)
    price_sol = Column(Float, nullable=False)
    total_seats = Column(Integer, nullable=False)
    booked_seats = Column(Integer, default=0)
    event_date = Column(DateTime, nullable=False)
    image_url = Column(String(512), nullable=True)
    business_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    bookings = relationship("Booking", back_populates="activity")

    @property
    def seats_available(self):
        return self.total_seats - self.booked_seats


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    activity_id = Column(UUID(as_uuid=True), ForeignKey("activities.id"), nullable=False)
    price_paid_sol = Column(Float, nullable=False)
    status = Column(Enum(BookingStatus), default=BookingStatus.pending, nullable=False)
    nft_mint_address = Column(String(44), unique=True, nullable=True)
    solana_tx_hash = Column(String(88), nullable=True)
    booked_at = Column(DateTime, default=datetime.datetime.utcnow)
    confirmed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="bookings")
    activity = relationship("Activity", back_populates="bookings")
    resale_listing = relationship("ResaleListing", back_populates="booking", uselist=False)

    # Prevent duplicate confirmed bookings for same user + activity
    __table_args__ = (
        Index("ix_booking_user_activity", "user_id", "activity_id"),
    )


class ResaleListing(Base):
    __tablename__ = "resale_listings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id"), unique=True, nullable=False)
    seller_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    asking_price_sol = Column(Float, nullable=False)
    status = Column(Enum(ResaleStatus), default=ResaleStatus.active, nullable=False)
    buyer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    escrow_address = Column(String(44), nullable=True)    # on-chain escrow PDA
    sale_tx_hash = Column(String(88), nullable=True)
    listed_at = Column(DateTime, default=datetime.datetime.utcnow)
    sold_at = Column(DateTime, nullable=True)

    booking = relationship("Booking", back_populates="resale_listing")
    seller = relationship("User", foreign_keys=[seller_id])
    buyer = relationship("User", foreign_keys=[buyer_id])


# ── eSIM Models ────────────────────────────────────────────────────────────────

class Esim(Base):
    __tablename__ = "esims"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    iccid = Column(String(22), unique=True, index=True, nullable=False)   # telecom unique ID
    nft_mint_address = Column(String(44), unique=True, nullable=True)     # on-chain NFT
    provider = Column(String(50), nullable=False, default="NTC")
    data_total_gb = Column(Float, nullable=False)
    data_remaining_gb = Column(Float, nullable=False)
    validity_days = Column(Integer, nullable=False, default=30)
    price_sol_per_day = Column(Float, nullable=False)
    deposit_sol = Column(Float, nullable=False)                           # held in escrow
    status = Column(Enum(EsimStatus), default=EsimStatus.available, nullable=False)
    added_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    rentals = relationship("EsimRental", back_populates="esim")


class EsimRental(Base):
    __tablename__ = "esim_rentals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    esim_id = Column(UUID(as_uuid=True), ForeignKey("esims.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    rental_days = Column(Integer, nullable=False)
    total_price_sol = Column(Float, nullable=False)
    deposit_sol = Column(Float, nullable=False)
    escrow_address = Column(String(44), nullable=True)
    status = Column(Enum(RentalStatus), default=RentalStatus.active, nullable=False)
    qr_code_url = Column(String(512), nullable=True)                      # eSIM activation QR
    rented_at = Column(DateTime, default=datetime.datetime.utcnow)
    due_at = Column(DateTime, nullable=False)
    returned_at = Column(DateTime, nullable=True)
    return_tx_hash = Column(String(88), nullable=True)

    esim = relationship("Esim", back_populates="rentals")
    user = relationship("User", back_populates="esim_rentals")


# ── Auth Models ────────────────────────────────────────────────────────────────

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    token_hash = Column(String(255), unique=True, nullable=False)   # store hash, not raw token
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="refresh_tokens")


# ── DB session dependency ──────────────────────────────────────────────────────

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()