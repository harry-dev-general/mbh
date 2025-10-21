# JWT Production Authentication Issue - Complete Investigation
**Date**: October 17, 2025  
**Status**: ONGOING  
**Issue**: 401 Unauthorized errors on `/api/user/permissions` in production

## Executive Summary

Production users, including admins, are unable to access protected endpoints despite:
- Successfully authenticating on the frontend (Supabase auth works)
- Having correct roles assigned in Supabase database
- All environment variables being correctly configured
- The same setup working perfectly in development

## The Core Problem

```
Frontend: Supabase auth successful → JWT token generated
Backend: JWT verification fails → 401 Unauthorized
```

## Investigation Timeline

### Phase 1: Environment Variable Verification
**Hypothesis**: Missing or incorrect environment variables  
**Actions Taken**:
- Verified `SUPABASE_URL` is set correctly in Railway
- Verified `SUPABASE_ANON_KEY` is set correctly in Railway
- Verified `SUPABASE_SERVICE_KEY` is set correctly in Railway
- Confirmed all values match between Supabase dashboard and Railway
- Added `APP_URL` based on development environment patterns

**Result**: ❌ Issue persists - environment variables are correct

### Phase 2: JWT Debugging Infrastructure
**Hypothesis**: JWT tokens are malformed or expired  
**Actions Taken**:
1. Created `/api/auth/debug-jwt` endpoint to inspect tokens
2. Created `/api/auth/debug-jwt-v2` endpoint using auth-middleware-v2
3. Created `/training/jwt-debug-test.html` for frontend testing
4. Added comprehensive logging to auth middleware

**Discoveries**:
- JWT tokens are properly formatted (3 parts, valid base64)
- Tokens are not expired
- Token contains correct user email and sub (user ID)
- Frontend successfully extracts and sends token in Authorization header

**Result**: ❌ Tokens are valid but still fail verification

### Phase 3: Auth Middleware Analysis
**Hypothesis**: JWT verification implementation is incorrect  
**Current Implementation** (`auth-middleware-v2.js`):
```javascript
// Creates new Supabase client per request
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    },
    global: {
        headers: {
            Authorization: `Bearer ${token}`
        }
    }
});

// Verify the JWT and get user
const { data: { user }, error } = await supabase.auth.getUser();
```

**Alternative Patterns Discovered**:
1. Supabase documentation shows passing token directly: `getUser(token)`
2. Some examples use service role key for verification
3. Development environment somehow bypasses this issue

**Result**: ❌ Multiple patterns tried, none work in production

### Phase 4: Production-Specific Middleware
**Hypothesis**: Production needs different JWT verification pattern  
**Actions Taken**:
1. Created `/api/auth-middleware-production.js` with single client instance
2. Modified server.js to conditionally load based on `RAILWAY_ENVIRONMENT`
3. Added `/api/auth/debug-jwt-production` endpoint
4. Enhanced logging throughout the verification process

**Implementation**:
```javascript
// Single reusable client (not per-request)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
    }
});

// Pass token directly
const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
```

**Result**: ❌ Still receiving 401 errors

## Technical Discoveries

### 1. Development vs Production Differences
- **Development**: JWT verification works with auth-middleware-v2.js
- **Production**: Same code fails with 401 errors
- **Implication**: Environmental differences beyond code

### 2. Supabase Client Patterns
We discovered multiple valid patterns for JWT verification:
```javascript
// Pattern 1: New client per request with token in headers
const client = createClient(url, key, { 
    global: { headers: { Authorization: `Bearer ${token}` } } 
});
await client.auth.getUser();

// Pattern 2: Reusable client with token parameter
const client = createClient(url, key);
await client.auth.getUser(token);

// Pattern 3: Service role key for admin operations
const client = createClient(url, serviceKey);
await client.auth.admin.getUserById(userId);
```

### 3. Railway Deployment Considerations
- Must bind to `0.0.0.0` (previously fixed)
- Environment variables load correctly
- No proxy header stripping detected
- CORS not blocking requests

### 4. JWT Token Structure
Decoded production tokens show:
- Valid `sub` (user ID)
- Valid `email`
- Valid `exp` (not expired)
- Correct `aud` and `iss` claims
- Role information present in metadata

### 5. Error Patterns
The 401 error specifically states:
- "Invalid or missing authentication token"
- Not "expired" or "malformed"
- Suggests token validation logic mismatch

## Current State of Debugging Tools

### Backend Endpoints
1. `/api/auth/test-jwt` - Simple JWT verification test
2. `/api/auth/debug-jwt` - Comprehensive JWT debugging
3. `/api/auth/debug-jwt-v2` - Using auth-middleware-v2
4. `/api/auth/debug-jwt-production` - Using production middleware
5. `/api/user/permissions` - The failing endpoint

### Frontend Tools
1. `/training/jwt-debug-test.html` - Comprehensive testing interface
2. `/training/jwt-debug.html` - Original debug page
3. Multiple test pages for isolated testing

### Middleware Versions
1. `/api/auth-middleware.js` - Original (with extensive logging)
2. `/api/auth-middleware-v2.js` - Simplified version
3. `/api/auth-middleware-production.js` - Production-specific

## Hypotheses Not Yet Tested

### 1. JWT Secret Mismatch
- Frontend and backend might use different JWT secrets
- Supabase might have multiple JWT secrets
- Production might need explicit JWT secret configuration

### 2. Supabase Project Configuration
- Row Level Security (RLS) might be blocking auth.getUser()
- API settings in Supabase dashboard might differ
- JWT expiry settings might be different

### 3. Network/Proxy Issues
- Railway's proxy might modify headers
- CloudFlare or other CDN interference
- TLS/SSL certificate issues

### 4. Token Scope/Audience
- Production tokens might have different audience claims
- Scope might be restricted in production
- Anonymous vs authenticated key usage

## Related Documentation
- [Authentication Issue Final Resolution](./AUTHENTICATION_ISSUE_FINAL_RESOLUTION.md) - Development environment fix
- [JWT Auth Debug Guide](./JWT_AUTH_DEBUG_GUIDE.md) - Initial debugging approach
- [Authentication Authorization Complete Fix](./AUTHENTICATION_AUTHORIZATION_COMPLETE_FIX_OCT_2025.md) - Full journey including authorization

## Next Steps for Investigation

1. **Compare JWT Secrets**
   - Extract and compare JWT secrets between dev and prod
   - Verify Supabase project settings match

2. **Test with Service Role Key**
   - Try using service role key for JWT verification
   - May bypass RLS issues

3. **Direct Supabase API Test**
   - Test JWT directly against Supabase API
   - Bypass application layer entirely

4. **Network Analysis**
   - Capture and analyze actual HTTP requests
   - Check for header modifications

5. **Alternative Auth Patterns**
   - Implement session-based auth as fallback
   - Try Supabase's built-in session management

## Error Logs and Patterns

### Frontend Console
```
Auth event: SIGNED_IN
Auth event: INITIAL_SESSION
GET /api/user/permissions 401 (Unauthorized)
Error fetching permissions: Error: Failed to fetch permissions
```

### Backend Logs (Expected)
```
🔍 JWT Debug Production
✅ JWT verified successfully for: harry@priceoffice.com.au
❌ JWT verification failed: [error details]
```

## Key Insight
The same code works in development but fails in production, suggesting the issue is environmental rather than implementation-based. The JWT tokens are valid but something in the production environment prevents successful verification.

