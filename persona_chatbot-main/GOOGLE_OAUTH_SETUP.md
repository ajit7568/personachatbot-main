# Google OAuth Integration Setup Guide

This guide will walk you through setting up Google OAuth authentication for the persona chatbot application.

## Prerequisites

1. A Google account
2. Access to Google Cloud Console

## Step 1: Register Your Application in Google Cloud Console

### 1.1 Create a Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "Persona Chatbot")
5. Click "Create"

### 1.2 Enable Google Identity Services API

1. Navigate to "APIs & Services" > "Library"
2. Search for "Google Identity Services API" or "Google+ API"
3. Click on the API and click "Enable"

### 1.3 Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" (unless you have a Google Workspace account)
3. Fill in the required information:
   - App name: Your app name
   - User support email: Your email
   - Developer contact information: Your email
4. Click "Save and Continue"
5. Add scopes (if needed):
   - `openid`
   - `email`
   - `profile`
6. Click "Save and Continue"
7. Add test users (if in testing mode) or publish the app
8. Click "Save and Continue"

### 1.4 Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application" as the application type
4. Name your OAuth client (e.g., "Persona Chatbot Web Client")
5. Add **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   http://localhost:5000
   https://your-production-domain.com
   ```
6. Add **Authorized redirect URIs**:
   ```
   http://localhost:3000/auth/google/callback
   http://localhost:5000/auth/google/callback
   https://your-production-domain.com/auth/google/callback
   ```
7. Click "Create"
8. **IMPORTANT**: Copy your **Client ID** and **Client Secret** - you'll need these for configuration

## Step 2: Configure Environment Variables

### Backend Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
# JWT Configuration (required)
JWT_SECRET_KEY=your-secret-key-here-change-in-production

# Google OAuth Configuration (required)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Database Configuration (if using PostgreSQL)
# DATABASE_URL=postgresql://user:password@localhost/dbname

# CORS Origins (comma-separated, optional)
# CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

**Important Notes:**
- Replace `your-google-client-id.apps.googleusercontent.com` with your actual Client ID
- Replace `your-google-client-secret` with your actual Client Secret
- Update `GOOGLE_REDIRECT_URI` to match your frontend URL (development or production)
- Never commit your `.env` file to version control

### Frontend Environment Variables

Create a `.env` file in the `frontend/` directory with the following variables:

```env
# API URL (required)
REACT_APP_API_URL=http://localhost:8000

# Google OAuth Client ID (optional - only if you want to use Google's JS library directly)
# REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

**Note:** The frontend Google Client ID is optional since we're using backend-based OAuth flow.

## Step 3: Install Dependencies

### Backend Dependencies

The following packages have been added to `backend/requirements.txt`:
- `authlib` - For OAuth 2.0 client implementation
- `httpx` - For making HTTP requests to Google's token endpoint

Install them by running:
```bash
cd backend
pip install -r requirements.txt
```

### Frontend Dependencies

The following package has been added to `frontend/package.json`:
- `@react-oauth/google` - Official Google OAuth React library

Install it by running:
```bash
cd frontend
npm install
```

## Step 4: Run Database Migration

Run the Alembic migration to add Google OAuth fields to the database:

```bash
cd backend
alembic upgrade head
```

This will add the following fields to the `users` table:
- `google_id` - Stores Google user ID
- `auth_provider` - Tracks authentication method ('email' or 'google')
- `hashed_password` - Made nullable for Google OAuth users

## Step 5: Test the Integration

1. Start the backend server:
   ```bash
   cd backend
   uvicorn src.app:app --reload
   ```

2. Start the frontend development server:
   ```bash
   cd frontend
   npm start
   ```

3. Navigate to `http://localhost:3000/login`
4. Click the "Sign in with Google" button
5. You should be redirected to Google's consent screen
6. After granting permissions, you'll be redirected back and logged in

## Troubleshooting

### Common Issues

1. **"Redirect URI mismatch" error**
   - Ensure the redirect URI in your `.env` file matches exactly what you configured in Google Cloud Console
   - Check that the URI includes the correct protocol (http/https) and port

2. **"Invalid client" error**
   - Verify your Client ID and Client Secret are correct
   - Ensure the OAuth consent screen is properly configured

3. **"Access blocked" error**
   - If your app is in testing mode, add your email as a test user in OAuth consent screen
   - Or publish your app to make it available to all users

4. **CORS errors**
   - Ensure your frontend URL is added to the backend CORS origins
   - Check that `allow_credentials=True` is set in CORS middleware

5. **Database migration errors**
   - Ensure you've run `alembic upgrade head`
   - If you have existing data, the migration should handle it gracefully

## Security Best Practices

1. **Never commit `.env` files** - Add them to `.gitignore`
2. **Use strong JWT secrets** - Generate a random, secure secret key
3. **Use HTTPS in production** - Google OAuth requires HTTPS for production
4. **Rotate credentials** - Regularly rotate your Client Secret
5. **Limit OAuth scopes** - Only request the scopes you actually need
6. **Validate state parameter** - The implementation includes state validation for CSRF protection

## Production Deployment

When deploying to production:

1. Update `GOOGLE_REDIRECT_URI` to your production frontend URL
2. Add your production URLs to Google Cloud Console authorized origins and redirect URIs
3. Ensure your production backend uses HTTPS
4. Set secure environment variables in your hosting platform (Render, Railway, etc.)
5. Update CORS origins to include your production domain

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [FastAPI OAuth2 Documentation](https://fastapi.tiangolo.com/advanced/security/oauth2-scopes/)
