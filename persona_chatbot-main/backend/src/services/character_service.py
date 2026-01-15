try:
    import requests
except ImportError:
    import sys
    print("ERROR: 'requests' module not found. Please ensure you're running with the virtual environment Python.")
    print(f"Current Python: {sys.executable}")
    print("To fix this, run uvicorn using: venv\\Scripts\\python.exe -m uvicorn src.app:app --reload")
    raise

from typing import Dict, List, Optional
from fastapi import HTTPException
import logging
import os
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

# Type alias for external character result
ExternalCharacterResult = Dict[str, Optional[str]]

class CharacterService:
    def __init__(self):
        self.dnd_base_url = "https://www.dnd5eapi.co/api"
        self.anilist_url = "https://graphql.anilist.co"
        self.tmdb_base_url = "https://api.themoviedb.org/3"
        self.tmdb_api_key = os.getenv("TMDB_API_KEY")
        self.openlibrary_base_url = "https://openlibrary.org"
        self.wikipedia_api_url = "https://en.wikipedia.org/api/rest_v1"

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

    async def search_anime_characters(self, query: str, limit: int = 10) -> List[ExternalCharacterResult]:
        """Search for anime characters using AniList GraphQL API and return normalized results"""
        search_query = """
        query ($search: String, $perPage: Int) {
            Page(perPage: $perPage) {
                characters(search: $search) {
                    id
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
                            genres
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
                    "query": search_query,
                    "variables": {"search": query, "perPage": limit}
                },
                timeout=10,
                headers={"Content-Type": "application/json", "Accept": "application/json"}
            )
            response.raise_for_status()
            data = response.json()
            
            # Safely extract characters with proper null checks
            if not data or "data" not in data:
                return []
            
            page_data = data.get("data", {})
            if not page_data or "Page" not in page_data:
                return []
            
            page = page_data.get("Page", {})
            if not page:
                return []
            
            characters = page.get("characters", [])
            if not characters:
                return []
            
            results = []
            for char in characters:
                if not char:
                    continue
                
                # Safely get name
                name_obj = char.get("name") or {}
                name = name_obj.get("full") or name_obj.get("native") or "Unknown"
                
                # Safely get media info
                media_nodes = char.get("media", {}).get("nodes", []) if char.get("media") else []
                media_title = "Unknown"
                genre = None
                if media_nodes and len(media_nodes) > 0:
                    first_media = media_nodes[0] or {}
                    title_obj = first_media.get("title", {}) or {}
                    media_title = title_obj.get("english") or title_obj.get("romaji") or title_obj.get("native") or "Unknown"
                    genres = first_media.get("genres", [])
                    if genres and len(genres) > 0:
                        genre = genres[0].lower() if isinstance(genres[0], str) else None
                
                # Safely get image
                image_obj = char.get("image") or {}
                image_url = image_obj.get("large") or image_obj.get("medium") or None
                
                # Safely get description
                description = char.get("description") or "No description available."
                if isinstance(description, str):
                    description = description[:500]
                else:
                    description = "No description available."
                
                results.append({
                    "name": name,
                    "universe_title": media_title,
                    "description": description,
                    "image_url": image_url,
                    "genre": genre,
                    "source": "anilist",
                    "external_id": str(char.get("id", ""))
                })
            return results
        except Exception as e:
            logger.error(f"Error searching anime characters: {str(e)}")
            return []

    async def search_tmdb_person_or_character(self, query: str, limit: int = 10) -> List[ExternalCharacterResult]:
        """Search TMDB for people/actors/characters in movies and TV shows"""
        if not self.tmdb_api_key:
            logger.warning("TMDB_API_KEY not configured, skipping TMDB search")
            return []
        
        results = []
        try:
            # Search for people (actors/characters)
            person_url = f"{self.tmdb_base_url}/search/person"
            person_params = {
                "api_key": self.tmdb_api_key,
                "query": query,
                "page": 1
            }
            person_response = requests.get(person_url, params=person_params, timeout=10)
            person_response.raise_for_status()
            person_data = person_response.json()
            
            for person in person_data.get("results", [])[:limit]:
                # Get person details for biography
                person_id = person.get("id")
                if not person_id:
                    continue
                
                detail_url = f"{self.tmdb_base_url}/person/{person_id}"
                detail_params = {"api_key": self.tmdb_api_key}
                try:
                    detail_response = requests.get(detail_url, params=detail_params, timeout=10)
                    detail_response.raise_for_status()
                    detail_data = detail_response.json()
                    biography = detail_data.get("biography", "")[:500]
                except:
                    biography = person.get("known_for_department", "")
                
                # Get known for (movies/TV)
                known_for = person.get("known_for", [])
                universe_title = "Unknown"
                genre = None
                if known_for:
                    first_item = known_for[0]
                    universe_title = first_item.get("title") or first_item.get("name", "Unknown")
                    genre_ids = first_item.get("genre_ids", [])
                    if genre_ids:
                        # Map common TMDB genre IDs to our genres
                        genre_map = {
                            28: "action", 12: "action", 16: "fantasy", 35: "comedy",
                            80: "drama", 878: "scifi", 10751: "comedy", 14: "fantasy"
                        }
                        genre = genre_map.get(genre_ids[0])
                
                profile_path = person.get("profile_path")
                image_url = f"https://image.tmdb.org/t/p/w500{profile_path}" if profile_path else None
                
                results.append({
                    "name": person.get("name", "Unknown"),
                    "universe_title": universe_title,
                    "description": biography or f"Known for {person.get('known_for_department', 'acting')}",
                    "image_url": image_url,
                    "genre": genre,
                    "source": "tmdb",
                    "external_id": str(person_id)
                })
            
            return results[:limit]
        except Exception as e:
            logger.error(f"Error searching TMDB: {str(e)}")
            return results  # Return partial results if available

    async def search_openlibrary_character_or_author(self, query: str, limit: int = 10) -> List[ExternalCharacterResult]:
        """Search OpenLibrary for book characters and authors"""
        results = []
        try:
            # Search for works (books)
            search_url = f"{self.openlibrary_base_url}/search.json"
            params = {
                "q": query,
                "limit": limit,
                "fields": "key,title,author_name,first_publish_year,subject,cover_i"
            }
            response = requests.get(search_url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            for doc in data.get("docs", []):
                title = doc.get("title", "Unknown")
                author_name = doc.get("author_name", ["Unknown"])[0] if doc.get("author_name") else "Unknown"
                subjects = doc.get("subject", [])
                genre = None
                if subjects:
                    # Map common subjects to genres
                    subject_lower = subjects[0].lower()
                    if any(x in subject_lower for x in ["science fiction", "scifi", "sf"]):
                        genre = "scifi"
                    elif any(x in subject_lower for x in ["fantasy", "magic"]):
                        genre = "fantasy"
                    elif any(x in subject_lower for x in ["comedy", "humor", "humour"]):
                        genre = "comedy"
                    elif any(x in subject_lower for x in ["drama", "tragedy"]):
                        genre = "drama"
                    elif any(x in subject_lower for x in ["action", "adventure", "thriller"]):
                        genre = "action"
                
                cover_id = doc.get("cover_i")
                image_url = f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg" if cover_id else None
                
                # Try to extract character name from query or use author/book title
                name = query if len(query.split()) <= 3 else author_name
                
                results.append({
                    "name": name,
                    "universe_title": title,
                    "description": f"Character from '{title}' by {author_name}. Subjects: {', '.join(subjects[:3])}"[:500],
                    "image_url": image_url,
                    "genre": genre,
                    "source": "openlibrary",
                    "external_id": doc.get("key", "").replace("/works/", "")
                })
            
            return results[:limit]
        except Exception as e:
            logger.error(f"Error searching OpenLibrary: {str(e)}")
            return results

    async def search_wikipedia(self, query: str, limit: int = 10) -> List[ExternalCharacterResult]:
        """Search Wikipedia for characters (fallback for long-tail searches)"""
        results = []
        try:
            # Use Wikipedia MediaWiki API for search (more reliable than REST API)
            search_url = "https://en.wikipedia.org/w/api.php"
            headers = {
                "User-Agent": "PersonaChatbot/1.0 (https://github.com/yourusername/personachatbot; contact@example.com)"
            }
            
            # First, search for pages
            search_params = {
                "action": "query",
                "format": "json",
                "list": "search",
                "srsearch": query,
                "srlimit": limit,
                "srnamespace": 0  # Main namespace only
            }
            search_response = requests.get(search_url, params=search_params, headers=headers, timeout=10)
            search_response.raise_for_status()
            search_data = search_response.json()
            
            search_results = search_data.get("query", {}).get("search", [])
            if not search_results:
                return results
            
            # Get page titles
            titles = [result.get("title", "") for result in search_results[:limit] if result.get("title")]
            if not titles:
                return results
            
            # Get page summaries using REST API
            titles_str = "|".join(titles)
            summary_url = f"{self.wikipedia_api_url}/page/summary/{titles[0].replace(' ', '_')}"
            
            for title in titles[:limit]:
                try:
                    # Get page summary for each title
                    summary_url = f"{self.wikipedia_api_url}/page/summary/{title.replace(' ', '_')}"
                    summary_response = requests.get(summary_url, headers=headers, timeout=10)
                    
                    if summary_response.status_code == 200:
                        summary_data = summary_response.json()
                        extract = summary_data.get("extract", "")[:500]
                        thumbnail = summary_data.get("thumbnail", {}).get("source") if summary_data.get("thumbnail") else None
                        page_type = summary_data.get("type", "")
                    else:
                        # Fallback: use search snippet
                        search_result = next((r for r in search_results if r.get("title") == title), {})
                        extract = search_result.get("snippet", "No description available.").replace("<span class=\"searchmatch\">", "").replace("</span>", "")[:500]
                        thumbnail = None
                        page_type = "unknown"
                    
                    # Try to infer genre from description
                    extract_lower = extract.lower()
                    genre = None
                    if any(x in extract_lower for x in ["science fiction", "scifi", "space", "future", "futuristic"]):
                        genre = "scifi"
                    elif any(x in extract_lower for x in ["fantasy", "magic", "wizard", "dragon", "mythical"]):
                        genre = "fantasy"
                    elif any(x in extract_lower for x in ["comedy", "humor", "funny", "humorous"]):
                        genre = "comedy"
                    elif any(x in extract_lower for x in ["drama", "tragedy", "emotional", "serious"]):
                        genre = "drama"
                    elif any(x in extract_lower for x in ["action", "adventure", "hero", "warrior", "battle"]):
                        genre = "action"
                    
                    # Determine universe_title from page type or description
                    universe_title = "Wikipedia"
                    if page_type == "disambiguation":
                        universe_title = "Multiple topics"
                    elif "character" in extract_lower or "fictional" in extract_lower:
                        # Try to extract source from extract
                        if "from" in extract_lower:
                            parts = extract.split("from")
                            if len(parts) > 1:
                                universe_title = parts[1].split(".")[0].strip()[:50]
                    
                    results.append({
                        "name": title,
                        "universe_title": universe_title,
                        "description": extract,
                        "image_url": thumbnail,
                        "genre": genre,
                        "source": "wikipedia",
                        "external_id": title.replace(" ", "_")
                    })
                except Exception as e:
                    logger.warning(f"Error fetching Wikipedia page '{title}': {str(e)}")
                    # Add basic result even if summary fails
                    results.append({
                        "name": title,
                        "universe_title": "Wikipedia",
                        "description": f"Wikipedia page about {title}",
                        "image_url": None,
                        "genre": None,
                        "source": "wikipedia",
                        "external_id": title.replace(" ", "_")
                    })
            
            return results[:limit]
        except Exception as e:
            logger.error(f"Error searching Wikipedia: {str(e)}")
            return results

    async def search_external_characters(
        self, 
        query: str, 
        category: str = "other", 
        limit: int = 10
    ) -> List[ExternalCharacterResult]:
        """Unified search across all external APIs based on category"""
        category_lower = category.lower()
        
        if category_lower == "anime":
            return await self.search_anime_characters(query, limit)
        elif category_lower in ["movie", "tv", "bollywood", "hollywood"]:
            # Try TMDB first, fallback to Wikipedia
            tmdb_results = await self.search_tmdb_person_or_character(query, limit)
            if tmdb_results:
                return tmdb_results
            # Fallback to Wikipedia
            return await self.search_wikipedia(query, limit)
        elif category_lower == "book":
            # Try OpenLibrary first, fallback to Wikipedia
            ol_results = await self.search_openlibrary_character_or_author(query, limit)
            if ol_results:
                return ol_results
            # Fallback to Wikipedia
            return await self.search_wikipedia(query, limit)
        elif category_lower == "all":
            # Aggregate results from multiple sources, de-duplicate by (source, external_id or name)
            results: List[ExternalCharacterResult] = []
            seen = set()

            # Try AniList
            try:
                anime = await self.search_anime_characters(query, limit)
                for r in anime:
                    key = (r.get("source"), r.get("external_id") or r.get("name"))
                    if key not in seen:
                        seen.add(key)
                        results.append(r)
            except Exception:
                pass

            # Try TMDB
            try:
                tmdb = await self.search_tmdb_person_or_character(query, limit)
                for r in tmdb:
                    key = (r.get("source"), r.get("external_id") or r.get("name"))
                    if key not in seen:
                        seen.add(key)
                        results.append(r)
            except Exception:
                pass

            # Try OpenLibrary
            try:
                ol = await self.search_openlibrary_character_or_author(query, limit)
                for r in ol:
                    key = (r.get("source"), r.get("external_id") or r.get("name"))
                    if key not in seen:
                        seen.add(key)
                        results.append(r)
            except Exception:
                pass

            # Finally try Wikipedia
            try:
                wiki = await self.search_wikipedia(query, limit)
                for r in wiki:
                    key = (r.get("source"), r.get("external_id") or r.get("name"))
                    if key not in seen:
                        seen.add(key)
                        results.append(r)
            except Exception:
                pass

            # Limit final results
            return results[:limit]
        else:
            # Default: try Wikipedia
            return await self.search_wikipedia(query, limit)

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

    async def generate_hybrid_character(self, dnd_race: Optional[str] = None, anime_character: Optional[str] = None) -> Dict:
        """Generate a hybrid character combining D&D and anime traits"""
        # This is a placeholder - can be enhanced later with actual hybrid generation logic
        result = {
            "type": "hybrid",
            "name": "Hybrid Character",
            "description": "A character combining traits from different sources."
        }
        if dnd_race:
            result["dnd_race"] = dnd_race
        if anime_character:
            result["anime_character"] = anime_character
        return result

# Create a singleton instance
character_service = CharacterService()
