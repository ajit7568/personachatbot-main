import sys
import os
from sqlalchemy.orm import Session
from typing import List, Dict
import random
from sqlalchemy.exc import IntegrityError

# Add the parent directory to Python path so we can import our models
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from src.database import SessionLocal
from src.models.character import Character

# Sample Indian character data with iconic dialogues and personalities
INDIAN_CHARACTERS: List[Dict] = [
    {
        "name": "Raj (DDLJ)",
        "movie": "Dilwale Dulhania Le Jayenge",
        "chat_style": "romantic, charming, and playful",
        "example_responses": [
            "Bade bade deshon mein aisi choti choti baatein hoti rehti hai...",
            "Ja Simran ja, jee le apni zindagi.",
            "Main ek Hindustani hoon... aur main jaanta hoon ki ek Hindustani ladki ki izzat kya hoti hai.",
            "Kehte hain agar kisi cheez ko dil se chaaho toh puri kayanat usey tumse milane ki koshish mein lag jaati hai."
        ]
    },
    {
        "name": "Gabbar Singh",
        "movie": "Sholay",
        "chat_style": "menacing, dramatic, and intimidating",
        "example_responses": [
            "Kitne aadmi the?",
            "Jo dar gaya, samjho mar gaya!",
            "Holi kab hai? Kab hai Holi?",
            "Ab tera kya hoga, Kaliya?"
        ]
    },
    {
        "name": "Chulbul Pandey",
        "movie": "Dabangg",
        "chat_style": "witty, fearless, and humorous",
        "example_responses": [
            "Thappad se darr nahi lagta sahab, pyaar se lagta hai.",
            "Hum tum mein itne ched karenge ki confuse ho jaoge ki saans kahan se le aur... kahan se nikale.",
            "Swagat nahi karoge hamara?",
            "Hum yahan ke Robin Hood hain... Robinhood Pandey."
        ]
    },
    {
        "name": "Baahubali",
        "movie": "Baahubali: The Beginning",
        "chat_style": "noble, powerful, and righteous",
        "example_responses": [
            "Mera vachan hi hai mera praan.",
            "Jayaa he, Mahishmati!",
            "Mujhe batao, Kattappa ne Baahubali ko kyun maara?",
            "Raja ka dharm hai praja ki raksha karna."
        ]
    },
    {
        "name": "Feluda",
        "movie": "Feluda Series",
        "chat_style": "analytical, intelligent, and observant",
        "example_responses": [
            "Khooni kingkong er khoppor!",
            "Brain-er khoj koro, brain-er khoj koro.",
            "Magajastra! Ei astra-i shobar cheye powerful.",
            "Elementary, my dear Topshe!"
        ]
    },
    {
        "name": "Piku",
        "movie": "Piku",
        "chat_style": "practical, straightforward, and caring",
        "example_responses": [
            "Death is inevitable, constipation is optional!",
            "Relationships are like daily motions - they need attention every day.",
            "Main apni favorite hoon, aur meri life mere terms pe chalegi!"
        ]
    },
    {
        "name": "Mohan Bhargava",
        "movie": "Swades",
        "chat_style": "patriotic, intellectual, and idealistic",
        "example_responses": [
            "Mera Bharat mahaan nahi hai, par yeh dosh lagaane ka haq sirf mujhe hai.",
            "Jab tak todenge nahi, tab tak chodenge nahi!",
            "Hum log science ki madad se chaand tak pahunch sakte hain, par insaaniyat ki madad se insaan tak nahi."
        ]
    },
    {
        "name": "Devi Prasad",
        "movie": "Hera Pheri",
        "chat_style": "comical, naive, and endearing",
        "example_responses": [
            "Utha le re baba, utha le - mere ko nahi re, in dono ko utha le!",
            "21 din mein paisa double... ekdum risk-free scheme hai!",
            "Yeh Baburao ka style hai!"
        ]
    }
]

# Additional data for generating more characters
BOLLYWOOD_MOVIES = [
    "Kabhi Khushi Kabhie Gham",
    "3 Idiots",
    "Zindagi Na Milegi Dobara",
    "Lagaan",
    "Dil Chahta Hai",
    "PK",
    "Queen",
    "Andhadhun",
    "Gully Boy",
    "Chennai Express"
]

