# MBH Staff Portal Authentication Debugging - Complete Journey

## Overview
This document provides a comprehensive record of the authentication debugging process for the MBH Staff Portal on Railway deployment. It serves as a guide for understanding the complex chain of issues that prevented authentication from working.

## Initial Problem Description
**Date**: October 15, 2025  
**Reported Issue**: Users receiving 401 Unauthorized errors when accessing `/api/user/permissions`, preventing role-based access control from working.

## The Journey: A Multi-Layered Problem

### Phase 1: JWT Verification Investigation (Initial Misdiagnosis)

**What We Thought**: JWT verification was failing due to incorrect token validation
**What We Tried**:
1. Added extensive debug logging to `/api/auth-middleware.js`
2. Tried multiple JWT verification approaches (SvelteKit pattern, Edge Functions pattern)
3. Created `/api/auth/test-jwt` and `/api/auth/debug-jwt` endpoints
4. Created `jwt-debug.html` frontend debug page
5. Created new `auth-middleware-v2.js` with simplified approach

**Key Discovery**: The JWT verification code was actually correct, but we couldn't test it because requests never reached the server.

### Phase 2: Admin Dashboard Redirect Issue

**What We Found**: Admin user was being redirected to wrong dashboard
**Root Causes**:
1. User's Airtable "Staff Type" was "Casual" instead of "Full Time"
2. Missing `staff_profiles` record in Supabase
3. Root URL served `dashboard.html` directly instead of auth router

**What We Fixed**:
1. Updated Airtable record
2. Created `staff_profiles` record with `role: 'admin'`
3. Created `training/index.html` as authentication router
4. Modified server to serve index.html at root

### Phase 3: Invalid API Key Error

**What Happened**: After deployment, "JWT verification failed: Invalid API key" appeared in logs
**Root Cause**: Hardcoded SUPABASE_ANON_KEY values throughout codebase
**What We Fixed**:
1. Removed ALL hardcoded API keys
2. Updated `/api/config` to require environment variables
3. Added startup checks for required configuration
4. Created `scripts/check-env.js` for verification

### Phase 4: Supabase Client Hanging

**Symptoms**: Page stuck on "Initializing..." with no errors
**What We Discovered**: 
- Supabase client `getSession()` was hanging indefinitely
- Similar issue documented in OnboardingRE project
- Added APP_URL environment variable based on OnboardingRE patterns

**What We Created**:
1. `supabase-init-fix.js` - Fixed initialization with timeouts
2. `index-fixed.html` - Uses new initialization approach
3. `supabase-direct-test.html` - Direct API testing
4. `index-bypass.html` - Skip auth checks entirely
5. `auth-no-check.html` - Login without session check

### Phase 5: The Real Problem - 502 Bad Gateway

**Critical Discovery**: ALL requests were returning 502 "Application failed to respond"
**Root Cause**: Express server not binding to `0.0.0.0`
**Why This Matters**:
- Railway runs apps in containers
- Default binding to `localhost` is only accessible within container
- Railway's edge proxy couldn't connect to the application

**The Fix**:
```javascript
const HOST = '0.0.0.0';
server.listen(PORT, HOST, () => {
  console.log(`MBH Staff Portal running on ${HOST}:${PORT}`);
});
```

### Phase 6: Static File Path Confusion

**Discovery**: Files in `/training` directory are served at root level
**Impact**: 
- `/training/index-fixed.html` → 502 error
- `/index-fixed.html` → Works correctly

**Explanation**: `express.static(path.join(__dirname, 'training'))` serves files at root

## Technical Discoveries

### 1. Railway-Specific Requirements
- Must bind to `0.0.0.0` for container accessibility
- NODE_ENV=production affects error handling
- Environment variables must be explicitly set (no defaults in production)

### 2. Express.js Static File Serving
- Files in subdirectories are served at root level
- CSP middleware must explicitly exclude paths
- Middleware order matters: CSP → CORS → static files

