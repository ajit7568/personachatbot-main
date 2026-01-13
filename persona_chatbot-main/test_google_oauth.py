#!/usr/bin/env python3
"""
Test script for Google OAuth integration.
Run this from the project root directory.
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

def test_imports():
    """Test that all required modules can be imported."""
    print("Testing imports...")
    try:
        from src.app import app
        print("[OK] Backend app imports successfully")
        
        from src.services.google_oauth import get_google_authorization_url
        print("[OK] Google OAuth service imports successfully")
        
        from src.routes.auth import router
        print("[OK] Auth routes import successfully")
        
        return True
    except Exception as e:
        print(f"[ERROR] Import error: {e}")
        return False

def test_routes():
    """Test that Google OAuth routes are registered."""
    print("\nTesting routes...")
    try:
        from src.app import app
        
        routes = []
        for route in app.routes:
            if hasattr(route, 'path'):
                routes.append(route.path)
        
        print(f"[OK] Total routes registered: {len(routes)}")
        
        google_routes = [r for r in routes if 'google' in r]
        if google_routes:
            print(f"[OK] Google OAuth routes found: {google_routes}")
        else:
            print("[WARN] Google OAuth routes not found (may need credentials)")
        
        # Check for required routes
        required_routes = [
            '/auth/google/login',
            '/auth/google/callback',
            '/auth/google/token'
        ]
        
        for route in required_routes:
            if route in routes:
                print(f"[OK] Route {route} is registered")
            else:
                print(f"[ERROR] Route {route} is missing")
        
        return True
    except Exception as e:
        print(f"[ERROR] Route test error: {e}")
        return False

def test_google_credentials():
    """Test Google OAuth credentials configuration."""
    print("\nTesting Google OAuth credentials...")
    try:
        from dotenv import load_dotenv
        import os
        
        # Load .env from backend directory
        env_path = os.path.join(os.path.dirname(__file__), 'backend', '.env')
        if os.path.exists(env_path):
            load_dotenv(env_path)
            print(f"[OK] Loaded .env file from: {env_path}")
        else:
            load_dotenv()
            print("[WARN] No .env file found in backend directory")
        
        client_id = os.getenv("GOOGLE_CLIENT_ID")
        client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
        redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")
        
        if client_id:
            print(f"[OK] GOOGLE_CLIENT_ID is set: {client_id[:20]}...")
        else:
            print("[ERROR] GOOGLE_CLIENT_ID is not set")
        
        if client_secret:
            print(f"[OK] GOOGLE_CLIENT_SECRET is set: {'*' * 20}")
        else:
            print("[ERROR] GOOGLE_CLIENT_SECRET is not set")
        
        if redirect_uri:
            print(f"[OK] GOOGLE_REDIRECT_URI is set: {redirect_uri}")
        else:
            print("[WARN] GOOGLE_REDIRECT_URI not set (using default)")
        
        if client_id and client_secret:
            print("\n[OK] Google OAuth credentials are configured!")
            return True
        else:
            print("\n[WARN] Google OAuth credentials are not fully configured.")
            print("  See GOOGLE_OAUTH_SETUP.md for setup instructions.")
            return False
    except Exception as e:
        print(f"[ERROR] Credential test error: {e}")
        return False

def test_database_schema():
    """Test that database schema includes Google OAuth fields."""
    print("\nTesting database schema...")
    try:
        from src.models.user import User
        
        # Check if model has required fields
        required_fields = ['google_id', 'auth_provider']
        
        for field in required_fields:
            if hasattr(User, field):
                print(f"[OK] User model has {field} field")
            else:
                print(f"[ERROR] User model missing {field} field")
        
        # Check if hashed_password is nullable
        from sqlalchemy.inspection import inspect
        user_table = inspect(User)
        hashed_password_col = user_table.columns.get('hashed_password')
        # Avoid truthiness check on Column objects (raises SQLAlchemy warning)
        if hashed_password_col is not None and hashed_password_col.nullable:
            print("[OK] hashed_password is nullable")
        else:
            print("[WARN] hashed_password may not be nullable")
        
        return True
    except Exception as e:
        print(f"[ERROR] Database schema test error: {e}")
        return False

def main():
    """Run all tests."""
    print("=" * 60)
    print("Google OAuth Integration Test")
    print("=" * 60)
    
    results = []
    
    results.append(("Imports", test_imports()))
    results.append(("Routes", test_routes()))
    results.append(("Credentials", test_google_credentials()))
    results.append(("Database Schema", test_database_schema()))
    
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    for test_name, result in results:
        status = "[PASS]" if result else "[FAIL]"
        print(f"{test_name}: {status}")
    
    all_passed = all(result for _, result in results)
    
    if all_passed:
        print("\n[SUCCESS] All tests passed!")
    else:
        print("\n[WARN] Some tests failed. Check the output above for details.")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