SOUTH_INDIAN_MOVIES = [
    "RRR",
    "KGF",
    "Pushpa",
    "Master",
    "Vikram",
    "Super Deluxe",
    "Lucifer",
    "Maheshinte Prathikaaram",
    "Premam",
    "Arjun Reddy"
]

TV_SHOWS = [
    "CID",
    "Taarak Mehta Ka Ooltah Chashmah",
    "Mahabharat",
    "Ramayan",
    "Sacred Games",
    "Mirzapur",
    "Family Man",
    "Scam 1992",
    "Paatal Lok",
    "Made in Heaven"
]

LITERATURE_CHARACTERS = [
    "Byomkesh Bakshi",
    "Inspector Ghote",
    "Swami (RK Narayan)",
    "Shantaram",
    "Malgudi Days Characters",
    "Chandrakanta",
    "Devdas",
    "Umrao Jaan",
    "Parineeta",
    "Meluha's Shiva"
]

REGIONAL_CINEMA = [
    "Prabhas in Adipurush",
    "Mohanlal in Drishyam",
    "Rajinikanth in Robot",
    "Suriya in Jai Bhim",
    "Mammootty in Oru Vadakkan Veeragatha",
    "Dulquer Salmaan in OK Kanmani",
    "Ajith in Valimai",
    "Yash in KGF",
    "Dhanush in Asuran",
    "Jr NTR in RRR"
]

PERSONALITY_TYPES = [
    "witty and sarcastic",
    "passionate and emotional",
    "wise and philosophical",
    "humorous and energetic",
    "intense and dramatic",
    "cool and sophisticated",
    "traditional and values-oriented",
    "street-smart and resourceful",
    "mysterious and calculating",
    "cheerful and optimistic",
    "poetic and romantic",
    "rebellious and passionate",
    "determined and focused",
    "spiritual and enlightened",
    "playful and mischievous",
    "loyal and protective",
    "ambitious and driven",
    "humble and grounded",
    "innovative and progressive",
    "traditional yet modern"
]

CHARACTER_PREFIXES = [
    "Raj", "Rahul", "Vijay", "Arjun", "Krishna", "Ravi", "Amar", "Prem",
    "Kabir", "Dev", "Ranveer", "Karan", "Aarav", "Veer", "Jai", "Aditya",
    "Rohan", "Rohit", "Vikram", "Shiva"
]

COMMON_HINDI_PHRASES = [
    "Zindagi me twist toh hona hi chahiye!",
    "Ekdum jhakaas!",
    "Picture abhi baaki hai mere dost.",
    "Mogambo khush hua!",
    "Tension lene ka nahi, sirf dene ka!",
    "Don ko pakadna mushkil hi nahi, namumkin hai.",
    "Keh ke lunga!",
    "Rishta wahi, soch nayi.",
    "Haar kar jeetne wale ko baazigar kehte hain!",
    "Main apni favorite hoon!"
]

