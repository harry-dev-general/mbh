# Authentication Callback Setup Guide

## The Email Verification Flow

When a user signs up through the MBH Staff Portal:

1. User enters email/password on `auth.html`
2. Supabase sends a verification email
3. Email contains a link to your redirect URL with auth tokens
4. `auth-callback.html` processes the tokens and logs the user in
5. User is redirected to the main portal

## Important Configuration

### 1. Supabase Redirect URLs

You MUST configure allowed redirect URLs in Supabase:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/etkugeooigiwahikrmzr/auth/url-configuration)
2. Under "Redirect URLs", add:
   - `http://localhost:8000` (for local development)
   - Your production domain when deployed

### 2. File Structure

Make sure these files are in the correct location:
```
mbh-staff-portal/training/
├── auth.html          # Login/signup page
├── auth-callback.html # Handles email verification
└── index.html         # Main portal (protected)
```

### 3. Testing Email Verification

1. Start your local server:
   ```bash
   cd mbh-staff-portal/training
   python3 -m http.server 8000
   ```

2. Go to: http://localhost:8000/auth.html

3. Sign up with a new email

4. Check your email and click the verification link

5. You should see:
   - "Verifying your email..." spinner
   - Success message
   - Automatic redirect to the portal

## Troubleshooting

### "This site can't be reached" Error

If clicking the email link shows this error:
- The redirect URL in the email doesn't match your server
- Check that you're running the server on port 8000
- Verify Supabase has `http://localhost:8000` in allowed redirects

### Email Not Received

- Check spam folder
- Verify email address is correct
- Check Supabase email logs in dashboard

### Authentication Tokens Not Found

If you see this error:
- The URL might be missing the hash parameters
- Try signing up again
- Check browser console for errors

## Production Deployment

When deploying to production:

1. Update Supabase redirect URLs to include your domain
2. The auth forms automatically detect the correct URL
3. Ensure HTTPS is enabled (required by Supabase)

## How the Callback Works

The `auth-callback.html` page:
1. Extracts `access_token` and `refresh_token` from URL hash
2. Sets the Supabase session with these tokens
3. Verifies the session is valid
4. Redirects to the main portal

This approach ensures email verification works seamlessly! 