from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from jose import JWTError
from ..database import get_db
from ..services.chatbot import ChatbotService
from ..services import auth
from ..schemas.chat import ChatMessage
from ..models.chat import Chat
from ..models.user import User
from typing import AsyncGenerator, Dict, Any, List
import json
import logging
from sqlalchemy import desc

router = APIRouter()
logger = logging.getLogger(__name__)
chatbot_service = ChatbotService()

async def stream_response(data: dict) -> AsyncGenerator[str, None]:
    yield f"data: {json.dumps(data)}\n\n"

async def get_user_from_token_param(
    token: str,
    db: Session = Depends(get_db)
) -> User:
    try:
        # Verify the token and get user email
        payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication token")
            
        # Get user from database
        user = auth.get_user_by_email(db, email=email)
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
            
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication token")

@router.get("/chat")
async def chat_stream(
    message: str,
    token: str,
    chat_session: str | None = None,
    character_id: int | None = None,
    db: Session = Depends(get_db),
) -> StreamingResponse:
    try:
        # Authenticate using token from URL parameter
        current_user = await get_user_from_token_param(token, db)
        
        async def generate() -> AsyncGenerator[str, None]:
            async for response in chatbot_service.stream_response(
                message=message,
                db=db,
                user_id=current_user.id,
                character_id=character_id,
                chat_session=chat_session
            ):
                yield f"data: {json.dumps(response)}\n\n"
            
        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",  # Configure as needed
                "Access-Control-Allow-Credentials": "true",
            }
        )
    except HTTPException as he:
        error_response = {"error": he.detail, "done": True}
        return StreamingResponse(
            stream_response(error_response),
            media_type="text/event-stream"
        )
    except Exception as e:
        logger.error(f"Error in chat stream: {str(e)}")
        error_response = {"error": str(e), "done": True}
        return StreamingResponse(
            stream_response(error_response),
            media_type="text/event-stream"
        )

@router.post("/chat")
async def chat(
    message: ChatMessage,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
) -> dict:
    try:
        # Override user_id with the authenticated user's ID
        message.user_id = current_user.id
        
        response = await chatbot_service.get_response(
            message=message.message,
            db=db,
            user_id=current_user.id,
            character_id=message.character_id
        )
        return {"response": response}
    except Exception as e:
        logger.error(f"Error in chat: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.get("/messages")
async def get_user_chat_messages(
    character_id: int | None = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    """Fetch chat messages for the current authenticated user."""
    try:
        query = db.query(Chat).filter(Chat.user_id == current_user.id)
        
        if character_id is not None:
            query = query.filter(Chat.character_id == character_id)
        
        messages = (
            query.order_by(Chat.timestamp.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
        
        # Add last_message field to each message
        result = []
        for msg in messages:
            msg_dict = msg.__dict__
            msg_dict['last_message'] = msg.message
            if '_sa_instance_state' in msg_dict:
                del msg_dict['_sa_instance_state']
            result.append(msg_dict)
        
        return result
    except Exception as e:
        logger.error(f"Error fetching chat messages: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch chat messages"
        )

@router.get("/messages/chat/{chat_session}")
async def get_chat_session_messages(
    chat_session: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    """Fetch messages for a specific chat session."""
    try:
        messages = (
            db.query(Chat)
            .filter(
                Chat.user_id == current_user.id,
                Chat.chat_session == chat_session
            )
            .order_by(Chat.timestamp.asc())
            .all()
        )
        
        if not messages:
            raise HTTPException(
                status_code=404,
                detail=f"Chat session {chat_session} not found"
            )
        
        # Convert to dictionary and remove SQLAlchemy state
        result = []
        for msg in messages:
            msg_dict = {
                "id": msg.id,
                "message": msg.message,
                "is_bot": msg.is_bot,
                "timestamp": msg.timestamp.isoformat(),
                "chat_session": msg.chat_session,
                "character_id": msg.character_id
            }
            result.append(msg_dict)
        
        return result
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error fetching chat messages: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch chat messages"
        )

@router.get("/chat/sessions")
async def get_chat_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    """Fetch all chat sessions for the current user."""
    try:
        # Query distinct chat sessions and their latest messages
        latest_messages = (
            db.query(
                Chat.chat_session,
                Chat.message.label('last_message'),
                Chat.timestamp,
                Chat.character_id
            )
            .filter(
                Chat.user_id == current_user.id,
                Chat.chat_session.isnot(None)
            )
            .distinct(Chat.chat_session)
            .order_by(Chat.chat_session, desc(Chat.timestamp))
            .all()
        )
        
        # Format the response
        sessions = []
        for msg in latest_messages:
            session = {
                "chat_session": msg.chat_session,
                "title": msg.last_message[:50] + "..." if len(msg.last_message) > 50 else msg.last_message,
                "last_message": msg.last_message,
                "timestamp": msg.timestamp.isoformat(),
                "character_id": msg.character_id
            }
            sessions.append(session)
        
        return sorted(sessions, key=lambda x: x['timestamp'], reverse=True)
        
    except Exception as e:
        logger.error(f"Error fetching chat sessions: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch chat sessions"
        )