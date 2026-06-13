# Employee Management System - Authentication Setup Guide

## Overview of New Features

### 1. **Password Reset Functionality**
- Employees can reset their forgotten password via email
- 15-minute expiration on reset tokens
- Secure token-based password reset flow

### 2. **Google OAuth Login**
- Professional SSO (Single Sign-On) using Google
- Automatic user creation for new Google accounts
- Seamless integration with existing accounts

### 3. **Improved Password Generation**
- Enhanced temporary password generation with better complexity
- Format: `Initials + DD + MM + Random2Digits`
- Example: For "Ramya Sharma" born 04-05: `RS0405A2` (where A2 are random hex chars)

## Backend Setup

### Step 1: Update Backend Dependencies
The backend needs `axios` for HTTP requests. Add it to package.json:

```bash
npm install axios
```

### Step 2: Configure Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/employee-project-management
JWT_SECRET=supersecretjwtkey_please_change_in_production
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Email Configuration (Nodemailer)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/v1/auth/google/callback
```

### Step 3: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Go to "Credentials" → "Create Credentials" → "OAuth client ID"
   - Choose "Web application"
   - Add authorized JavaScript origins: `http://localhost:5173`
   - Add authorized redirect URIs: `http://localhost:5173/auth/google/callback`
   - Copy the Client ID and Client Secret

### Step 4: Gmail App Password for Email

1. Go to [Google Account](https://myaccount.google.com/)
2. Enable 2-Step Verification if not enabled
3. Create App Password:
   - Go to "Security" → "App passwords"
   - Select "Mail" and "Windows Computer"
   - Copy the generated 16-character password
   - Use this in `EMAIL_PASS` in .env

## Frontend Setup

### Step 1: Configure Environment Variables

Create `.env.local` in the frontend directory:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_API_URL=http://localhost:5000/api/v1
```

### Step 2: Required Dependencies

All required packages are already in package.json:
- react-router-dom (for routing)
- react-hook-form (for forms)
- zod (for validation)
- axios (for API calls)

## New API Endpoints

### Authentication Routes

```
POST /api/v1/auth/login
Body: { email, password }
Response: { user, accessToken }

POST /api/v1/auth/forgot-password
Body: { email }
Response: { message: "Password reset link sent to your email" }

POST /api/v1/auth/reset-password
Body: { token, password }
Response: { message: "Password reset successfully" }

POST /api/v1/auth/google-callback
Body: { email, name, googleId }
Response: { user, accessToken }
```

## New Frontend Pages

### 1. Login Page (/login)
- Email and password login
- "Forgot Password?" link
- Google Sign-In button

### 2. Forgot Password Page (/forgot-password)
- Enter email address
- Receive reset link via email

### 3. Reset Password Page (/reset-password/:token)
- Set new password
- Password validation (min 8 chars, uppercase, number)

### 4. Google Callback Page (/auth/google/callback)
- Handles OAuth redirect
- Automatic login after Google authentication

## User Flow Diagrams

### Password Reset Flow
```
User clicks "Forgot Password"
  ↓
Enters email on /forgot-password
  ↓
Backend generates token & sends email
  ↓
User clicks link in email
  ↓
Redirected to /reset-password/:token
  ↓
User enters new password
  ↓
Password updated, redirected to /login
```

### Google OAuth Flow
```
User clicks "Sign in with Google"
  ↓
Redirected to Google OAuth consent screen
  ↓
User authorizes app
  ↓
Redirected to /auth/google/callback
  ↓
Frontend processes callback
  ↓
Logged in automatically
```

## Testing the Features

### Test Password Reset
1. Create an employee (admin)
2. Log in as that employee with initial password
3. Log out
4. Click "Forgot Password"
5. Enter employee email
6. Check email for reset link
7. Click link and set new password
8. Log in with new password

### Test Google Login
1. Ensure GOOGLE_CLIENT_ID is set in frontend .env
2. Click "Sign in with Google" on login page
3. Authorize with your Google account
4. Should be logged in automatically
5. If email matches existing employee, links the Google account

## Troubleshooting

### "Invalid credentials" after password reset
- Ensure the password meets requirements (8+ chars, uppercase, number)
- Clear browser cache and cookies
- Try resetting password again

### Google login not working
- Check VITE_GOOGLE_CLIENT_ID in frontend .env
- Verify redirect URI is whitelisted in Google Cloud Console
- Check browser console for CORS errors

### Email not received
- Check EMAIL_USER and EMAIL_PASS in backend .env
- Ensure Gmail has 2-Step verification enabled
- Use App Password, not regular password
- Check spam folder

### Password reset link expired
- Token expires in 15 minutes
- User should request new reset link if expired

## Security Considerations

1. **Password Tokens**: 
   - Stored as SHA256 hash
   - Expire after 15 minutes
   - Unique per request

2. **Session Tokens**:
   - JWT tokens expire after 1 day
   - HttpOnly cookies for XSS protection
   - Strict Same-Site policy

3. **OAuth**:
   - Only uses public endpoints
   - Email verification happens via Google
   - New accounts created with verified email

4. **Password Requirements**:
   - Minimum 8 characters
   - Must contain uppercase letter
   - Must contain number
   - Hashed using bcrypt (10 salt rounds)

## File Changes Summary

### Backend Files Modified
- `src/models/User.js` - Added OAuth and password reset fields
- `src/controllers/authController.js` - Added forgot/reset password and Google callback
- `src/routes/authRoutes.js` - Added new authentication routes
- `src/controllers/adminController.js` - Improved password generation

### Frontend Files Created
- `src/pages/ForgotPassword.jsx` - Forgot password form
- `src/pages/ResetPassword.jsx` - Reset password form
- `src/pages/GoogleCallback.jsx` - OAuth callback handler

### Frontend Files Modified
- `src/pages/Login.jsx` - Added Google button and forgot password link
- `src/pages/Login.css` - Added new styles
- `src/App.jsx` - Added new routes

## Production Checklist

- [ ] Update JWT_SECRET with strong random string
- [ ] Set NODE_ENV=production
- [ ] Configure real domain in FRONTEND_URL
- [ ] Update Google OAuth redirect URIs for production domain
- [ ] Enable HTTPS (secure cookies require it)
- [ ] Update CORS origin to production domain
- [ ] Set up proper email configuration
- [ ] Test password reset flow end-to-end
- [ ] Test Google OAuth with production credentials
- [ ] Monitor email delivery

## Next Steps

1. Install `axios` in backend: `npm install axios`
2. Get Google OAuth credentials from Google Cloud Console
3. Configure environment variables in `.env` files
4. Test all authentication flows
5. Deploy to production with updated configurations

