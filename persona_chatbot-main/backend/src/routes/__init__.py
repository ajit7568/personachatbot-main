# backend/src/routes/__init__.py

from fastapi import APIRouter

router = APIRouter()

from . import auth, chat

router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(chat.router, prefix="/chat", tags=["chat"])