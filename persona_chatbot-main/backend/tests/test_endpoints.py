import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import json

from src.database import Base, get_db
from src.app import app
from src.models.character import Character
from src.models.chat import Chat

# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override the get_db dependency
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def sample_character():
    return {
        "name": "Test Character",
        "movie": "Test Movie",
        "chat_style": "witty and sarcastic",
        "example_responses": ["Response 1", "Response 2", "Response 3"]
    }

@pytest.fixture
def sample_chat_message():
    return {
        "message": "Hello!",
        "user_id": 1,
        "character_id": 1
    }

def test_create_character(sample_character):
    response = client.post("/characters/", json=sample_character)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == sample_character["name"]
    assert data["movie"] == sample_character["movie"]
    assert "id" in data

def test_get_characters(sample_character):
    # Create a character first
    client.post("/characters/", json=sample_character)
    
    response = client.get("/characters/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["name"] == sample_character["name"]

def test_get_character_by_id(sample_character):
    # Create a character first
    create_response = client.post("/characters/", json=sample_character)
    character_id = create_response.json()["id"]
    
    response = client.get(f"/characters/{character_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == sample_character["name"]

def test_update_character(sample_character):
    # Create a character first
    create_response = client.post("/characters/", json=sample_character)
    character_id = create_response.json()["id"]
    
    # Update the character
    updated_data = sample_character.copy()
    updated_data["name"] = "Updated Name"
    response = client.put(f"/characters/{character_id}", json=updated_data)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"

def test_delete_character(sample_character):
    # Create a character first
    create_response = client.post("/characters/", json=sample_character)
    character_id = create_response.json()["id"]
    
    # Delete the character
    response = client.delete(f"/characters/{character_id}")
    assert response.status_code == 204
    
    # Verify character is deleted
    get_response = client.get(f"/characters/{character_id}")
    assert get_response.status_code == 404

@pytest.mark.asyncio
async def test_chat_stream(sample_character):
    # Create a character first
    create_response = client.post("/characters/", json=sample_character)
    character_id = create_response.json()["id"]
    
    # Test chat stream
    response = client.get("/chat", params={
        "message": "Hello!",
        "user_id": 1,
        "character_id": character_id
    })
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/event-stream; charset=utf-8"

def test_chat_messages(sample_character, sample_chat_message):
    # Create a character first
    create_response = client.post("/characters/", json=sample_character)
    character_id = create_response.json()["id"]
    
    # Create a chat message
    sample_chat_message["character_id"] = character_id
    client.post("/chat", json=sample_chat_message)
    
    # Get chat messages
    response = client.get(f"/messages/{sample_chat_message['user_id']}")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        assert data[0]["user_id"] == sample_chat_message["user_id"]

def test_duplicate_character(sample_character):
    # Create first character
    response1 = client.post("/characters/", json=sample_character)
    assert response1.status_code == 200
    
    # Try to create duplicate character
    response2 = client.post("/characters/", json=sample_character)
    assert response2.status_code == 409  # Conflict
    assert "already exists" in response2.json()["detail"].lower()

def test_invalid_character_id():
    response = client.get("/characters/999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

def test_invalid_chat_message():
    invalid_message = {
        "message": "",  # Empty message
        "user_id": 1
    }
    response = client.post("/chat", json=invalid_message)
    assert response.status_code == 422  # Unprocessable Entity