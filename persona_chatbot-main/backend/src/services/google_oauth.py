from typing import Optional, Dict, Tuple
from httpx import AsyncClient
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os
from ..models.user import User
from .auth import create_tokens, get_user_by_email

load_dotenv()

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:3000/auth/google/callback")

# Google OAuth endpoints
GOOGLE_AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v2/userinfo"

def _check_google_credentials():
    """Check if Google OAuth credentials are configured."""
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise ValueError("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in environment variables")


def get_google_authorization_url(state: Optional[str] = None) -> str:
    """
    Generate Google OAuth authorization URL.
    
    Args:
        state: Optional state parameter for CSRF protection
        
    Returns:
        Authorization URL string
    """
    _check_google_credentials()
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
    }
    
    if state:
        params["state"] = state
    
    query_string = "&".join([f"{k}={v}" for k, v in params.items()])
    return f"{GOOGLE_AUTHORIZATION_ENDPOINT}?{query_string}"


async def exchange_code_for_tokens(code: str) -> Dict[str, str]:
    """
    Exchange authorization code for access token.
    
    Args:
        code: Authorization code from Google OAuth callback
        
    Returns:
        Dictionary containing access_token and other token info
    """
    _check_google_credentials()
    async with AsyncClient() as client:
        response = await client.post(
            GOOGLE_TOKEN_ENDPOINT,
            data={
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": GOOGLE_REDIRECT_URI,
            },
        )
        response.raise_for_status()
        return response.json()


async def get_google_user_info(access_token: str) -> Dict[str, str]:
    """
    Fetch user information from Google using access token.
    
    Args:
        access_token: Google OAuth access token
        
    Returns:
        Dictionary containing user information (id, email, name, etc.)
    """
    async with AsyncClient() as client:
        response = await client.get(
            GOOGLE_USERINFO_ENDPOINT,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        response.raise_for_status()
        return response.json()


async def create_or_update_user_from_google(
    db: Session, google_user_info: Dict[str, str]
) -> Tuple[User, str, str]:
    """
    Create or update user from Google OAuth data and generate JWT tokens.
    
    Args:
        db: Database session
        google_user_info: User information from Google API
        
    Returns:
        Tuple of (User, access_token, refresh_token)
    """
    google_id = google_user_info.get("id")
    email = google_user_info.get("email")
    name = google_user_info.get("name", "")
    picture = google_user_info.get("picture", "")
    
    if not google_id or not email:
        raise ValueError("Google user info missing required fields")
    
    # Check if user exists by google_id
    user = db.query(User).filter(User.google_id == google_id).first()
    
    # If not found by google_id, check by email
    if not user:
        user = get_user_by_email(db, email=email)
    
    if user:
        # Update existing user
        user.google_id = google_id
        user.auth_provider = "google"
        user.is_active = True
        # Update username if not set or if it's just the email prefix
        if not user.username or user.username == email.split("@")[0]:
            user.username = name.split()[0] if name else email.split("@")[0]
    else:
        # Create new user
        username = name.split()[0] if name else email.split("@")[0]
        # Ensure username is unique
        base_username = username
        counter = 1
        while db.query(User).filter(User.username == username).first():
            username = f"{base_username}{counter}"
            counter += 1
        
        user = User(
            email=email,
            username=username,
            google_id=google_id,
            auth_provider="google",
            hashed_password=None,  # No password for Google OAuth users
            is_active=True,
            is_superuser=False,
        )
        db.add(user)
    
    db.commit()
    db.refresh(user)
    
    # Generate JWT tokens
    access_token, refresh_token = create_tokens({"sub": user.email})
    
    return user, access_token, refresh_token


async def handle_google_oauth_callback(db: Session, code: str) -> Tuple[User, str, str]:
    """
    Handle Google OAuth callback: exchange code for tokens and create/update user.
    
    Args:
        db: Database session
        code: Authorization code from Google OAuth callback
        
    Returns:
        Tuple of (User, access_token, refresh_token)
    """
    # Exchange code for tokens
    token_data = await exchange_code_for_tokens(code)
    access_token = token_data.get("access_token")
    
    if not access_token:
        raise ValueError("Failed to obtain access token from Google")
    
    # Get user info from Google
    google_user_info = await get_google_user_info(access_token)
    
    # Create or update user and generate our JWT tokens
    return await create_or_update_user_from_google(db, google_user_info)
