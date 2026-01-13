from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
import logging

from .. import schemas
from ..database import get_db
from ..models.character import Character

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/characters", tags=["characters"])

@router.post("/", response_model=schemas.Character)
def create_character(character: schemas.CharacterCreate, db: Session = Depends(get_db)):
    try:
        db_character = Character(
            name=character.name,
            movie=character.movie,
            chat_style=character.chat_style,
            example_responses=character.example_responses
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
            example_responses=character.example_responses
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

@router.get("/", response_model=List[schemas.Character])
def get_characters(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    try:
        characters = db.query(Character).offset(skip).limit(limit).all()
        return characters
    except Exception as e:
        logger.error(f"Error fetching characters: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch characters")

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