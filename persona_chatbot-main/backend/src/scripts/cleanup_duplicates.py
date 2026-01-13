from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.sql import text
import os
import sys
import logging

# Add the parent directory to the path so we can import our models
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from src.database import Base, get_db
from src.models.character import Character
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def cleanup_duplicate_characters(db: Session) -> int:
    """
    Identifies and removes duplicate characters, keeping only the first occurrence (lowest ID).
    Returns the number of duplicates removed.
    """
    try:
        # First, find all duplicate name+movie combinations
        duplicates = db.query(
            Character.name,
            Character.movie,
            func.count('*').label('count'),
            func.min(Character.id).label('min_id')
        ).group_by(
            Character.name,
            Character.movie
        ).having(
            func.count('*') > 1
        ).all()

        total_removed = 0
        for name, movie, count, min_id in duplicates:
            # Get all IDs for this name+movie combination
            duplicate_records = db.query(Character.id).filter(
                Character.name == name,
                Character.movie == movie,
                Character.id != min_id  # Exclude the one we want to keep
            ).all()
            
            ids_to_remove = [r[0] for r in duplicate_records]
            
            logger.info(f"Found duplicates for {name} from {movie}:")
            logger.info(f"  Keeping ID: {min_id}")
            logger.info(f"  Removing IDs: {ids_to_remove}")
            
            # Delete duplicates
            deleted = db.query(Character).filter(
                Character.id.in_(ids_to_remove)
            ).delete(synchronize_session=False)
            
            total_removed += deleted

        if total_removed > 0:
            db.commit()
            logger.info(f"Cleanup complete. Removed {total_removed} duplicate entries.")
        else:
            logger.info("No duplicates found.")
        
        return total_removed

    except Exception as e:
        logger.error(f"Error during cleanup: {e}")
        db.rollback()
        raise

def main():
    """
    Main function to run the cleanup script.
    """
    logger.info("Starting duplicate character cleanup...")
    db = next(get_db())
    try:
        cleanup_duplicate_characters(db)
    finally:
        db.close()
    logger.info("Script completed.")

if __name__ == "__main__":
    main()