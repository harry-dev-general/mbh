# Invalid API Key Resolution

## Issue Summary
Date: October 2025

**Error**: "JWT verification failed: Invalid API key"

**Root Cause**: The hardcoded SUPABASE_ANON_KEY in the code doesn't match the actual key in the Supabase project.

## Immediate Solution

### 1. Set Environment Variables in Railway

You need to set these environment variables in your Railway dashboard:

1. Go to Railway Dashboard > Your Project > Variables
2. Add/Update these variables:
   - `SUPABASE_URL`: Get from Supabase Dashboard > Settings > API
   - `SUPABASE_ANON_KEY`: Get from Supabase Dashboard > Settings > API > Project API keys > anon/public
   - `SUPABASE_SERVICE_KEY`: Get from Supabase Dashboard > Settings > API > Project API keys > service_role (Keep this secret!)

### 2. Get Your Actual Keys from Supabase

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings > API
4. Copy the correct values:
   - Project URL
   - anon/public key (this is what's failing)
   - service_role key (for backend operations)

## Code Changes Made

### 1. Removed Hardcoded Keys
- Removed fallback keys from `auth-middleware-v2.js`
- Updated `/api/config` endpoint to require environment variables
- Added better error handling in `index.html`

### 2. Improved Error Handling
- index.html now catches permission check failures
- Redirects to login page on auth errors
- Shows clear error messages

## Testing Steps

1. Set the correct environment variables in Railway
2. Redeploy the application
3. Clear browser cache
4. Visit the site - should now authenticate properly

## Prevention

1. Never hardcode API keys as fallbacks
2. Always use environment variables
3. Document which env vars are required
4. Add startup checks for required configuration

## Related Files Modified
- `/api/auth-middleware-v2.js` - Removed hardcoded keys
- `/training/index.html` - Added error handling
- `/server.js` - Updated config endpoint
