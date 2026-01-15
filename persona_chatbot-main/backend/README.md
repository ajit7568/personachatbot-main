# backend/README.md

# FastAPI React Chatbot Backend

This is the backend for the FastAPI React Chatbot project. It provides the API and database functionalities required for the chatbot application.

## Project Structure

- **src/**: Contains the source code for the FastAPI application.
  - **app.py**: Entry point of the FastAPI application.
  - **database.py**: Handles database connection setup and models.
  - **models/**: Contains database models.
  - **routes/**: Contains API route definitions.
  - **schemas/**: Contains Pydantic schemas for request validation and response serialization.
  - **services/**: Contains business logic and services for authentication and chatbot interaction.

## Requirements

To run this project, you need to install the required dependencies. You can do this by running:

```
pip install -r requirements.txt
```

## Database Migration

This project uses Alembic for database migrations. To initialize the database, run:

```
alembic upgrade head
```

## Running the Application

**IMPORTANT:** Always use the virtual environment Python to run uvicorn to ensure all dependencies are available.

### Option 1: Using the startup script (Recommended)
```bash
# Windows PowerShell
.\start_server.ps1

# Windows Command Prompt
start_server.bat
```

### Option 2: Manual activation
```bash
# Activate virtual environment first
# Windows PowerShell:
.\venv\Scripts\Activate.ps1

# Windows Command Prompt:
venv\Scripts\activate.bat

# Then run uvicorn
python -m uvicorn src.app:app --reload
```

### Option 3: Direct venv Python (Most reliable)
```bash
# Windows PowerShell:
.\venv\Scripts\python.exe -m uvicorn src.app:app --reload

# Windows Command Prompt:
venv\Scripts\python.exe -m uvicorn src.app:app --reload
```

**Note:** If you get `ModuleNotFoundError` errors, it means uvicorn is not using the venv Python. Use Option 3 above to ensure the correct Python is used.

## API Documentation

The API documentation can be accessed at `http://localhost:8000/docs` once the application is running.

## License

This project is licensed under the MIT License.