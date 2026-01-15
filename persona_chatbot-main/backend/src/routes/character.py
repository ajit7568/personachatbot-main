from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
import logging

from .. import schemas
from ..database import get_db
from ..models.character import Character, UserCharacterFavorite
from ..models.user import User
from ..services.character_service import ExternalCharacterResult
from ..services import auth
from ..services.chatbot import ChatbotService

chatbot_service = ChatbotService()

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/characters", tags=["characters"])

@router.post("/", response_model=schemas.Character)
def create_character(character: schemas.CharacterCreate, db: Session = Depends(get_db)):
    try:
        db_character = Character(
            name=character.name,
            movie=character.movie,
            chat_style=character.chat_style,
            example_responses=character.example_responses,
            genre=character.genre,
            source=character.source or "local",
            image_url=character.image_url,
            external_id=character.external_id
        )
        db.add(db_character)
        db.commit()
        db.refresh(db_character)
        return db_character
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Character '{character.name}' from '{character.movie}' already exists"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating character: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create character")

@router.post("/add", response_model=schemas.Character)
def add_character(character: schemas.CharacterCreate, db: Session = Depends(get_db)):
    try:
        # Check if character with the same name already exists
        existing_character = db.query(Character).filter(Character.name == character.name).first()
        if existing_character:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Character with name '{character.name}' already exists."
            )

        # Create and add the new character
        new_character = Character(
            name=character.name,
            movie=character.movie,
            chat_style=character.chat_style,
            example_responses=character.example_responses,
            genre=character.genre,
            source=character.source or "local",
            image_url=character.image_url,
            external_id=character.external_id
        )
        db.add(new_character)
        db.commit()
        db.refresh(new_character)
        return new_character
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add character: {str(e)}"
        )

@router.post("/from-external", response_model=schemas.Character)
def create_character_from_external(
    external_char: dict,
    db: Session = Depends(get_db)
):
    """
    Create a local character from an external search result.
    Auto-generates chat_style and example_responses if not provided.
    """
    try:
        # Allow flexible input from external sources (payload may include chat_style/example_responses)
        chat_style = external_char.get("chat_style")
        example_responses = external_char.get("example_responses")

        # Check if character already exists (by external_id+source or name+movie)
        existing = None
        if external_char.get("external_id") and external_char.get("source"):
            existing = db.query(Character).filter(
                Character.external_id == external_char.get("external_id"),
                Character.source == external_char.get("source")
            ).first()

        if not existing:
            existing = db.query(Character).filter(
                Character.name == external_char.get("name"),
                Character.movie == external_char.get("universe_title")
            ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Character '{external_char['name']}' already exists"
            )
        
        # Auto-generate chat_style if not provided
        if not chat_style:
            description = external_char.get("description", "")
            if "witty" in description.lower() or "sarcastic" in description.lower():
                chat_style = "witty and sarcastic"
            elif "wise" in description.lower() or "philosophical" in description.lower():
                chat_style = "wise and philosophical"
            elif "funny" in description.lower() or "humor" in description.lower():
                chat_style = "humorous and lighthearted"
            else:
                chat_style = f"Character from {external_char['universe_title']}"
        
        # Auto-generate example responses if not provided
        if not example_responses:
            example_responses = [
                f"Hello! I'm {external_char['name']}.",
                f"I'm from {external_char['universe_title']}.",
                external_char.get("description", "")[:100] + "..." if len(external_char.get("description", "")) > 100 else external_char.get("description", "Nice to meet you!")
            ]
        
        db_character = Character(
            name=external_char["name"],
            movie=external_char["universe_title"],
            chat_style=chat_style,
            example_responses=example_responses,
            genre=external_char.get("genre"),
            source=external_char.get("source"),
            image_url=external_char.get("image_url"),
            external_id=external_char.get("external_id")
        )
        db.add(db_character)
        db.commit()
        db.refresh(db_character)
        return db_character
    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Character '{external_char['name']}' from '{external_char['universe_title']}' already exists"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating character from external: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create character: {str(e)}")

