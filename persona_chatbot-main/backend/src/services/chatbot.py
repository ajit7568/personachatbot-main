from fastapi import APIRouter
from typing import List, AsyncGenerator, Optional
from pydantic import BaseModel
import groq
from sqlalchemy.orm import Session
from ..models.character import Character
from ..models.chat import Chat
from dotenv import load_dotenv
import os
import asyncio
import json
import logging
from datetime import datetime
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# Configure Groq
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found in environment variables")

# Define model constant
GROQ_MODEL = "llama-3.1-8b-instant"

class ChatMessage(BaseModel):
    user_id: int
    message: str
    character_id: int | None = None

class ChatbotService:
    def __init__(self):
        self.groq_client = groq.AsyncClient(api_key=os.getenv("GROQ_API_KEY"))
        self.response_delay = 0.05  # 50ms delay between chunks

    async def create_chat_session(self, db: Session, user_id: int, character_id: Optional[int] = None) -> str:
        """Create a new chat session and return its ID."""
        session_id = str(uuid.uuid4())
        return session_id

    async def get_or_create_chat_session(
        self, 
        db: Session, 
        user_id: int, 
        chat_session: Optional[str] = None,
        character_id: Optional[int] = None
    ) -> str:
        """Get existing chat session or create a new one."""
        if chat_session:
            # Verify the chat session exists and belongs to the user
            existing_chat = db.query(Chat).filter(
                Chat.user_id == user_id,
                Chat.chat_session == chat_session
            ).first()
            if existing_chat:
                return chat_session
        
        return await self.create_chat_session(db, user_id, character_id)

    async def get_character_prompt(self, character: Character) -> str:
        """Generate a character-specific prompt."""
        prompt = f"""You are {character.name} from {character.movie}. 
Your personality and responses should match the following style:
{character.chat_style}

Here are some example responses that demonstrate your character:
{json.dumps(character.example_responses, indent=2)}

Remember to stay in character while providing helpful and relevant responses."""
        return prompt

    async def get_character_context(self, db: Session, character_id: Optional[int]) -> str:
        if character_id is None:
            return "You are a helpful AI assistant."
            
        character = db.query(Character).filter(Character.id == character_id).first()
        if not character:
            raise ValueError(f"Character with id {character_id} not found")
            
        context = (
            f"You are {character.name} from {character.movie}. "
            f"Your chat style is {character.chat_style}. "
            "Here are some example responses that show your personality:\n"
        )
        for response in character.example_responses:
            context += f"- {response}\n"
        return context

    async def stream_response(
        self,
        message: str,
        db: Session,
        user_id: int,
        character_id: Optional[int] = None,
        chat_session: Optional[str] = None
    ) -> AsyncGenerator[dict, None]:
        try:
            # Get or create chat session
            session_id = await self.get_or_create_chat_session(db, user_id, chat_session, character_id)

            # Save the user message with timestamp
            chat = Chat(
                user_id=user_id,
                message=message,
                is_bot=False,
                character_id=character_id,
                chat_session=session_id,
                timestamp=datetime.utcnow()
            )
            db.add(chat)
            db.commit()

            # Get character context if specified
            system_prompt = await self.get_character_context(db, character_id)
            
            # Get conversation history for context (ChatGPT-style)
            conversation_history = []
            if session_id:
                previous_messages = (
                    db.query(Chat)
                    .filter(
                        Chat.user_id == user_id,
                        Chat.chat_session == session_id
                    )
                    .order_by(Chat.timestamp.asc())
                    .all()
                )
                # Convert to message format, excluding the current message we just added
                for prev_msg in previous_messages[:-1]:  # Exclude the last message (current user message)
                    conversation_history.append({
                        "role": "assistant" if prev_msg.is_bot else "user",
                        "content": prev_msg.message
                    })
            
            # Prepare the chat completion request with conversation history
            messages_for_api = [{"role": "system", "content": system_prompt}]
            messages_for_api.extend(conversation_history)
            messages_for_api.append({"role": "user", "content": message})
            
            completion = await self.groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=messages_for_api,
                stream=True,
                temperature=0.7,
                max_tokens=2000
            )

            full_response = ""
            
            # Stream the response
            async for chunk in completion:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    full_response += content
                    yield {"text": content, "done": False, "chat_session": session_id}
                    await asyncio.sleep(self.response_delay)

            # Save the complete bot response with timestamp
            chat = Chat(
                user_id=user_id,
                message=full_response,
                is_bot=True,
                character_id=character_id,
                chat_session=session_id,
                timestamp=datetime.utcnow()
            )
            db.add(chat)
            db.commit()

            yield {"text": "", "done": True, "chat_session": session_id}

        except Exception as e:
            logger.error(f"Error in stream_response: {str(e)}")
            yield {"error": str(e), "done": True}

    async def get_response(
        self,
        message: str,
        db: Session,
        user_id: int,
        character_id: Optional[int] = None,
        chat_session: Optional[str] = None
    ) -> str:
        try:
            # Get or create chat session
            session_id = await self.get_or_create_chat_session(db, user_id, chat_session, character_id)

            # Save the user message
            chat = Chat(
                user_id=user_id,
                message=message,
                is_bot=False,
                chat_session=session_id
            )
            db.add(chat)
            db.commit()

            # Get character if specified
            character = None
            if character_id:
                character = db.query(Character).filter(Character.id == character_id).first()
                if not character:
                    raise ValueError(f"Character with id {character_id} not found")

            # Generate response based on character or default assistant
            system_prompt = await self.get_character_context(db, character_id)
            
            # Get conversation history for context (ChatGPT-style)
            conversation_history = []
            if session_id:
                previous_messages = (
                    db.query(Chat)
                    .filter(
                        Chat.user_id == user_id,
                        Chat.chat_session == session_id
                    )
                    .order_by(Chat.timestamp.asc())
                    .all()
                )
                # Convert to message format, excluding the current message we just added
                for prev_msg in previous_messages[:-1]:  # Exclude the last message (current user message)
                    conversation_history.append({
                        "role": "assistant" if prev_msg.is_bot else "user",
                        "content": prev_msg.message
                    })
            
            # Prepare the chat completion request with conversation history
            messages_for_api = [{"role": "system", "content": system_prompt}]
            messages_for_api.extend(conversation_history)
            messages_for_api.append({"role": "user", "content": message})
            
            completion = await self.groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=messages_for_api,
                temperature=0.7,
                max_tokens=2000
            )
            response_text = completion.choices[0].message.content

            # Save the bot response
            chat = Chat(
                user_id=user_id,
                message=response_text,
                is_bot=True,
                character_id=character_id if character else None,
                chat_session=session_id
            )
            db.add(chat)
            db.commit()

            return response_text

        except Exception as e:
            logger.error(f"Error in get_response: {str(e)}")
            raise

# Initialize the router
router = APIRouter()
chat_history: List[ChatMessage] = []

@router.post("/chat", response_model=ChatMessage)
async def send_message(chat_message: ChatMessage):
    chat_history.append(chat_message)
    return chat_message

@router.get("/chat/history", response_model=List[ChatMessage])
async def get_chat_history():
    return chat_history