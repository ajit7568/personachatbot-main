from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from jose import JWTError
from ..database import get_db
from ..services.chatbot import ChatbotService
from ..services import auth
from ..schemas.chat import ChatMessage, ChatSessionTitleUpdate
from ..models.chat import Chat
from ..models.user import User
from typing import AsyncGenerator, Dict, Any, List
import json
import logging
from sqlalchemy import desc, func

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
        
        # Convert to dictionary in ChatGPT-style format with role and content
        result = []
        for msg in messages:
            msg_dict = {
                "id": msg.id,
                "role": "assistant" if msg.is_bot else "user",
                "content": msg.message,
                "message": msg.message,  # Keep for backward compatibility
                "is_bot": msg.is_bot,  # Keep for backward compatibility
                "timestamp": msg.timestamp.isoformat(),
                "chat_session": msg.chat_session,
                "conversation_id": msg.chat_session,  # Alias for clarity
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
    """Fetch all chat sessions (conversations) for the current user.
    
    Returns conversations in ChatGPT-style format:
    - Each conversation has a unique ID
    - Title is generated from the first user message
    - Last message is shown as preview
    - Includes created_at and updated_at timestamps
    """
    try:
        # Get all distinct chat sessions for the user
        distinct_sessions = (
            db.query(Chat.chat_session)
            .filter(
                Chat.user_id == current_user.id,
                Chat.chat_session.isnot(None)
            )
            .distinct()
            .all()
        )
        
        sessions = []
        for (session_id,) in distinct_sessions:
            # Get all messages for this session in chronological order
            all_messages = (
                db.query(Chat)
                .filter(
                    Chat.user_id == current_user.id,
                    Chat.chat_session == session_id
                )
                .order_by(Chat.timestamp.asc())
                .all()
            )
            
            if not all_messages:
                continue
            
            # Get the first user message for the title
            first_user_message = next(
                (msg for msg in all_messages if not msg.is_bot),
                None
            )
            
            # Get the last message (any type) for preview
            last_message = all_messages[-1]
            
            # Get character_id from any message in the conversation
            character_id = next(
                (msg.character_id for msg in all_messages if msg.character_id),
                None
            )
            
            # Generate title from first user message
            if first_user_message:
                title = first_user_message.message[:50]
                if len(first_user_message.message) > 50:
                    title += "..."
            else:
                # Fallback if no user message found (shouldn't happen)
                title = "New conversation"
            
            # Get created_at (first message timestamp) and updated_at (last message timestamp)
            created_at = all_messages[0].timestamp
            updated_at = last_message.timestamp
            
            session = {
                "chat_session": session_id,
                "conversation_id": session_id,  # Alias for clarity
                "title": title,
                "last_message": last_message.message,
                "created_at": created_at.isoformat(),
                "updated_at": updated_at.isoformat(),
                "timestamp": updated_at.isoformat(),  # Keep for backward compatibility
                "character_id": character_id,
                "message_count": len(all_messages)  # Total messages in conversation
            }
            sessions.append(session)
        
        # Sort by updated_at (most recent first)
        return sorted(sessions, key=lambda x: x['updated_at'], reverse=True)
        
    except Exception as e:
        logger.error(f"Error fetching chat sessions: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch chat sessions"
        )

@router.delete("/chat/sessions/{chat_session}")
async def delete_chat_session(
    chat_session: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    """Delete a chat session and all its messages."""
    try:
        # Verify the chat session belongs to the current user
        messages = (
            db.query(Chat)
            .filter(
                Chat.user_id == current_user.id,
                Chat.chat_session == chat_session
            )
            .all()
        )
        
        if not messages:
            raise HTTPException(
                status_code=404,
                detail=f"Chat session {chat_session} not found"
            )
        
        # Delete all messages in the session
        for message in messages:
            db.delete(message)
        
        db.commit()
        return {"message": "Chat session deleted successfully"}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting chat session: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to delete chat session"
        )

@router.patch("/chat/sessions/{chat_session}/title")
async def update_chat_session_title(
    chat_session: str,
    title_update: ChatSessionTitleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    """Update the title of a chat session.
    
    Note: Since we don't have a separate title field in the database,
    this endpoint verifies the session exists and returns success.
    The frontend should store custom titles in localStorage.
    """
    try:
        # Verify the chat session belongs to the current user
        messages = (
            db.query(Chat)
            .filter(
                Chat.user_id == current_user.id,
                Chat.chat_session == chat_session
            )
            .first()
        )
        
        if not messages:
            raise HTTPException(
                status_code=404,
                detail=f"Chat session {chat_session} not found"
            )
        
        # Return success - frontend will handle title storage in localStorage
        return {"message": "Chat session title updated successfully", "title": title_update.title}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error updating chat session title: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to update chat session title"
        )