@router.get("/", response_model=List[schemas.Character])
def get_characters(
    skip: int = 0, 
    limit: int = 100, 
    genre: Optional[str] = Query(None, description="Filter by genre"),
    exclude_generated: bool = Query(True, description="Exclude generated characters (Character_###)"),
    db: Session = Depends(get_db)
):
    try:
        query = db.query(Character)
        
        # Exclude generated characters if requested
        if exclude_generated:
            query = query.filter(
                ~Character.name.like("Character_%"),
                Character.source != "generated"
            )
        
        # Filter by genre if provided
        if genre:
            query = query.filter(Character.genre == genre.lower())
        
        characters = query.offset(skip).limit(limit).all()
        return characters
    except Exception as e:
        logger.error(f"Error fetching characters: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch characters")

@router.get("/my", response_model=List[schemas.Character])
def get_my_characters(
    current_user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get all characters favorited by the current user"""
    try:
        # Get all favorites for the user
        favorites = db.query(UserCharacterFavorite).filter(
            UserCharacterFavorite.user_id == current_user.id
        ).all()
        
        if not favorites:
            return []
        
        character_ids = [fav.character_id for fav in favorites if fav.character_id]
        if not character_ids:
            return []
        
        # Fetch characters and maintain order
        characters = db.query(Character).filter(Character.id.in_(character_ids)).all()
        
        # Sort by the order they were favorited (most recent first)
        character_dict = {char.id: char for char in characters}
        ordered_characters = [character_dict[cid] for cid in character_ids if cid in character_dict]
        
        return ordered_characters
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user favorites: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch favorites: {str(e)}")

@router.get("/{character_id}", response_model=schemas.Character)
def get_character(character_id: int, db: Session = Depends(get_db)):
    try:
        character = db.query(Character).filter(Character.id == character_id).first()
        if character is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Character with id {character_id} not found"
            )
        return character
    except Exception as e:
        logger.error(f"Error fetching character {character_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch character")

@router.put("/{character_id}", response_model=schemas.Character)
def update_character(character_id: int, character: schemas.CharacterCreate, db: Session = Depends(get_db)):
    try:
        db_character = db.query(Character).filter(Character.id == character_id).first()
        if db_character is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Character with id {character_id} not found"
            )
        
        for key, value in character.dict().items():
            setattr(db_character, key, value)
        
        db.commit()
        db.refresh(db_character)
        return db_character
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Character '{character.name}' from '{character.movie}' already exists"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating character: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update character")

@router.delete("/{character_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_character(character_id: int, db: Session = Depends(get_db)):
    try:
        db_character = db.query(Character).filter(Character.id == character_id).first()
        if db_character is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Character with id {character_id} not found"
            )
        
        db.delete(db_character)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting character: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete character")

# Favorites endpoints
@router.post("/{character_id}/favorite", status_code=status.HTTP_201_CREATED)
async def favorite_character(
    character_id: int,
    current_user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Add a character to the current user's favorites and return an AI confirmation message"""
    try:
        # Check if character exists
        character = db.query(Character).filter(Character.id == character_id).first()
        if not character:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Character with id {character_id} not found"
            )

        # Check if already favorited
        existing_favorite = db.query(UserCharacterFavorite).filter(
            UserCharacterFavorite.user_id == current_user.id,
            UserCharacterFavorite.character_id == character_id
        ).first()

        if existing_favorite:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Character is already in your favorites"
            )

        # Create favorite
        favorite = UserCharacterFavorite(
            user_id=current_user.id,
            character_id=character_id
        )
        db.add(favorite)
        db.commit()
        db.refresh(favorite)

        # Generate a short AI confirmation message
        try:
            prompt = f"Write a short friendly confirmation message acknowledging that the user added {character.name} from {character.movie} to their collection. Keep it under 30 words."
            ai_response = await chatbot_service.get_response(
                message=prompt,
                db=db,
                user_id=current_user.id,
                character_id=None
            )
        except Exception:
            ai_response = f"{character.name} has been added to your collection."

        return {"message": "Character added to favorites", "character_id": character_id, "ai_message": ai_response}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error favoriting character: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to favorite character")

@router.delete("/{character_id}/favorite", status_code=status.HTTP_204_NO_CONTENT)
def unfavorite_character(
    character_id: int,
    current_user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a character from the current user's favorites"""
    try:
        favorite = db.query(UserCharacterFavorite).filter(
            UserCharacterFavorite.user_id == current_user.id,
            UserCharacterFavorite.character_id == character_id
        ).first()
        
        if not favorite:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Character is not in your favorites"
            )
        
        db.delete(favorite)
        db.commit()
        return None
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error unfavoriting character: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to unfavorite character")