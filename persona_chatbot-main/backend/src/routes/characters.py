from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from ..services.character_service import character_service

router = APIRouter(prefix="/api/characters", tags=["characters"])

@router.get("/dnd/races")
async def get_dnd_races():
    """Get all available D&D races"""
    return await character_service.get_dnd_races()

@router.get("/dnd/races/{race_name}")
async def get_race_details(race_name: str):
    """Get details for a specific D&D race"""
    return await character_service.get_dnd_race_details(race_name)

@router.get("/anime/search")
async def search_anime_character(name: str):
    """Search for an anime character by name"""
    return await character_service.search_anime_character(name)

@router.get("/generate")
async def generate_character(
    character_type: str,
    name: Optional[str] = None
):
    """
    Generate a character prompt
    - character_type: 'dnd' or 'anime'
    - name: Optional character/race name
    """
    return await character_service.generate_character_prompt(character_type, name)

@router.get("/hybrid")
async def generate_hybrid_character(
    dnd_race: Optional[str] = None,
    anime_character: Optional[str] = None
):
    """
    Generate a hybrid character combining D&D and anime traits
    - dnd_race: Optional D&D race name (e.g., "elf", "dwarf")
    - anime_character: Optional anime character name (e.g., "goku", "naruto")
    """
    if not dnd_race and not anime_character:
        raise HTTPException(
            status_code=400,
            detail="At least one of 'dnd_race' or 'anime_character' must be provided"
        )
    
    return await character_service.generate_hybrid_character(dnd_race, anime_character)
