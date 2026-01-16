from datetime import datetime, timedelta
from typing import Optional, Tuple
from jose import JWTError, jwt
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os
import warnings
import hashlib
import bcrypt
from ..database import get_db
from ..models.user import User
from ..schemas.user import UserCreate

# Suppress bcrypt version detection warning (harmless compatibility issue with newer bcrypt versions)
warnings.filterwarnings("ignore", message=".*bcrypt.*")
warnings.filterwarnings("ignore", category=UserWarning, module="passlib")

# Load environment variables
load_dotenv()

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY not found in environment variables")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7
REMEMBER_ME_EXPIRE_DAYS = 30

# Initialize password context with bcrypt
# Using 'auto' for deprecated schemes to handle version detection gracefully
try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
except Exception:
    # Fallback initialization if passlib has issues
    pwd_context = CryptContext(schemes=["bcrypt"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Bcrypt has a 72-byte limit. For longer passwords, we pre-hash with SHA-256
# This maintains security while removing the length restriction
BCRYPT_MAX_BYTES = 72

def _preprocess_password(password: str) -> str:
    """Pre-process password to handle bcrypt's 72-byte limit.
    
    If password exceeds 72 bytes, pre-hash with SHA-256 to get a fixed 32-byte hash.
    This allows passwords of any length while maintaining security.
    """
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > BCRYPT_MAX_BYTES:
        # Pre-hash with SHA-256 to get a fixed 32-byte hash
        sha256_hash = hashlib.sha256(password_bytes).hexdigest()
        return sha256_hash
    return password

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash.
    
    Handles both direct bcrypt hashes and pre-hashed passwords (for >72 byte passwords).
    Works with both passlib and direct bcrypt hashes.
    """
    if not plain_password or not hashed_password:
        return False
    
    # Preprocess password if needed
    password_bytes = plain_password.encode('utf-8')
    if len(password_bytes) > BCRYPT_MAX_BYTES:
        preprocessed = _preprocess_password(plain_password)
        preprocessed_bytes = preprocessed.encode('utf-8')
    else:
        preprocessed = plain_password
        preprocessed_bytes = password_bytes
    
    # Try passlib first
    try:
        if pwd_context.verify(preprocessed, hashed_password):
            return True
        # Also try with original password (for backward compatibility)
        if len(password_bytes) <= BCRYPT_MAX_BYTES:
            if pwd_context.verify(plain_password, hashed_password):
                return True
    except Exception:
        pass
    
    # Fallback to direct bcrypt verification
    try:
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(preprocessed_bytes, hashed_bytes)
    except Exception:
        # Try with original password bytes if preprocessed failed
        if len(password_bytes) <= BCRYPT_MAX_BYTES:
            try:
                return bcrypt.checkpw(password_bytes, hashed_bytes)
            except Exception:
                pass
    
    return False

def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt.
    
    For passwords > 72 bytes, pre-hashes with SHA-256 first.
    """
    if not password:
        raise ValueError("Password cannot be empty")
    
    # Ensure password is a string
    if not isinstance(password, str):
        password = str(password)
    
    # Get original password info for debugging
    original_bytes = password.encode('utf-8')
    original_byte_length = len(original_bytes)
    
    # Preprocess the password (pre-hash if > 72 bytes)
    preprocessed = _preprocess_password(password)
    
    # Ensure preprocessed is a string
    if not isinstance(preprocessed, str):
        preprocessed = str(preprocessed)
    
    preprocessed_bytes = preprocessed.encode('utf-8')
    preprocessed_byte_length = len(preprocessed_bytes)
    
    # Debug: Log what we're about to hash (remove in production if needed)
    import logging
    logger = logging.getLogger(__name__)
    logger.debug(
        f"Password hashing: original={original_byte_length} bytes, "
        f"preprocessed={preprocessed_byte_length} bytes"
    )
    
    # Safety check - this should never happen with correct preprocessing
    if preprocessed_byte_length > BCRYPT_MAX_BYTES:
        raise ValueError(
            f"Internal error: Preprocessed password ({preprocessed_byte_length} bytes) "
            f"exceeds bcrypt limit of {BCRYPT_MAX_BYTES} bytes. "
            f"Original password: {original_byte_length} bytes ({len(password)} chars)"
        )
    
    # Try passlib first, but fallback to direct bcrypt if it fails
    try:
        # Passlib expects a string, not bytes
        hash_result = pwd_context.hash(preprocessed)
        return hash_result
    except (ValueError, Exception) as e:
        error_msg = str(e)
        # If it's the 72-byte error from passlib/bcrypt, try direct bcrypt
        if "72 bytes" in error_msg or "truncate" in error_msg.lower():
            # Fallback to direct bcrypt - it's more reliable
            try:
                # bcrypt.hashpw expects bytes, not string
                salt = bcrypt.gensalt()
                hash_bytes = bcrypt.hashpw(preprocessed_bytes, salt)
                return hash_bytes.decode('utf-8')
            except Exception as bcrypt_error:
                raise ValueError(
                    f"Password hashing failed. "
                    f"Original: {len(password)} characters ({original_byte_length} bytes), "
                    f"Preprocessed: {len(preprocessed)} characters ({preprocessed_byte_length} bytes). "
                    f"Error: {str(bcrypt_error)}"
                )
        # For other ValueError (our validation errors), re-raise
        if isinstance(e, ValueError):
            raise
        # Wrap other errors
        raise ValueError(f"Failed to hash password: {error_msg}")

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Add refresh token configuration
REFRESH_TOKEN_EXPIRE_DAYS = 7

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_remember_me_token(data: dict) -> str:
    """Create a long-lived token for 'Remember Me' functionality.
    
    This token expires in 30 days and can be used to automatically log in the user
    without requiring them to enter their password.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REMEMBER_ME_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "remember_me"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_tokens(data: dict) -> Tuple[str, str]:
    access_token = create_access_token(data)
    refresh_token = create_refresh_token(data)
    return access_token, refresh_token

def verify_refresh_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if email is None or token_type != "refresh":
            return None
            
        return email
    except JWTError:
        return None

def create_user(db: Session, user: UserCreate):
    """
    Create a new user with email/password authentication.
    For Google OAuth users, use create_or_update_user_from_google instead.
    """
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=user.email.split("@")[0],  # Simple username from email
        hashed_password=hashed_password,
        auth_provider="email",
        is_active=True,
        is_superuser=False,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

async def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    
    return user

# Update login function to return both tokens
def authenticate_user(
    db: Session, email: str, password: str
) -> Optional[Tuple[User, str, str]]:
    """Authenticate user with email and password.

    Works for any user that has a password set. If the user was created via
    Google and has not yet set a password, a ValueError is raised so the
    caller can surface a helpful error message.
    
    Raises:
        ValueError: If user doesn't exist or password-related issues
    """
    user = get_user_by_email(db, email=email)
    if not user:
        raise ValueError("No account found with this email address. Please check your email or sign up.")

    # If the user does not have a password yet, force them to use Google
    # sign-in first and set a password.
    if not user.hashed_password:
        raise ValueError(
            "This account was created with Google. Please sign in with Google first, then you can set a password."
        )

    # Verify password
    if not verify_password(password, user.hashed_password):
        raise ValueError("Incorrect password, Please try again.")

    access_token, refresh_token = create_tokens({"sub": user.email})
    return user, access_token, refresh_token


def set_user_password(db: Session, user: User, new_password: str) -> User:
    """Set or update the user's password.

    This is used after Google sign-up to allow email+password login, and can
    also serve as a password change endpoint.
    
    Note: Passwords of any length are supported. Passwords > 72 bytes are
    automatically pre-hashed with SHA-256 before bcrypt hashing.
    """
    user.hashed_password = get_password_hash(new_password)
    # Keep auth_provider as-is so we still know they originated from Google,
    # but they can now log in with email+password as well.
    db.add(user)
    db.commit()
    db.refresh(user)
    return user