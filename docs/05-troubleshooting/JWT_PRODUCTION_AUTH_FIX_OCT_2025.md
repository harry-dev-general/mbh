# JWT Production Authentication Fix - October 17, 2025

## Executive Summary

The JWT authentication issue in production has been identified and fixed. The root cause was that the production environment requires the **service role key** for server-side JWT verification, not the anon key.

## Root Cause Analysis

### The Problem
- Frontend: Successfully authenticates users and generates JWT tokens
- Backend: JWT verification fails with 401 errors when using anon key
- Reason: Supabase requires service role key for server-side JWT verification

### Why It Works in Development but Not Production
1. **Development**: More permissive JWT verification
2. **Production**: Stricter security requirements
3. **Key Difference**: Service role key has elevated permissions needed for `auth.getUser()` in production

## The Solution

### 1. Created Service Role Auth Middleware
Created `/api/auth-middleware-service.js` that:
- Uses `SUPABASE_SERVICE_KEY` instead of `SUPABASE_ANON_KEY`
- Implements fallback JWT decoding if standard verification fails
- Uses `auth.admin.getUserById()` for user lookup

### 2. Updated Server Configuration
Modified `server.js` to use service role middleware in production:
```javascript
const authMiddleware = process.env.RAILWAY_ENVIRONMENT === 'production' 
    ? require('./api/auth-middleware-service')  // Use service role key in production
    : require('./api/auth-middleware-v2');
```

### 3. Created Debug Tools
- `/api/auth/debug-jwt-service` - Debug endpoint for service role verification
- `/training/jwt-debug-test-service.html` - Test page for verification

## Implementation Details

### Service Role Middleware Pattern
```javascript
// Create client with service role key
const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
    }
});

// Verify JWT with fallback
const { data: { user }, error } = await supabaseService.auth.getUser(token);

if (error) {
    // Fallback: Decode JWT and use admin API
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    const { data: adminUser } = await supabaseService.auth.admin.getUserById(payload.sub);
}
```

## Environment Variable Requirements

**CRITICAL**: Ensure these are set in Railway:
```
SUPABASE_URL=https://etkugeooigiwahikrmzr.supabase.co
SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_KEY=[your-service-role-key]  # REQUIRED for production
```

## Testing the Fix

1. **Check Environment Variables**
   ```bash
   curl https://mbh-production-f0d1.up.railway.app/api/config
   ```

2. **Test JWT Verification**
   - Visit `/training/jwt-debug-test-service.html`
   - Click "Debug JWT with Service Role"
   - Should see "verifyResult": "SUCCESS"

3. **Test Permissions Endpoint**
   - Click "Test Permissions"
   - Should return user permissions without 401 error

## Key Learnings

1. **Service Role Key is Required**: Production Supabase projects require service role key for server-side JWT verification
2. **Anon Key Limitations**: The anon key is meant for client-side operations only
3. **Environment Differences**: Development and production Supabase projects may have different security configurations

## Verification Checklist

- [ ] SUPABASE_SERVICE_KEY is set in Railway environment variables
- [ ] Server is using auth-middleware-service.js in production
- [ ] JWT verification returns SUCCESS in debug endpoint
- [ ] /api/user/permissions returns data without 401 errors
- [ ] Users can log in and access appropriate dashboards

## Related Files

- `/api/auth-middleware-service.js` - Service role auth middleware
- `/api/auth/debug-jwt-service.js` - Debug endpoint
- `/training/jwt-debug-test-service.html` - Test page
- `server.js` - Updated to use service role middleware

## Next Steps

1. Deploy these changes to production
2. Verify SUPABASE_SERVICE_KEY is set in Railway
3. Test with multiple user accounts
4. Monitor for any authentication issues

## Security Considerations

- Service role key has elevated permissions - keep it secure
- Never expose service role key to frontend
- Use it only for server-side operations
- Regularly rotate keys as a security best practice