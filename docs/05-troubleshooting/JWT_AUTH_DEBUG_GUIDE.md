# JWT Authentication Debug Guide

## Issue Summary
Users are receiving 401 Unauthorized errors when accessing `/api/user/permissions`, even though Supabase authentication succeeds on the frontend.

## Debugging Steps Implemented

### 1. Enhanced Auth Middleware Logging
- Added comprehensive debug logging to `auth-middleware.js` to trace JWT verification steps
- Logs include token details, headers, and error messages

### 2. Created Debug Endpoints
- `/api/auth/test-jwt` - Simple JWT verification without middleware
- `/api/auth/debug-jwt` - Comprehensive JWT debugging with token decoding
- `jwt-debug.html` - Frontend testing interface

### 3. Alternative Auth Middleware (V2)
Created a simplified version (`auth-middleware-v2.js`) that:
- Creates a new Supabase client per request
- Uses a single verification approach
- Includes better error handling

### 4. Test Script
Created `scripts/test-supabase-auth.js` to:
- Test different JWT verification approaches
- Verify Supabase configuration
- Test actual API endpoints

## Potential Root Causes

### 1. Environment Variable Issues
- Check if `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correctly set in Railway
- Verify they match between frontend and backend
- Check Railway environment (development vs production)

### 2. JWT Verification Approach
The Supabase documentation shows different patterns:
- SvelteKit: Create client with auth header, call `getUser()` without token
- Edge Functions: Pass token directly to `getUser(token)`

### 3. Timing/Async Issues
- Client instance reuse might cause issues
- Creating new client per request might be necessary

### 4. CORS or Header Issues
- Verify Authorization header is being passed correctly
- Check for any proxy/middleware interference

## Testing Steps

### 1. Local Testing
```bash
# Run the test script
cd mbh-staff-portal
node scripts/test-supabase-auth.js
```

### 2. Frontend Testing
1. Open `/training/jwt-debug.html` in browser
2. Login with test credentials
3. Test each endpoint in order:
   - Simple JWT Test
   - Permissions Endpoint
   - Debug JWT Endpoint

### 3. Railway Deployment Testing
1. Deploy changes to Railway development environment
2. Check Railway logs for debug output
3. Test with production URL

## Verification Checklist

- [ ] Environment variables are set correctly in Railway
- [ ] Frontend and backend use same Supabase project
- [ ] JWT tokens are not expired
- [ ] Authorization header format is correct (`Bearer <token>`)
- [ ] No proxy/middleware is stripping headers
- [ ] Supabase project is active and accessible

## Quick Fixes to Try

### 1. Use Alternative Middleware
```javascript
// In server.js, change:
const { authenticate } = require('./api/auth-middleware');
// To:
const { authenticate } = require('./api/auth-middleware-v2');
```

### 2. Add Header Logging
Check Railway logs for header information to verify tokens are being passed.

### 3. Test Direct Supabase Access
Use the test script to verify Supabase connectivity independent of the application.

## Next Steps

1. Deploy current changes to Railway
2. Monitor debug logs in Railway dashboard
3. Test with jwt-debug.html on deployed URL
4. If issue persists, check:
   - Railway networking/proxy settings
   - Supabase project configuration
   - Token expiration settings

## Related Files
- `/api/auth-middleware.js` - Original auth middleware
- `/api/auth-middleware-v2.js` - Simplified alternative
- `/training/jwt-debug.html` - Frontend debug tool
- `/scripts/test-supabase-auth.js` - Backend test script
- `/server.js` - API endpoints (lines 488-519, 521-571)
