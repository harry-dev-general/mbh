# Authentication Setup Guide

## Overview
The MBH Staff Portal uses Supabase Authentication for secure user management. This guide covers the simple email authentication setup.

## Current Implementation

### 1. Authentication Page (`training/auth.html`)
- Combined login/signup form
- Email and password authentication
- Automatic redirect after login
- Email verification for new signups

### 2. Protected Pages
All pages in the training portal now check for authentication:
- `index.html` - Main training portal
- Other training pages inherit the same auth check

### 3. Authentication Flow

```mermaid
graph TD
    A[User visits page] --> B{Authenticated?}
    B -->|No| C[Redirect to auth.html]
    B -->|Yes| D[Show page content]
    C --> E[User logs in/signs up]
    E --> F[Email verification if new]
    F --> G[Redirect to main page]
    D --> H[Display user info]
    H --> I[Logout option available]
```

## Configuration

### Supabase Details
- **Project URL**: `https://etkugeooigiwahikrmzr.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0a3VnZW9vaWdpd2FoaWtybXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MDI0OTcsImV4cCI6MjA2ODM3ODQ5N30.OPIYLsnPNNF7dP3SDCODIurzaa3X_Q3xEhfPO3rLJxU`

### Environment Variables (for future React/Next.js app)
```env
NEXT_PUBLIC_SUPABASE_URL=https://etkugeooigiwahikrmzr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Testing the Authentication

1. **Start the server**:
   ```bash
   cd mbh-staff-portal/training
   python3 -m http.server 8000
   ```

2. **Visit**: http://localhost:8000/auth.html

3. **Create a test account**:
   - Use any email address
   - Password must be at least 6 characters
   - Check email for verification link

4. **Login and access protected pages**

## Features Implemented

### Login Page (`auth.html`)
- ✅ Email/password login
- ✅ New user registration
- ✅ Form validation
- ✅ Error handling
- ✅ Loading states
- ✅ Success messages

### Protected Pages
- ✅ Authentication check on load
- ✅ Auto-redirect to login if not authenticated
- ✅ Display user email when logged in
- ✅ Logout functionality

## Next Steps

### 1. Email Configuration in Supabase
1. Go to Supabase Dashboard > Authentication > Email Templates
2. Customize verification emails
3. Set up custom SMTP if needed

#### Important: Configure Redirect URL
1. Go to Supabase Dashboard > Authentication > URL Configuration
2. Add your site URL to "Redirect URLs":
   - For local development: `http://localhost:8000/auth-callback.html`
   - For production: `https://yourdomain.com/auth-callback.html`
3. Update the `emailRedirectTo` in `auth.html` to match your environment

### 2. User Profiles
Create user profiles in the database:
```sql
-- This is already in your migration
CREATE TABLE staff_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    full_name TEXT,
    phone TEXT,
    role TEXT CHECK (role IN ('staff', 'manager', 'admin')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Role-Based Access
Implement different access levels:
- **Staff**: Basic access to submit availability and checklists
- **Manager**: Can view all staff data and assign bookings
- **Admin**: Full system access

### 4. Password Reset
Add password reset functionality:
```javascript
// Add to auth.html
async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/training/reset-password.html`,
    });
}
```

## Security Considerations

1. **HTTPS Required**: Always use HTTPS in production
2. **Rate Limiting**: Supabase provides built-in rate limiting
3. **Session Management**: Sessions expire after 1 week by default
4. **RLS Policies**: Database tables use Row Level Security

## Troubleshooting

### Common Issues

1. **"Invalid API key"**
   - Check that the anon key is correctly set
   - Ensure the project URL matches

2. **"Email not confirmed"**
   - Check spam folder for verification email
   - Resend verification from Supabase dashboard

3. **"User already registered"**
   - Use the login form instead of signup
   - Or use password reset if forgotten

### Debug Mode
Add this to any page to debug auth issues:
```javascript
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth event:', event, session);
});
```

## Migration to React/Next.js

When ready to migrate to React:

1. Use the TypeScript client already created in `frontend/lib/supabase.ts`
2. Implement the AuthContext pattern for global auth state
3. Use middleware for protected routes
4. Add proper error boundaries

## Support

For authentication issues:
1. Check Supabase Dashboard > Authentication > Logs
2. Review browser console for errors
3. Ensure cookies are enabled
4. Clear browser cache if needed 