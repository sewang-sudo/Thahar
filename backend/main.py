import uuid
import datetime
import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

import auth as auth_utils
import solana_utils
from auth import (
    get_current_user,
    require_role,
    validate_password_strength,
)
from config import settings
from database import (
    AccountType,
    Activity,
    Base,
    Booking,
    BookingStatus,
    Esim,
    EsimRental,
    EsimStatus,
    RentalStatus,
    ResaleListing,
    ResaleStatus,
    User,
    engine,
    get_db,
)
from schemas import (
    ActivityCreate,
    ActivityOut,
    BookingOut,
    BookRequest,
    EsimAddRequest,
    EsimOut,
    EsimRentRequest,
    EsimRentalOut,
    EsimReturnRequest,
    RefreshRequest,
    RegisterRequest,
    ResaleBuyRequest,
    ResaleListingOut,
    ResaleListRequest,
    TokenResponse,
    WalletLinkRequest,
)

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Rate limiter ───────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])


# ── App startup ────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables ensured.")
    yield

app = FastAPI(
    title="NFT Tickets + eSIM Rental API",
    version="1.0.0",
    docs_url="/docs",      # disable in prod: docs_url=None
    redoc_url=None,
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# ── Security middleware ────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    response.headers["X-Action-Version"] = "1"
    response.headers["X-Blockchain-Ids"] = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1"
    return response

@app.middleware("http")
async def log_requests(request: Request, call_next):
    # Never log Authorization headers or request bodies (no credential leaks)
    logger.info(f"{request.method} {request.url.path} - {request.client.host}")
    response = await call_next(request)
    return response


# ═══════════════════════════════════════════════════════════════════════════════
# AUTH ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/auth/register", response_model=TokenResponse, status_code=201)
async def register(request: Request, body: RegisterRequest, db: Session = Depends(get_db)):
    # Check duplicates
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    if db.query(User).filter(User.username == body.username).first():
        raise HTTPException(status_code=409, detail="Username already taken")

    # Validate password strength
    try:
        validate_password_strength(body.password)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    user = User(
        username=body.username,
        email=body.email,
        hashed_password=auth_utils.hash_password(body.password),
        account_type=AccountType(body.account_type),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = auth_utils.create_access_token({"sub": str(user.id)})
    refresh_token = auth_utils.create_refresh_token()
    auth_utils.store_refresh_token(db, user.id, refresh_token)

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@app.post("/auth/login", response_model=TokenResponse)
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Accepts OAuth2 form — username field = email."""
    email = form_data.username.strip().lower()
    password = form_data.password

    user = db.query(User).filter(User.email == email).first()

    # Generic error — never reveal whether email exists
    GENERIC_ERR = HTTPException(status_code=401, detail="Invalid credentials")

    if not user:
        raise GENERIC_ERR

    auth_utils.check_account_locked(user)

    if not auth_utils.verify_password(password, user.hashed_password):
        auth_utils.record_failed_login(db, user)
        raise GENERIC_ERR

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    auth_utils.reset_failed_login(db, user)

    access_token = auth_utils.create_access_token({"sub": str(user.id)})
    refresh_token = auth_utils.create_refresh_token()
    auth_utils.store_refresh_token(db, user.id, refresh_token)

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@app.post("/auth/refresh", response_model=TokenResponse)
async def refresh_token(request: Request, body: RefreshRequest, db: Session = Depends(get_db)):
    record = auth_utils.verify_refresh_token(db, body.refresh_token)
    if not record:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    # Rotate: revoke old, issue new
    auth_utils.revoke_refresh_token(db, body.refresh_token)
    new_access = auth_utils.create_access_token({"sub": str(record.user_id)})
    new_refresh = auth_utils.create_refresh_token()
    auth_utils.store_refresh_token(db, record.user_id, new_refresh)

    return TokenResponse(access_token=new_access, refresh_token=new_refresh)


@app.post("/auth/logout", status_code=204)
async def logout(body: RefreshRequest, db: Session = Depends(get_db)):
    auth_utils.revoke_refresh_token(db, body.refresh_token)
    return


@app.post("/auth/link-wallet", status_code=200)
async def link_wallet(
    body: WalletLinkRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = db.query(User).filter(User.wallet_address == body.wallet_address).first()
    if existing and existing.id != current_user.id:
        raise HTTPException(status_code=409, detail="Wallet already linked to another account")
    current_user.wallet_address = body.wallet_address
    db.commit()
    return {"detail": "Wallet linked successfully"}


# ═══════════════════════════════════════════════════════════════════════════════
# ACTIVITIES (public browse)
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/activities", response_model=list[ActivityOut])
async def list_activities(request: Request, db: Session = Depends(get_db)):
    return (
        db.query(Activity)
        .filter(Activity.is_active == True, Activity.event_date > datetime.datetime.utcnow())
        .order_by(Activity.event_date)
        .limit(100)
        .all()
    )


@app.post("/activities", response_model=ActivityOut, status_code=201)
async def create_activity(
    body: ActivityCreate,
    current_user: User = Depends(require_role(AccountType.business, AccountType.admin)),
    db: Session = Depends(get_db),
):
    activity = Activity(**body.model_dump(), business_id=current_user.id)
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


# ═══════════════════════════════════════════════════════════════════════════════
# TICKET BOOKING
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/book", response_model=BookingOut, status_code=201)
async def book_ticket(
    request: Request,
    body: BookRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Lock the activity row to prevent double-booking race conditions
    activity = (
        db.query(Activity)
        .filter(Activity.id == body.activity_id, Activity.is_active == True)
        .with_for_update()
        .first()
    )
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    if activity.seats_available <= 0:
        raise HTTPException(status_code=409, detail="No seats available")

    # Prevent duplicate confirmed booking
    existing = (
        db.query(Booking)
        .filter(
            Booking.user_id == current_user.id,
            Booking.activity_id == body.activity_id,
            Booking.status.in_([BookingStatus.confirmed, BookingStatus.minted]),
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="You already have a ticket for this event")

    # Create booking
    booking = Booking(
        user_id=current_user.id,
        activity_id=activity.id,
        price_paid_sol=activity.price_sol,
        status=BookingStatus.confirmed,
        confirmed_at=datetime.datetime.utcnow(),
    )
    activity.booked_seats += 1
    db.add(booking)
    db.commit()
    db.refresh(booking)

    # Mint NFT (mock — swap with real Anchor call)
    try:
        mint_result = solana_utils.mock_mint_nft(
            body.wallet_address,
            {"activity_id": str(activity.id), "booking_id": str(booking.id)},
        )
        booking.nft_mint_address = mint_result["mint_address"]
        booking.solana_tx_hash = mint_result["tx_hash"]
        booking.status = BookingStatus.minted
        db.commit()
        db.refresh(booking)
    except Exception:
        # Booking confirmed but mint failed — don't expose details
        logger.exception("NFT mint failed for booking %s", booking.id)

    return booking


@app.get("/my-tickets", response_model=list[BookingOut])
async def my_tickets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Booking)
        .filter(
            Booking.user_id == current_user.id,
            Booking.status.in_([BookingStatus.confirmed, BookingStatus.minted]),
        )
        .order_by(Booking.booked_at.desc())
        .all()
    )


# ═══════════════════════════════════════════════════════════════════════════════
# RESALE MARKETPLACE
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/resale", response_model=list[ResaleListingOut])
async def list_resale(request: Request, db: Session = Depends(get_db)):
    return (
        db.query(ResaleListing)
        .filter(ResaleListing.status == ResaleStatus.active)
        .order_by(ResaleListing.listed_at.desc())
        .limit(100)
        .all()
    )


@app.post("/resale/list", response_model=ResaleListingOut, status_code=201)
async def list_for_resale(
    request: Request,
    body: ResaleListRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(
        Booking.id == body.booking_id,
        Booking.user_id == current_user.id,
        Booking.status == BookingStatus.minted,
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Ticket not found or not eligible for resale")

    if booking.resale_listing and booking.resale_listing.status == ResaleStatus.active:
        raise HTTPException(status_code=409, detail="Ticket already listed for resale")

    # Verify on-chain ownership
    if not solana_utils.verify_wallet_owns_nft(
        current_user.wallet_address or "", booking.nft_mint_address or ""
    ):
        raise HTTPException(status_code=403, detail="On-chain ownership verification failed")

    # Create escrow on-chain (mock)
    escrow_result = solana_utils.mock_list_for_resale(
        booking.nft_mint_address, body.asking_price_sol
    )

    listing = ResaleListing(
        booking_id=booking.id,
        seller_id=current_user.id,
        asking_price_sol=body.asking_price_sol,
        escrow_address=escrow_result["escrow_address"],
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing


@app.post("/resale/buy", response_model=ResaleListingOut)
async def buy_resale_ticket(
    request: Request,
    body: ResaleBuyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    listing = (
        db.query(ResaleListing)
        .filter(ResaleListing.id == body.listing_id, ResaleListing.status == ResaleStatus.active)
        .with_for_update()
        .first()
    )
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found or already sold")
    if listing.seller_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot buy your own listing")

    # Execute on-chain transfer (mock)
    buy_result = solana_utils.mock_buy_ticket(listing.escrow_address, body.buyer_wallet)

    listing.status = ResaleStatus.sold
    listing.buyer_id = current_user.id
    listing.sale_tx_hash = buy_result["tx_hash"]
    listing.sold_at = datetime.datetime.utcnow()

    # Transfer booking ownership
    listing.booking.user_id = current_user.id

    db.commit()
    db.refresh(listing)
    return listing


# ═══════════════════════════════════════════════════════════════════════════════
# eSIM RENTAL
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/esim/available", response_model=list[EsimOut])
async def available_esims(request: Request, db: Session = Depends(get_db)):
    return (
        db.query(Esim)
        .filter(Esim.status == EsimStatus.available)
        .order_by(Esim.price_sol_per_day)
        .all()
    )


@app.post("/esim/add", response_model=EsimOut, status_code=201)
async def add_esim(
    body: EsimAddRequest,
    current_user: User = Depends(require_role(AccountType.admin, AccountType.business)),
    db: Session = Depends(get_db),
):
    if db.query(Esim).filter(Esim.iccid == body.iccid).first():
        raise HTTPException(status_code=409, detail="eSIM with this ICCID already exists")

    esim = Esim(
        **body.model_dump(),
        data_remaining_gb=body.data_total_gb,
        added_by=current_user.id,
    )
    db.add(esim)
    db.commit()
    db.refresh(esim)
    return esim


@app.post("/esim/rent", response_model=EsimRentalOut, status_code=201)
async def rent_esim(
    request: Request,
    body: EsimRentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    esim = (
        db.query(Esim)
        .filter(Esim.id == body.esim_id, Esim.status == EsimStatus.available)
        .with_for_update()
        .first()
    )
    if not esim:
        raise HTTPException(status_code=404, detail="eSIM not available")
    if body.rental_days > esim.validity_days:
        raise HTTPException(
            status_code=400,
            detail=f"Max rental period for this eSIM is {esim.validity_days} days",
        )

    total_price = round(esim.price_sol_per_day * body.rental_days, 6)
    due_at = datetime.datetime.utcnow() + datetime.timedelta(days=body.rental_days)

    # On-chain: lock deposit in escrow, deliver QR
    escrow_result = solana_utils.mock_rent_esim(esim.iccid, body.wallet_address)

    rental = EsimRental(
        esim_id=esim.id,
        user_id=current_user.id,
        rental_days=body.rental_days,
        total_price_sol=total_price,
        deposit_sol=esim.deposit_sol,
        escrow_address=escrow_result["escrow_address"],
        qr_code_url=escrow_result["qr_code_url"],
        due_at=due_at,
    )
    esim.status = EsimStatus.rented
    db.add(rental)
    db.commit()
    db.refresh(rental)
    return rental


@app.post("/esim/return", response_model=EsimRentalOut)
async def return_esim(
    request: Request,
    body: EsimReturnRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rental = db.query(EsimRental).filter(
        EsimRental.id == body.rental_id,
        EsimRental.user_id == current_user.id,
        EsimRental.status == RentalStatus.active,
    ).first()
    if not rental:
        raise HTTPException(status_code=404, detail="Active rental not found")

    now = datetime.datetime.utcnow()
    is_late = now > rental.due_at

    # On-chain: release escrow (penalty deducted automatically in Anchor program)
    solana_utils.mock_return_esim(rental.escrow_address, current_user.wallet_address or "")

    rental.status = RentalStatus.returned if not is_late else RentalStatus.overdue
    rental.returned_at = now
    rental.return_tx_hash = body.return_tx_hash
    rental.esim.status = EsimStatus.available
    rental.esim.data_remaining_gb = rental.esim.data_total_gb  # reset for next renter

    db.commit()
    db.refresh(rental)
    return rental


@app.get("/esim/my-rentals", response_model=list[EsimRentalOut])
async def my_rentals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(EsimRental)
        .filter(EsimRental.user_id == current_user.id)
        .order_by(EsimRental.rented_at.desc())
        .all()
    )


# ═══════════════════════════════════════════════════════════════════════════════
# ADMIN
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/admin/stats")
async def admin_stats(
    current_user: User = Depends(require_role(AccountType.admin)),
    db: Session = Depends(get_db),
):
    total_bookings = db.query(Booking).count()
    minted = db.query(Booking).filter(Booking.status == BookingStatus.minted).count()
    active_rentals = db.query(EsimRental).filter(EsimRental.status == RentalStatus.active).count()
    available_esims = db.query(Esim).filter(Esim.status == EsimStatus.available).count()
    resale_volume = db.query(ResaleListing).filter(ResaleListing.status == ResaleStatus.sold).count()

    return {
        "total_bookings": total_bookings,
        "minted_nfts": minted,
        "active_esim_rentals": active_rentals,
        "available_esims": available_esims,
        "resale_sales": resale_volume,
    }


# ── Health check ───────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.datetime.utcnow().isoformat()}

# ── Solana Blinks ──────────────────────────────────────────────────────────────

@app.get("/actions.json")
async def actions_json():
    return {
        "rules": [
            {"pathPattern": "/api/actions/**", "apiPath": "/api/actions/**"}
        ]
    }

@app.get("/api/actions/book/{activity_id}")
async def blink_book_get(activity_id: str, db: Session = Depends(get_db)):
    activity = db.query(Activity).filter(Activity.id == uuid.UUID(activity_id)).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return {
        "icon": "https://nft-ticket-esim.netlify.app/logo192.png",
        "label": f"Book {activity.title}",
        "title": f"{activity.title} — Nepal Adventure",
        "description": f"{activity.description or 'Book this adventure in Nepal and get an NFT ticket on Solana.'} Price: {activity.price_sol} SOL",
        "links": {
            "actions": [
                {
                    "label": f"Book for {activity.price_sol} SOL",
                    "href": f"/api/actions/book/{activity_id}",
                    "type": "transaction"
                }
            ]
        }
    }

@app.post("/api/actions/book/{activity_id}")
async def blink_book_post(activity_id: str, request: Request, db: Session = Depends(get_db)):
    body = await request.json()
    wallet = body.get("account")
    if not wallet:
        raise HTTPException(status_code=400, detail="No wallet provided")
    activity = db.query(Activity).filter(Activity.id == uuid.UUID(activity_id)).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return {
        "transaction": "mock_transaction_base64",
        "message": f"NFT ticket for {activity.title} will be minted to your wallet"
    }

@app.get("/api/actions/esim/{esim_id}")
async def blink_esim_get(esim_id: int, db: Session = Depends(get_db)):
    esim = db.query(Esim).filter(Esim.id == esim_id).first()
    if not esim:
        raise HTTPException(status_code=404, detail="eSIM not found")
    return {
        "icon": "https://nft-ticket-esim.netlify.app/logo192.png",
        "label": f"Rent eSIM — {esim.data_gb}GB",
        "title": f"Nepal eSIM — {esim.data_gb}GB Data",
        "description": f"Stay connected in Nepal. {esim.data_gb}GB data plan. Price: {esim.price_sol} SOL/day",
        "links": {
            "actions": [
                {
                    "label": f"Rent for {esim.price_sol} SOL/day",
                    "href": f"/api/actions/esim/{esim_id}",
                    "type": "transaction"
                }
            ]
        }
    }

@app.get("/api/actions/buy/{listing_id}")
async def blink_buy_get(listing_id: int, db: Session = Depends(get_db)):
    listing = db.query(ResaleListing).filter(ResaleListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return {
        "icon": "https://nft-ticket-esim.netlify.app/logo192.png",
        "label": "Buy Resale Ticket",
        "title": "NFT Ticket — Nepal Adventure",
        "description": f"Buy this resale NFT ticket on Solana. Price: {listing.asking_price_sol} SOL",
        "links": {
            "actions": [
                {
                    "label": f"Buy for {listing.asking_price_sol} SOL",
                    "href": f"/api/actions/buy/{listing_id}",
                    "type": "transaction"
                }
            ]
        }
    }
