# Railway URL Configuration Fix

## Issue Description
The MBH Staff Portal was getting stuck on "Initializing..." when deployed on Railway. The URL was loading without "https://www" prefix, indicating potential URL handling issues.

## Root Cause
Based on analysis of the OnboardingRE project's successful setup:
1. Railway runs applications internally on `localhost:8080`
2. Without explicit URL configuration, the app may try to use internal URLs
3. This can cause initialization failures and authentication issues

## Solution Implemented

### 1. Environment Variable
Add the following environment variable in Railway dashboard:
```
APP_URL=https://mbh-development.up.railway.app
```

**Important**: Include the full protocol (`https://`) and domain.

### 2. Server Configuration Updates
Updated `/server.js` to:
- Include `APP_URL` in the `/api/config` endpoint response
- Add startup warning if `APP_URL` is not set in production

### 3. Client Configuration Updates
Updated `/training/js/config.js` to:
- Add `getAppUrl()` helper function
- Use `APP_URL` from server when available, fallback to `window.location.origin`

## Files Modified
- `/server.js` - Added APP_URL to config endpoint and startup checks
- `/training/js/config.js` - Added getAppUrl helper function

## Testing
After deployment:
1. Check Railway logs for the warning message if APP_URL is not set
2. Verify the app loads without getting stuck on "Initializing..."
3. Confirm the URL shows with proper "https://www" prefix

## Related Issues
This pattern was identified from the OnboardingRE project which experienced similar issues:
- Internal Railway URL (`localhost:8080`) vs public URL
- Authentication redirects failing without proper URL configuration
- Initialization hanging due to URL mismatches

## References
- OnboardingRE: `/docs/deployment/RAILWAY_DEPLOYMENT_LESSONS_LEARNED.md`
- Critical environment variable: `NEXT_PUBLIC_APP_URL` (for Next.js projects)
