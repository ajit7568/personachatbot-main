# FastAPI React Chatbot Project

This project is a full-stack application that integrates a FastAPI backend with a React frontend to create an AI-powered chatbot. It utilizes a PostgreSQL database for data storage and includes authentication features.

## Project Structure

```
fastapi-react-chatbot
├── backend
│   ├── src
│   │   ├── app.py
│   │   ├── database.py
│   │   ├── models
│   │   │   ├── __init__.py
│   │   │   ├── chat.py
│   │   │   └── user.py
│   │   ├── routes
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   └── chat.py
│   │   ├── schemas
│   │   │   ├── __init__.py
│   │   │   └── chat.py
│   │   └── services
│   │       ├── __init__.py
│   │       ├── auth.py
│   │       └── chatbot.py
│   ├── requirements.txt
│   ├── alembic.ini
│   └── README.md
├── frontend
│   ├── src
│   │   ├── components
│   │   │   ├── Chat.tsx
│   │   │   └── Auth.tsx
│   │   ├── services
│   │   │   ├── api.ts
│   │   │   └── auth.ts
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## Backend

The backend is built using FastAPI and includes:

- **Database Connection**: Managed with SQLAlchemy.
- **Models**: User and Chat models for handling data.
- **Routes**: Authentication and chat-related endpoints.
- **Services**: Logic for authentication and chatbot interaction.

## Frontend

The frontend is developed with React and includes:

- **Components**: Chat and Auth components for user interaction.
- **Services**: API calls and authentication handling.

## Getting Started

1. Clone the repository.
2. Set up the backend by installing dependencies listed in `backend/requirements.txt`.
3. Configure the PostgreSQL database.
4. Run the backend server.
5. Set up the frontend by installing dependencies listed in `frontend/package.json`.
6. Run the React application.

## License

This project is licensed under the MIT License.