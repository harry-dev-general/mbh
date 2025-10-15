# Role-Based Authentication 401 Error Investigation

## Issue Summary

**Date**: January 2025  
**Issue**: After implementing a new role-based access control (RBAC) system, users are experiencing persistent 401 authentication errors when trying to access the `/api/user/permissions` endpoint, preventing access to management features.

**Symptoms**:
- Browser console shows `401 (Unauthorized)` error for `/api/user/permissions`
- Users are redirected to the regular dashboard instead of management dashboard
- Authentication appears successful in Supabase but fails at the API level

## Technical Context

### System Architecture
1. **Authentication Provider**: Supabase Auth
2. **Backend**: Node.js/Express (Railway deployment)
3. **Frontend**: Vanilla JavaScript with Supabase client SDK
4. **Role Storage**: Hybrid approach:
   - Airtable "Employee Details" table (Staff Type field)
   - Supabase `staff_profiles` table (role field)

### Role Mapping Design
- Airtable "Full Time" → Supabase "admin"
- Airtable "Casual" → Supabase "staff"

## Implementation Attempted

### 1. Core RBAC Components Created

**`/api/role-manager.js`**:
- Maps Airtable Staff Type to Supabase roles
- Syncs roles between systems
- Provides role checking utilities
- Falls back to Airtable when Supabase service key not available

**`/api/auth-middleware.js`**:
- JWT token verification middleware
- Attaches user info to Express requests
- Initially had incorrect token verification approach

**`/api/auth-hooks.js`**:
- Handles user login events
- Syncs profile and role on authentication
- Creates/updates staff profiles in Supabase

**`/training/js/role-helper.js`**:
- Client-side permission checking
- Caches permissions for performance
- Makes API calls to check user access

### 2. Migration from Hardcoded Email Lists

**Previous System**:
```javascript
const managementEmails = [
    'harry@priceoffice.com.au',
    'mmckelvey03@gmail.com',
    'manager@mbh.com',
    'admin@mbh.com',
    'operations@mbh.com'
];
```

**New System**:
- Dynamic role checking based on Airtable Staff Type
- Server-side API endpoints for permission verification
- Client-side helper functions for UI control

## Attempted Fixes

### Fix 1: Add Missing Dependencies
**Issue**: Deployment crashed due to missing `@supabase/supabase-js` package  
**Solution**: Added dependency to `package.json`  
**Result**: Deployment succeeded but auth still failed

### Fix 2: Update package-lock.json
**Issue**: `npm ci` failed due to out-of-sync lock file  
**Solution**: Ran `npm install` to regenerate lock file  
**Result**: Deployment succeeded but auth still failed

### Fix 3: Fix adminAuth Middleware Order
**Issue**: `adminAuth` was used before being defined  
**Solution**: Moved middleware definition to line 101  
**Result**: Deployment succeeded but auth still failed

### Fix 4: Add Default Environment Variables
**Issue**: Supabase environment variables might not be set  
**Solution**: Added fallback values for SUPABASE_URL and SUPABASE_ANON_KEY  
**Result**: No improvement, auth still failed

### Fix 5: Correct JWT Verification Method
**Issue**: Incorrect server-side JWT verification approach  
**Original Code**:
```javascript
const { data: { user }, error } = await supabase.auth.getUser(token);
```

**Fixed Code**:
```javascript
const authSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
        headers: {
            Authorization: authHeader
        }
    }
});
const { data: { user }, error } = await authSupabase.auth.getUser();
```

**Result**: Still experiencing 401 errors

## Technical Discoveries

### 1. Supabase JWT Verification
- Server-side JWT verification requires creating a new Supabase client with the Authorization header
- Cannot pass token as parameter to `getUser()` method
- Must follow the pattern documented in Supabase's Edge Functions documentation

### 2. Railway Deployment Considerations
- Multiple deployment environments (development, production) running simultaneously
- Environment variables must be set per environment
- Service key required for bypassing RLS in role management

### 3. Authentication Flow
1. User signs in via Supabase Auth (works ✓)
2. Frontend receives JWT token (works ✓)
3. Frontend calls `/api/user/permissions` with Bearer token (sends correctly ✓)
4. Backend auth middleware verifies token (fails with 401 ✗)
5. Backend returns permissions based on role

### 4. Current State
- Supabase authentication succeeds (SIGNED_IN event fires)
- Frontend properly sends Authorization header
- Backend middleware fails to verify the JWT token
- 401 error prevents role checking and permission loading

## Environment Variables Required

```bash
# Supabase Configuration
SUPABASE_URL=https://etkugeooigiwahikrmzr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # For role management

# Airtable Configuration
AIRTABLE_API_KEY=pat...
```

## Debugging Information Added

1. **Auth Middleware**: Logs successful token verification
2. **Role Manager**: Logs role lookups and permissions
3. **Server Endpoints**: Logs user email and computed permissions

## Remaining Questions

1. Why does the JWT verification fail even with the corrected approach?
2. Is there a mismatch between the Supabase project in the frontend config and backend?
3. Are the Railway environment variables properly set and accessible?
4. Is there a CORS or header issue preventing proper authentication?

## Next Steps to Investigate

1. Verify Supabase project configuration matches between frontend and backend
2. Check Railway logs for specific error messages during JWT verification
3. Test JWT verification locally to isolate Railway-specific issues
4. Verify the Authorization header format matches Supabase expectations
5. Consider implementing a simpler auth check endpoint for debugging
