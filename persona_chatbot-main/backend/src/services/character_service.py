import requests
from typing import Dict, List, Optional
from fastapi import HTTPException
import logging

# Configure logging
logger = logging.getLogger(__name__)

class CharacterService:
    def __init__(self):
        self.dnd_base_url = "https://www.dnd5eapi.co/api"
        self.anilist_url = "https://graphql.anilist.co"

    async def get_dnd_races(self) -> List[Dict]:
        """Get all available D&D races"""
        try:
            response = requests.get(f"{self.dnd_base_url}/races")
            response.raise_for_status()
            return response.json().get("results", [])
        except Exception as e:
            logger.error(f"Error fetching D&D races: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to fetch D&D races")

    async def get_dnd_race_details(self, race_name: str) -> Dict:
        """Get details for a specific D&D race"""
        try:
            response = requests.get(f"{self.dnd_base_url}/races/{race_name.lower()}")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error fetching D&D race details: {str(e)}")
            raise HTTPException(status_code=404, detail="Race not found")

    async def search_anime_character(self, name: str) -> Dict:
        """Search for an anime character using AniList GraphQL API"""
        query = """
        query ($search: String) {
            Character(search: $search) {
                name {
                    full
                    native
                    alternative
                }
                image {
                    large
                    medium
                }
                description(asHtml: false)
                media(perPage: 1) {
                    nodes {
                        title {
                            romaji
                            english
                            native
                        }
                    }
                }
            }
        }
        """
        try:
            response = requests.post(
                self.anilist_url,
                json={
                    "query": query,
                    "variables": {"search": name}
                }
            )
            response.raise_for_status()
            data = response.json()
            return data.get("data", {}).get("Character")
        except Exception as e:
            logger.error(f"Error searching anime character: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to search anime character")

    async def generate_character_prompt(self, character_type: str, name: Optional[str] = None) -> Dict:
        """Generate a character prompt based on type and optional name"""
        if character_type.lower() == "dnd":
            races = await self.get_dnd_races()
            race = next((r for r in races if name and r["name"].lower() == name.lower()), None) if name else None
            if not race and name:
                raise HTTPException(status_code=404, detail=f"D&D race '{name}' not found")
            race = race or races[0]  # Default to first race if none specified
            details = await self.get_dnd_race_details(race["index"])
            
            return {
                "type": "dnd",
                "name": race["name"],
                "description": f"A {race['name']} character with {details.get('age', 'various')} age characteristics. " +
                              f"Known for {details.get('alignment', 'various alignments')} alignments. " +
                              f"Typical traits: {', '.join(trait.get('name', '') for trait in details.get('traits', []))}",
                "source": "D&D 5e"
            }
            
        elif character_type.lower() == "anime":
            if not name:
                raise HTTPException(status_code=400, detail="Name is required for anime character search")
                
            char_data = await self.search_anime_character(name)
            if not char_data:
                raise HTTPException(status_code=404, detail="Anime character not found")
                
            return {
                "type": "anime",
                "name": char_data["name"]["full"] or char_data["name"]["native"],
                "description": char_data.get("description", "No description available."),
                "image": char_data["image"]["large"] if char_data.get("image") else None,
                "source": char_data.get("media", {}).get("nodes", [{}])[0].get("title", {}).get("english", "Unknown")
            }
            
        else:
            raise HTTPException(status_code=400, detail="Invalid character type. Use 'dnd' or 'anime'")

# Create a singleton instance
character_service = CharacterService()