### 3. Supabase Integration Patterns
- Client initialization can hang without proper error handling
- Session checks need timeouts in production environments
- Different initialization needed for containerized deployments

### 4. Debugging Approach Evolution
- Started with application-level debugging (JWT)
- Moved to infrastructure-level (502 errors)
- Simple test endpoints (`/api/test`) are crucial for diagnosis
- Browser console errors can be misleading (extension noise)

## Environment Variables Required
```
SUPABASE_URL=https://etkugeooigiwahikrmzr.supabase.co
SUPABASE_ANON_KEY=[anon key from Supabase dashboard]
SUPABASE_SERVICE_KEY=[service key from Supabase dashboard]
AIRTABLE_API_KEY=[Airtable API key]
AIRTABLE_BASE_ID=applkAFOn2qxtu7tx
APP_URL=https://mbh-development.up.railway.app
NODE_ENV=production
```

## Files Created During Debugging

### Test Pages
- `training/jwt-debug.html` - JWT verification testing
- `training/index-fixed.html` - Fixed initialization approach
- `training/supabase-direct-test.html` - Direct API testing
- `training/index-bypass.html` - Navigation without auth
- `training/auth-no-check.html` - Login without session check
- `training/simple-test.html` - Basic connectivity test
- `training/config-test.html` - Configuration loading test
- `training/debug-test.html` - JavaScript execution test
- `training/index-simple.html` - Simplified auth flow
- `training/auth-debug.html` - Step-by-step auth debugging
- `training/supabase-test.html` - Supabase client testing
- `training/minimal-test.html` - Minimal session test
- `training/csp-test.html` - CSP rule testing

### Backend Changes
- Modified `/api/auth-middleware.js` - Added debug logging
- Created `/api/auth-middleware-v2.js` - Simplified approach
- Added `/api/auth/test-jwt` - JWT testing endpoint
- Added `/api/auth/debug-jwt` - Comprehensive JWT debugging
- Added `/api/test` - Basic connectivity test
- Modified `/server.js` - Multiple fixes including 0.0.0.0 binding

### Scripts and Utilities
- `scripts/check-env.js` - Environment variable checker
- `scripts/test-supabase-auth.js` - Standalone JWT verification
- `training/js/supabase-init-fix.js` - Fixed initialization module
- `training/js/config.js` - Updated to require env vars

## Lessons Learned

1. **Start with Infrastructure**: When nothing loads, check basic connectivity first
2. **502 Errors Hide Everything**: Application might be running fine internally
3. **Simple Test Endpoints**: `/api/test` should be the first diagnostic tool
4. **Railway Requirements**: Always bind to 0.0.0.0 for containerized deployments
5. **Environment Variables**: Never use hardcoded fallbacks in production
6. **Static File Paths**: Understand how express.static affects URL structure
7. **CSP Can Block Silently**: Always check middleware exclusions
8. **Multiple Problems Can Cascade**: JWT "issues" were never reached due to 502s

## Current Status
✅ Server properly bound to 0.0.0.0  
✅ All environment variables configured  
✅ Static files accessible at correct URLs  
✅ API endpoints responding  
✅ Test pages available for debugging  
✅ Authentication flow should now work correctly

## Related Documentation
- [JWT Auth Debug Guide](./JWT_AUTH_DEBUG_GUIDE.md)
- [Invalid API Key Resolution](./INVALID_API_KEY_RESOLUTION.md)
- [Railway 502 Gateway Error Fix](./RAILWAY_502_GATEWAY_ERROR_FIX.md)
- [Admin Dashboard Redirect Fix](./ADMIN_DASHBOARD_REDIRECT_FIX.md)
- [Role Based Auth 401 Investigation](./ROLE_BASED_AUTH_401_INVESTIGATION.md)
- [Static File Serving Issue](./STATIC_FILE_SERVING_ISSUE.md)
- [Solution Summary](./SOLUTION_SUMMARY.md)
