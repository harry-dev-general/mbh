# Static File Serving Issue - Investigation

## Issue Summary
Date: October 2025

**Symptom**: Pages fail to load entirely on Railway deployment, showing only Google Play console logs (from browser extension).

**Environment**:
- NODE_ENV=production (Railway environment variable)
- RAILWAY_ENVIRONMENT=development
- Server starts successfully on port 8080
- All Supabase environment variables are correctly set

## Debugging Steps

### 1. Test Basic Connectivity
```bash
# Test if server is responding
curl https://mbh-development.up.railway.app/api/test

# Test static file serving
curl https://mbh-development.up.railway.app/training/simple-test.html

# Check specific pages
curl https://mbh-development.up.railway.app/training/index-fixed.html
```

### 2. Pages to Test
- `/api/test` - Basic API endpoint
- `/training/simple-test.html` - Simple HTML with no dependencies
- `/training/index-fixed.html` - Fixed initialization page
- `/training/supabase-direct-test.html` - Direct Supabase test
- `/training/index-bypass.html` - Navigation bypass page

### 3. Key Differences from OnboardingRE
- MBH uses Express.js, not Next.js
- Static files served via `express.static`
- NODE_ENV=production might affect error handling

### 4. CSP Exclusions Added
All test pages have been added to CSP exclusion list to prevent blocking.

### 5. Request Logging Added
Server now logs all incoming requests to help debug.

## Potential Causes

1. **NODE_ENV=production Effects**:
   - Express might suppress error messages
   - Different error handling behavior
   - Possible middleware differences

2. **Static File Path Issues**:
   - Railway might have different working directory
   - Path resolution differences in production

3. **Middleware Order**:
   - CSP middleware runs before static file serving
   - CORS configuration might block requests

## Next Steps

1. Check Railway logs after deployment for request logs
2. Try accessing `/api/test` directly
3. Test with `curl` to bypass browser issues
4. Consider changing NODE_ENV to development temporarily
