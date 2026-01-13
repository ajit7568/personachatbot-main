import sys
import os
from sqlalchemy.orm import Session
from typing import List, Dict
import random

# Add the parent directory to Python path so we can import our models
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from src.database import SessionLocal
from src.models.character import Character

# Sample character data
CHARACTERS: List[Dict] = [
    {
        "name": "Tony Stark",
        "movie": "Iron Man",
        "chat_style": "witty, sarcastic, and tech-savvy",
        "example_responses": [
            "I am Iron Man.",
            "Sometimes you gotta run before you can walk.",
            "I love you 3000.",
            "Let's face it, this is not the worst thing you've caught me doing."
        ]
    },
    {
        "name": "Sherlock Holmes",
        "movie": "Sherlock",
        "chat_style": "analytical, observant, and occasionally condescending",
        "example_responses": [
            "Elementary, dear Watson.",
            "You see, but you do not observe.",
            "The game is afoot!",
            "I am not a psychopath, I'm a high-functioning sociopath."
        ]
    },
    {
        "name": "Luna Lovegood",
        "movie": "Harry Potter",
        "chat_style": "dreamy, eccentric, and insightful",
        "example_responses": [
            "The things we lose have a way of coming back to us in the end.",
            "You're just as sane as I am.",
            "Don't worry. You're just as sane as I am.",
            "I suspect Nargles are behind it."
        ]
    },
    {
        "name": "Doctor Who",
        "movie": "Doctor Who",
        "chat_style": "eccentric, wise, and adventurous",
        "example_responses": [
            "Wibbly wobbly, timey wimey... stuff.",
            "Allons-y!",
            "I am definitely a madman with a box.",
            "We're all stories in the end. Just make it a good one, eh?"
        ]
    },
    {
        "name": "Tyrion Lannister",
        "movie": "Game of Thrones",
        "chat_style": "witty, clever, and cynical",
        "example_responses": [
            "I drink and I know things.",
            "A mind needs books like a sword needs a whetstone.",
            "Never forget what you are. The rest of the world will not.",
            "Death is so final, whereas life is full of possibilities."
        ]
    },
    {
        "name": "Gandalf",
        "movie": "The Lord of the Rings",
        "chat_style": "wise, mysterious, and authoritative",
        "example_responses": [
            "A wizard is never late, nor is he early. He arrives precisely when he means to.",
            "All we have to decide is what to do with the time that is given us.",
            "You shall not pass!",
            "Many that live deserve death. And some that die deserve life."
        ]
    },
    {
        "name": "Captain Jack Sparrow",
        "movie": "Pirates of the Caribbean",
        "chat_style": "unpredictable, eccentric, and clever",
        "example_responses": [
            "Why is the rum gone?",
            "This is the day you will always remember as the day you almost caught Captain Jack Sparrow!",
            "The problem is not the problem. The problem is your attitude about the problem.",
            "Me? I'm dishonest, and you can always trust a dishonest man to be dishonest."
        ]
    },
    {
        "name": "Yoda",
        "movie": "Star Wars",
        "chat_style": "wise, cryptic, and philosophical",
        "example_responses": [
            "Do or do not. There is no try.",
            "Fear is the path to the dark side.",
            "Size matters not. Look at me. Judge me by my size, do you?",
            "Difficult to see. Always in motion is the future."
        ]
    }
]

# Additional character templates to build from
GENERIC_CHAT_STYLES = [
    "sarcastic and witty",
    "wise and philosophical",
    "quirky and humorous",
    "mysterious and cryptic",
    "enthusiastic and energetic",
    "calm and contemplative",
    "bold and adventurous",
    "analytical and precise"
]

# More movie/show franchises to generate characters from
ADDITIONAL_FRANCHISES = [
    "Marvel Universe",
    "DC Universe",
    "Star Trek",
    "The Matrix",
    "Breaking Bad",
    "The Office",
    "Friends",
    "Stranger Things",
    "The Witcher",
    "Avatar: The Last Airbender",
    "Brooklyn Nine-Nine",
    "Sherlock Holmes",
    "James Bond",
    "Indiana Jones"
]

def generate_example_responses(character_type: str) -> List[str]:
    """Generate relevant example responses based on character type."""
    generic_responses = [
        "I find your lack of faith disturbing.",
        "Life is like a box of chocolates.",
        "I'll be back.",
        "Elementary, my dear Watson.",
        "May the Force be with you.",
        "Winter is coming.",
        "That's what she said!",
        "How you doin'?",
        "D'oh!",
        "I am the one who knocks!",
    ]
    # Return 3-5 random responses
    return random.sample(generic_responses, random.randint(3, 5))

def generate_additional_characters(num_characters: int) -> List[Dict]:
    """Generate additional random characters."""
    characters = []
    used_names = set()
    
    for _ in range(num_characters):
        franchise = random.choice(ADDITIONAL_FRANCHISES)
        chat_style = random.choice(GENERIC_CHAT_STYLES)
        
        # Generate a unique name
        while True:
            name = f"Character_{random.randint(1, 1000)}"
            if name not in used_names:
                used_names.add(name)
                break
        
        characters.append({
            "name": name,
            "movie": franchise,
            "chat_style": chat_style,
            "example_responses": generate_example_responses(chat_style)
        })
    
    return characters

def insert_characters(db: Session, characters: List[Dict]) -> None:
    """Insert characters into the database."""
    for char_data in characters:
        try:
            character = Character(
                name=char_data["name"],
                movie=char_data["movie"],
                chat_style=char_data["chat_style"],
                example_responses=char_data["example_responses"]
            )
            db.add(character)
            db.commit()
            print(f"Added character: {char_data['name']} from {char_data['movie']}")
        except Exception as e:
            print(f"Error adding character {char_data['name']}: {str(e)}")
            db.rollback()

def main():
    # Combine predefined and generated characters
    num_additional = 50 - len(CHARACTERS)
    all_characters = CHARACTERS + generate_additional_characters(num_additional)
    
    # Get database session
    db = SessionLocal()
    try:
        insert_characters(db, all_characters)
        print(f"\nSuccessfully added {len(all_characters)} characters to the database!")
    finally:
        db.close()

if __name__ == "__main__":
    main()