"""
Script to clean up generated characters (Character_### pattern) and assign genres.
Run this script once after migration to clean up the database.
"""
import sys
import os
from sqlalchemy.orm import Session
import re

# Add the parent directory to Python path so we can import our models
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from src.database import SessionLocal
from src.models.character import Character

def cleanup_generated_characters(db: Session, delete: bool = False):
    """
    Find and optionally delete characters matching Character_### pattern.
    If delete=False, marks them as source='generated' instead.
    """
    # Pattern to match Character_### or similar generated names
    pattern = re.compile(r'^Character_\d+', re.IGNORECASE)
    
    generated_chars = db.query(Character).filter(
        Character.name.op('REGEXP')(r'^Character_\d+')
    ).all()
    
    # Fallback: filter in Python if REGEXP doesn't work (SQLite)
    if not generated_chars:
        all_chars = db.query(Character).all()
        generated_chars = [c for c in all_chars if pattern.match(c.name)]
    
    print(f"Found {len(generated_chars)} generated characters")
    
    if delete:
        for char in generated_chars:
            print(f"Deleting: {char.name} (ID: {char.id})")
            db.delete(char)
        db.commit()
        print(f"Deleted {len(generated_chars)} generated characters")
    else:
        for char in generated_chars:
            if char.source != "generated":
                print(f"Marking as generated: {char.name} (ID: {char.id})")
                char.source = "generated"
        db.commit()
        print(f"Marked {len(generated_chars)} characters as generated")

def assign_genres(db: Session):
    """
    Assign genres to characters based on movie/show name and chat_style.
    Uses keyword matching heuristics.
    """
    characters = db.query(Character).filter(Character.genre.is_(None)).all()
    print(f"Assigning genres to {len(characters)} characters without genres")
    
    genre_keywords = {
        "scifi": ["sci-fi", "science fiction", "space", "future", "star wars", "star trek", "matrix", "blade runner", "alien", "terminator", "cyberpunk"],
        "fantasy": ["fantasy", "magic", "wizard", "dragon", "lord of the rings", "harry potter", "game of thrones", "witcher", "dungeons", "d&d"],
        "comedy": ["comedy", "funny", "humor", "humour", "comic", "sitcom", "office", "friends", "parks and rec"],
        "drama": ["drama", "tragedy", "emotional", "serious", "melodrama", "soap"],
        "action": ["action", "adventure", "hero", "warrior", "fight", "battle", "marvel", "dc", "superhero", "batman", "iron man", "avengers"]
    }
    
    assigned = 0
    for char in characters:
        text = f"{char.movie} {char.chat_style}".lower()
        
        # Check each genre
        for genre, keywords in genre_keywords.items():
            if any(keyword in text for keyword in keywords):
                char.genre = genre
                assigned += 1
                print(f"Assigned '{genre}' to {char.name} (from {char.movie})")
                break
        
        # If still no genre, try to infer from movie name patterns
        if not char.genre:
            movie_lower = char.movie.lower()
            if any(x in movie_lower for x in ["marvel", "avengers", "iron man", "captain", "spider", "thor"]):
                char.genre = "action"
                assigned += 1
            elif any(x in movie_lower for x in ["harry potter", "lord of the rings", "fantasy"]):
                char.genre = "fantasy"
                assigned += 1
            elif any(x in movie_lower for x in ["star wars", "star trek", "alien", "blade runner"]):
                char.genre = "scifi"
                assigned += 1
    
    db.commit()
    print(f"Assigned genres to {assigned} characters")

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Clean up generated characters and assign genres")
    parser.add_argument("--delete", action="store_true", help="Delete generated characters instead of marking them")
    parser.add_argument("--genres-only", action="store_true", help="Only assign genres, don't clean up")
    parser.add_argument("--cleanup-only", action="store_true", help="Only clean up, don't assign genres")
    
    args = parser.parse_args()
    
    db = SessionLocal()
    try:
        if not args.genres_only:
            cleanup_generated_characters(db, delete=args.delete)
        
        if not args.cleanup_only:
            assign_genres(db)
        
        print("\nCleanup and genre assignment completed!")
    finally:
        db.close()

if __name__ == "__main__":
    main()
