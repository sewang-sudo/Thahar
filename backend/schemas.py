import datetime
import re
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, field_validator, model_validator


# ── Auth ───────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    account_type: str = "tourist"

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v):
        if not re.match(r"^[a-zA-Z0-9_]{3,50}$", v):
            raise ValueError("Username must be 3–50 chars, letters/numbers/underscore only")
        return v

    @field_validator("account_type")
    @classmethod
    def valid_account_type(cls, v):
        if v not in ("tourist", "business"):
            raise ValueError("account_type must be tourist or business")
        return v


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class WalletLinkRequest(BaseModel):
    wallet_address: str

    @field_validator("wallet_address")
    @classmethod
    def valid_pubkey(cls, v):
        if not re.match(r"^[1-9A-HJ-NP-Za-km-z]{32,44}$", v):
            raise ValueError("Invalid Solana wallet address")
        return v


# ── Activities ─────────────────────────────────────────────────────────────────

class ActivityCreate(BaseModel):
    title: str
    description: Optional[str] = None
    location: str
    price_sol: float
    total_seats: int
    event_date: datetime.datetime
    image_url: Optional[str] = None

    @field_validator("price_sol")
    @classmethod
    def positive_price(cls, v):
        if v <= 0:
            raise ValueError("Price must be positive")
        return round(v, 6)

    @field_validator("total_seats")
    @classmethod
    def valid_seats(cls, v):
        if v < 1 or v > 10000:
            raise ValueError("Seats must be between 1 and 10000")
        return v


class ActivityOut(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    location: str
    price_sol: float
    total_seats: int
    booked_seats: int
    seats_available: int = 0
    event_date: datetime.datetime
    image_url: Optional[str]

    model_config = {"from_attributes": True}

    @classmethod
    def model_validate(cls, obj, **kwargs):
        data = super().model_validate(obj, **kwargs)
        if hasattr(obj, "total_seats") and hasattr(obj, "booked_seats"):
            data.seats_available = obj.total_seats - obj.booked_seats
        return data


# ── Bookings ───────────────────────────────────────────────────────────────────

class BookRequest(BaseModel):
    activity_id: UUID
    wallet_address: str

    @field_validator("wallet_address")
    @classmethod
    def valid_pubkey(cls, v):
        if not re.match(r"^[1-9A-HJ-NP-Za-km-z]{32,44}$", v):
            raise ValueError("Invalid Solana wallet address")
        return v


class BookingOut(BaseModel):
    id: UUID
    activity_id: UUID
    price_paid_sol: float
    status: str
    nft_mint_address: Optional[str]
    solana_tx_hash: Optional[str]
    booked_at: datetime.datetime

    model_config = {"from_attributes": True}


# ── Resale ─────────────────────────────────────────────────────────────────────

class ResaleListRequest(BaseModel):
    booking_id: UUID
    asking_price_sol: float

    @field_validator("asking_price_sol")
    @classmethod
    def positive_price(cls, v):
        if v <= 0:
            raise ValueError("Price must be positive")
        return round(v, 6)


class ResaleBuyRequest(BaseModel):
    listing_id: UUID
    buyer_wallet: str

    @field_validator("buyer_wallet")
    @classmethod
    def valid_pubkey(cls, v):
        if not re.match(r"^[1-9A-HJ-NP-Za-km-z]{32,44}$", v):
            raise ValueError("Invalid Solana wallet address")
        return v


class ResaleListingOut(BaseModel):
    id: UUID
    booking_id: UUID
    asking_price_sol: float
    status: str
    listed_at: datetime.datetime

    model_config = {"from_attributes": True}


# ── eSIM ───────────────────────────────────────────────────────────────────────

class EsimAddRequest(BaseModel):
    iccid: str
    provider: str = "NTC"
    data_total_gb: float
    validity_days: int
    price_sol_per_day: float
    deposit_sol: float

    @field_validator("iccid")
    @classmethod
    def valid_iccid(cls, v):
        if not re.match(r"^\d{19,22}$", v):
            raise ValueError("ICCID must be 19–22 digits")
        return v

    @field_validator("data_total_gb", "price_sol_per_day", "deposit_sol")
    @classmethod
    def positive(cls, v):
        if v <= 0:
            raise ValueError("Must be positive")
        return v


class EsimOut(BaseModel):
    id: UUID
    iccid: str
    provider: str
    data_total_gb: float
    data_remaining_gb: float
    validity_days: int
    price_sol_per_day: float
    deposit_sol: float
    status: str

    model_config = {"from_attributes": True}


class EsimRentRequest(BaseModel):
    esim_id: UUID
    rental_days: int
    wallet_address: str

    @field_validator("rental_days")
    @classmethod
    def valid_days(cls, v):
        if v < 1 or v > 90:
            raise ValueError("Rental period must be 1–90 days")
        return v

    @field_validator("wallet_address")
    @classmethod
    def valid_pubkey(cls, v):
        if not re.match(r"^[1-9A-HJ-NP-Za-km-z]{32,44}$", v):
            raise ValueError("Invalid Solana wallet address")
        return v


class EsimReturnRequest(BaseModel):
    rental_id: UUID
    return_tx_hash: str


class EsimRentalOut(BaseModel):
    id: UUID
    esim_id: UUID
    rental_days: int
    total_price_sol: float
    deposit_sol: float
    status: str
    qr_code_url: Optional[str]
    rented_at: datetime.datetime
    due_at: datetime.datetime
    returned_at: Optional[datetime.datetime]

    model_config = {"from_attributes": True}