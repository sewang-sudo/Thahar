import bcrypt as bcrypt_lib
import datetime
import hashlib
import secrets
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from config import settings
from database import User, RefreshToken, AccountType, get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 30


# ── Password helpers ───────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    password_bytes = password.encode('utf-8')
    salt = bcrypt_lib.gensalt(rounds=12)
    hashed = bcrypt_lib.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt_lib.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False


def validate_password_strength(password: str) -> None:
    errors = []
    if len(password) < 8:
        errors.append("at least 8 characters")
    if not any(c.isupper() for c in password):
        errors.append("one uppercase letter")
    if not any(c.isdigit() for c in password):
        errors.append("one digit")
    if not any(c in "!@#$%^&*()-_=+[]{}|;:',.<>?/" for c in password):
        errors.append("one special character")
    if errors:
        raise ValueError(f"Password must contain: {', '.join(errors)}")


# ── Token helpers ──────────────────────────────────────────────────────────────

def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.datetime.utcnow() + datetime.timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload["type"] = "access"
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token() -> str:
    return secrets.token_urlsafe(64)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def store_refresh_token(db: Session, user_id, raw_token: str) -> None:
    expires = datetime.datetime.utcnow() + datetime.timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    db_token = RefreshToken(
        user_id=user_id,
        token_hash=hash_token(raw_token),
        expires_at=expires,
    )
    db.add(db_token)
    db.commit()


def revoke_refresh_token(db: Session, raw_token: str) -> None:
    token_hash = hash_token(raw_token)
    record = db.query(RefreshToken).filter_by(token_hash=token_hash, revoked=False).first()
    if record:
        record.revoked = True
        db.commit()


def verify_refresh_token(db: Session, raw_token: str) -> Optional[RefreshToken]:
    token_hash = hash_token(raw_token)
    record = (
        db.query(RefreshToken)
        .filter_by(token_hash=token_hash, revoked=False)
        .first()
    )
    if not record:
        return None
    if record.expires_at < datetime.datetime.utcnow():
        record.revoked = True
        db.commit()
        return None
    return record


# ── Account lockout ────────────────────────────────────────────────────────────

def check_account_locked(user: User) -> None:
    if user.locked_until and user.locked_until > datetime.datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account temporarily locked. Try again later.",
        )


def record_failed_login(db: Session, user: User) -> None:
    user.failed_login_attempts += 1
    if user.failed_login_attempts >= MAX_FAILED_ATTEMPTS:
        user.locked_until = datetime.datetime.utcnow() + datetime.timedelta(
            minutes=LOCKOUT_MINUTES
        )
    db.commit()


def reset_failed_login(db: Session, user: User) -> None:
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login = datetime.datetime.utcnow()
    db.commit()


# ── Current-user dependency ────────────────────────────────────────────────────

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "access":
            raise credentials_exc
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exc
    except JWTError:
        raise credentials_exc

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if user is None:
        raise credentials_exc
    return user


def require_role(*roles: AccountType):
    def _check(current_user: User = Depends(get_current_user)):
        if current_user.account_type not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return current_user
    return _check