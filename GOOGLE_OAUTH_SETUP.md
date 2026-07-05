# Google OAuth Setup Guide

This guide will help you set up Google OAuth (Sign in with Google) for your Zelbi application.

## Prerequisites

- A Google Cloud Console account
- Node.js 18+ installed

## Step 1: Get Google Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Select **Web application**
6. Add authorized JavaScript origins:
   - `http://localhost:3000` (for development)
   - `http://13.127.181.122` (for production)
7. Add authorized redirect URIs:
   - `http://localhost:3000` (for development)
   - `http://13.127.181.122` (for production)
8. Click **Create** and copy the **Client ID**

## Step 2: Configure Frontend Environment Variables

Add the Google Client ID to your frontend `.env` file:

```env
# frontend/.env
REACT_APP_API_URL=http://localhost:3000
REACT_APP_FRONTEND_URL=http://13.127.181.122/
REACT_APP_RAZORPAY_KEY_ID=YOUR_KEY_ID
REACT_APP_GOOGLE_CLIENT_ID=241748058273-3g25rjlv8clkup0446b4hp4e9u0duq4d.apps.googleusercontent.com
```

Replace `YOUR_GOOGLE_CLIENT_ID_HERE` with the Client ID you copied from Google Cloud Console.

**Example:**
```env
REACT_APP_GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
```

## Step 3: Restart the Development Server

After updating the `.env` file, restart your frontend development server:

```bash
cd frontend
npm start
```

## Step 4: Test the Implementation

1. Navigate to `http://localhost:3000/login`
2. You should see a "Continue with Google" button below the "OR" divider
3. Click the button to test Google Sign In

## How It Works

### Frontend Flow:
1. User clicks "Continue with Google" button
2. Google OAuth popup appears for authentication
3. After successful Google authentication, a token is received
4. The token is sent to the backend `/api/auth/google-auth` endpoint
5. Backend verifies the token with Google and creates/logs in the user
6. JWT token is returned and stored in Redux and localStorage
7. User is redirected to the dashboard

### Backend Flow:
1. Receives Google token from frontend
2. Verifies token with Google's tokeninfo API
3. Extracts user information (email, name, picture)
4. Checks if user exists in database:
   - **If user exists**: Links Google account if not already linked
   - **If new user**: Creates new user account with Google details
5. Generates JWT token
6. Returns user data and token to frontend



## Production Deployment

Before deploying to production:

1. Update Google Cloud Console with production URLs:
   - Authorized JavaScript origins: `https://yourdomain.com`
   - Authorized redirect URIs: `https://yourdomain.com`

2. Update frontend `.env` with production values:
   ```env
   REACT_APP_API_URL=https://your-backend-url.com
   REACT_APP_GOOGLE_CLIENT_ID=your_production_client_id
   ```

3. Update backend `.env` with production FRONTEND_URL:
   ```env
   FRONTEND_URL=https://yourdomain.com
   ```