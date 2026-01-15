from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import auth, chat, character, characters
from .database import create_tables, Base, engine
from . import models  # This will register all models with SQLAlchemy
import os
import logging
from dotenv import load_dotenv

# Suppress passlib bcrypt version warning (harmless compatibility issue)
logging.getLogger('passlib.handlers.bcrypt').setLevel(logging.ERROR)

# Load environment variables
load_dotenv()

app = FastAPI(title="ChatBot API")

# Configure CORS with secure defaults
origins = [
    "http://localhost:3000",  # React development server
    "http://localhost:5000",  # Production build
    "https://*.supabase.co",  # Allow Supabase domains
    "https://persona-chatbot1.vercel.app",  # Vercel frontend
    "https://persona-chatbot1.onrender.com",  # Render backend
    "https://persona-chatbot-tvdl.onrender.com",  # Render backend (alternative)
]

# Add Railway frontend URL from environment variable
cors_origins = os.getenv("CORS_ORIGINS", "").split(",")
origins.extend([origin.strip() for origin in cors_origins if origin.strip()])

# Remove duplicates and empty strings
origins = list(set(filter(None, origins)))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],  # Expose all headers
    max_age=3600  # Cache preflight requests for 1 hour
)

# Include the routes
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(character.router)
app.include_router(characters.router)  # External character search API

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the FastAPI Chatbot API!",
        "version": "1.0.0",
        "status": "healthy"
    }