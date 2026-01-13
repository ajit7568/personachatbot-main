from fastapi import APIRouter, Depends, HTTPException, Query, Body
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from ..schemas.user import UserCreate, UserLogin, UserOut, TokenRefresh
from ..database import get_db
from ..services import auth
from ..services.google_oauth import get_google_authorization_url, handle_google_oauth_callback
from ..models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserOut)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = auth.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return auth.create_user(db=db, user=user)

@router.post("/login")
async def login(user: UserLogin, db: Session = Depends(get_db)):
    result = auth.authenticate_user(db, email=user.email, password=user.password)
    if not result:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    user, access_token, refresh_token = result
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/refresh")
async def refresh_token(token_data: TokenRefresh, db: Session = Depends(get_db)):
    email = auth.verify_refresh_token(token_data.refresh_token)
    if not email:
        raise HTTPException(
            status_code=401,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create new access token
    access_token = auth.create_access_token({"sub": email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserOut)
async def get_current_user_info(current_user: User = Depends(auth.get_current_user)):
    """Get the current authenticated user's information."""
    return current_user

@router.get("/google/login")
async def google_login(redirect_uri: str = Query(None)):
    """
    Get Google OAuth authorization URL.
    If redirect_uri is provided, it will be used instead of the default.
    """
    try:
        auth_url = get_google_authorization_url()
        return {"authorization_url": auth_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate authorization URL: {str(e)}")

@router.get("/google/callback")
async def google_callback(code: str = Query(...), db: Session = Depends(get_db)):
    """
    Handle Google OAuth callback.
    Exchanges authorization code for tokens and creates/updates user.
    Returns JWT tokens.
    """
    try:
        user, access_token, refresh_token = await handle_google_oauth_callback(db, code)
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OAuth callback failed: {str(e)}")

@router.post("/google/token")
async def google_token_exchange(
    code: str = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    """
    Alternative endpoint for Google OAuth token exchange.
    Accepts authorization code and returns JWT tokens.
    """
    try:
        user, access_token, refresh_token = await handle_google_oauth_callback(db, code)
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Token exchange failed: {str(e)}")