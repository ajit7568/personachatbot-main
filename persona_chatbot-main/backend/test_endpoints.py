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
from src.models.user import User

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

# Test client
client = TestClient(app)

@pytest.fixture
def test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def sample_character():
    return {
        "name": "Test Character",
        "movie": "Test Movie",
        "chat_style": "witty and sarcastic",
        "example_responses": ["Response 1", "Response 2"]
    }

@pytest.fixture
def sample_user():
    return {
        "email": "test@example.com",
        "password": "testpassword123"
    }

# Authentication Tests
def test_register_user(test_db, sample_user):
    response = client.post("/auth/register", json=sample_user)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == sample_user["email"]
    assert "id" in data

def test_login_user(test_db, sample_user):
    # First register the user
    client.post("/auth/register", json=sample_user)
    
    # Then try to login
    response = client.post("/auth/login", json=sample_user)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_register_duplicate_user(test_db, sample_user):
    # Register first time
    client.post("/auth/register", json=sample_user)
    
    # Try to register again with same email
    response = client.post("/auth/register", json=sample_user)
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]

# Character Tests
def test_create_character(test_db, sample_character):
    response = client.post("/characters/", json=sample_character)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == sample_character["name"]
    assert data["movie"] == sample_character["movie"]
    assert "id" in data

def test_get_characters(test_db, sample_character):
    # Create a character first
    client.post("/characters/", json=sample_character)
    
    # Get all characters
    response = client.get("/characters/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["name"] == sample_character["name"]

def test_get_character_by_id(test_db, sample_character):
    # Create a character first
    create_response = client.post("/characters/", json=sample_character)
    character_id = create_response.json()["id"]
    
    # Get the character by id
    response = client.get(f"/characters/{character_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == sample_character["name"]

def test_update_character(test_db, sample_character):
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

def test_delete_character(test_db, sample_character):
    # Create a character first
    create_response = client.post("/characters/", json=sample_character)
    character_id = create_response.json()["id"]
    
    # Delete the character
    response = client.delete(f"/characters/{character_id}")
    assert response.status_code == 204

    # Try to get the deleted character
    response = client.get(f"/characters/{character_id}")
    assert response.status_code == 404

# Chat Tests
def test_chat_stream(test_db, sample_user, sample_character):
    # Register and login user
    client.post("/auth/register", json=sample_user)
    login_response = client.post("/auth/login", json=sample_user)
    user_id = 1  # First user in test database
    
    # Create a character
    char_response = client.post("/characters/", json=sample_character)
    character_id = char_response.json()["id"]
    
    # Test chat stream
    response = client.get("/chat", params={
        "message": "Hello!",
        "user_id": user_id,
        "character_id": character_id
    })
    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]

def test_chat_messages(test_db, sample_user):
    # Register and login user
    client.post("/auth/register", json=sample_user)
    user_id = 1  # First user in test database
    
    # Get chat messages
    response = client.get(f"/messages/{user_id}")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)