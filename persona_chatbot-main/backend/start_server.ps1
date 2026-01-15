# PowerShell script to start the server with the correct venv
Set-Location $PSScriptRoot
& ".\venv\Scripts\python.exe" -m uvicorn src.app:app --reload --host 127.0.0.1 --port 8000
