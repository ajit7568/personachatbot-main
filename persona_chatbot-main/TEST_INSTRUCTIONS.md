# Testing Google OAuth Integration

## Prerequisites

Before testing, ensure you have:

1. **Installed backend dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Installed frontend dependencies:**
   ```bash
   cd frontend
   npm install
   ```

3. **Run database migration:**
   ```bash
   cd backend
   alembic upgrade head
   ```

## Step 1: Run the Test Script

From the project root directory, run:

```bash
python test_google_oauth.py
```

This will check:
- ✓ All imports work correctly
- ✓ Routes are registered
- ✓ Database schema has Google OAuth fields
- ⚠ Google OAuth credentials (will show warnings if not configured)

## Step 2: Configure Google OAuth Credentials

If credentials are not configured, follow the instructions in `GOOGLE_OAUTH_SETUP.md`:

1. Create a project in Google Cloud Console
2. Enable Google Identity Services API
3. Create OAuth 2.0 credentials
4. Add environment variables to `backend/.env`:
   ```
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
   ```

## Step 3: Start the Backend Server

```bash
cd backend
uvicorn src.app:app --reload
```

The server should start on `http://localhost:8000`

Verify the Google OAuth routes are available:
- `GET http://localhost:8000/auth/google/login` - Should return authorization URL
- `GET http://localhost:8000/auth/google/callback?code=...` - OAuth callback handler
- `POST http://localhost:8000/auth/google/token` - Token exchange endpoint

## Step 4: Start the Frontend Server

In a new terminal:

```bash
cd frontend
npm start
```

The frontend should start on `http://localhost:3000`

## Step 5: Test the Integration

1. Navigate to `http://localhost:3000/login`
2. You should see a "Sign in with Google" button
3. Click the button - it should redirect to Google's consent screen
4. After granting permissions, you'll be redirected back and logged in

## Manual API Testing

You can also test the endpoints directly:

### Get Authorization URL:
```bash
curl http://localhost:8000/auth/google/login
```

Expected response:
```json
{
  "authorization_url": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

### Test with Postman/Thunder Client:

1. **GET** `http://localhost:8000/auth/google/login`
   - Should return authorization URL

2. **GET** `http://localhost:8000/docs`
   - FastAPI docs should show Google OAuth endpoints

## Troubleshooting

### Backend won't start
- Check that all dependencies are installed: `pip install -r backend/requirements.txt`
- Check that environment variables are set (at least JWT_SECRET_KEY)

### Google Sign-In button doesn't appear
- Check browser console for errors
- Verify `@react-oauth/google` is installed: `npm list @react-oauth/google`
- Check that frontend server is running on port 3000

### "Redirect URI mismatch" error
- Verify `GOOGLE_REDIRECT_URI` in `.env` matches exactly what's configured in Google Cloud Console
- Check authorized redirect URIs in Google Cloud Console

### Database migration errors
- Ensure you've run `alembic upgrade head`
- Check that the database file exists: `backend/chatbot.db`

## Expected Behavior

When everything is configured correctly:

1. ✅ Backend starts without errors
2. ✅ Frontend shows Google Sign-In button
3. ✅ Clicking button redirects to Google
4. ✅ After consent, user is redirected back and logged in
5. ✅ User can access protected routes
6. ✅ User info shows correct email and username from Google

## Next Steps

After successful testing:
- Deploy backend to your hosting platform (Render, Railway, etc.)
- Deploy frontend to your hosting platform (Vercel, Netlify, etc.)
- Update Google Cloud Console with production URLs
- Update environment variables in production