def generate_example_responses(character_type: str) -> List[str]:
    """Generate relevant example responses based on character type."""
    responses = []
    # Add some Hindi/regional language phrases mixed with English
    responses.extend(COMMON_HINDI_PHRASES)
    
    # Add character-specific responses based on personality type
    if "romantic" in character_type or "poetic" in character_type:
        responses.extend([
            "Pyaar dosti hai... agar woh meri sabse achchi dost nahin ban sakti, toh main usse kabhi pyaar kar hi nahi sakta.",
            "Kuch kuch hota hai... tum nahi samjhoge.",
            "Maine aaj tak tumhare alawa kisi se pyaar kiya hi nahi...",
            "Ek ladki ko dekha toh aisa laga...",
            "Ishq mein risk toh lena padta hai... par risk ke bina ishq bhi kya ishq hai?",
            "Mohabbat hai isliye jaane diya... zidd hoti toh baahon mein hoti.",
            "Tum paas ho lekin phir bhi bohot door ho... kyun ho mere saamne majboor ho?"
        ])
    elif "dramatic" in character_type or "rebellious" in character_type:
        responses.extend([
            "Main aaj bhi pheke hue paise nahi uthata!",
            "Parampara, Pratishtha, Anushasan!",
            "Ye hamari zameen hai, aur iske liye hum jaan bhi de sakte hain!",
            "Bhagwan ke liye mujhe chhod do!",
            "System ko badalne ke liye, system ke andar rehna padta hai!",
            "Main udna chahta hoon, daudna chahta hoon, girna bhi chahta hoon... bus, rukna nahi chahta!",
            "Zindagi jeene ke do hi tarike hote hai... ek jo ho raha hai hone do, ya phir jimmedari uthao use badalne ki."
        ])
    elif "humorous" in character_type:
        responses.extend([
            "Life is like a box of golgappas... you never know what flavored paani you'll get!",
            "Bade bade problems mein, chhoti chhoti solutions hoti rehti hai.",
            "Aaj khush toh bahut hoge tum...",
            "Control Uday, Control!"
        ])
    elif "philosophical" in character_type:
        responses.extend([
            "Zindagi badi honi chahiye, lambi nahi.",
            "Kabhi kabhi jeetne ke liye kuch haarna bhi padta hai.",
            "Success ke peeche mat bhaago, excellence ka peecha karo.",
            "Inn cheezon ko samajhna mushkil hi nahi, namumkin hai!"
        ])
    elif "intense" in character_type:
        responses.extend([
            "Jab tak todenge nahi, tab tak chodenge nahi!",
            "Meri cycle ka handle, teri cycle ki seat!",
            "Crime Master Gogo naam hai mera, aankhen nikal ke gotiyan khelta hun main!",
            "Ae police! Darr kar nahi, pyaar se de raha hun..."
        ])
    else:
        # Generic responses for other personality types
        responses.extend([
            "Apun ko life mein kuch bada karna hai!",
            "Izzat se jeena hai toh kya darna?",
            "Dosti ka ek usool hai madam - no sorry, no thank you.",
            "Beta, tumse na ho payega!"
        ])
    
    # Ensure we have at least 5 responses before sampling
    while len(responses) < 5:
        responses.extend(COMMON_HINDI_PHRASES)
    
    # Return 3-4 random unique responses
    num_responses = min(random.randint(3, 4), len(responses))
    return random.sample(responses, num_responses)

def generate_additional_characters(num_characters: int) -> List[Dict]:
    """Generate additional random Indian characters."""
    characters = []
    used_names = set()
    
    # Combine all sources for variety
    all_sources = (BOLLYWOOD_MOVIES + SOUTH_INDIAN_MOVIES + TV_SHOWS + 
                  LITERATURE_CHARACTERS + REGIONAL_CINEMA)
    
    for _ in range(num_characters):
        source = random.choice(all_sources)
        personality = random.choice(PERSONALITY_TYPES)
        
        # Generate a unique character name with more variety
        while True:
            prefix = random.choice(CHARACTER_PREFIXES)
            suffix = random.choice([
                f"_{random.randint(1, 1000)}",
                f" from {source}",
                f" {random.choice(['Kumar', 'Singh', 'Verma', 'Sharma', 'Rao', 'Reddy', 'Nair', 'Menon'])}"
            ])
            name = f"{prefix}{suffix}"
            if name not in used_names:
                used_names.add(name)
                break
        
        characters.append({
            "name": name,
            "movie": source,
            "chat_style": personality,
            "example_responses": generate_example_responses(personality)
        })
    
    return characters

def insert_characters(db: Session, characters: List[Dict]) -> None:
    """Insert characters into the database."""
    successful = 0
    failed = 0
    
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
            successful += 1
        except IntegrityError:
            print(f"Skipping duplicate character: {char_data['name']}")
            db.rollback()
            failed += 1
        except Exception as e:
            print(f"Error adding character {char_data['name']}: {str(e)}")
            db.rollback()
            failed += 1
    
    print(f"\nSummary:")
    print(f"Successfully added: {successful} characters")
    print(f"Failed to add: {failed} characters")

def main():
    # Combine predefined and generated characters
    num_additional = 50 - len(INDIAN_CHARACTERS)
    all_characters = INDIAN_CHARACTERS + generate_additional_characters(num_additional)
    
    # Get database session
    db = SessionLocal()
    try:
        print("Starting to insert Indian characters into the database...")
        insert_characters(db, all_characters)
        print("\nCharacter insertion process completed!")
    finally:
        db.close()

if __name__ == "__main__":
    main()