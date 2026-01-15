@echo off
REM Activate virtual environment and run uvicorn with the venv Python
cd /d %~dp0
call venv\Scripts\activate.bat
python -m uvicorn src.app:app --reload --host 127.0.0.1 --port 8000
