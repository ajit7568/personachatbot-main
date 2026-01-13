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

To start the FastAPI application, use the following command:

```
uvicorn src.app:app --reload
```

## API Documentation

The API documentation can be accessed at `http://localhost:8000/docs` once the application is running.

## License

This project is licensed under the MIT License.