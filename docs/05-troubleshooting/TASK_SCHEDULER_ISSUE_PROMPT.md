# Task Scheduler 502 Error - Issue-Specific Prompt for LLM

## Executive Summary
The MBH Staff Portal's task scheduler feature was completely inaccessible in production (502 errors) despite working locally. The issue has been **FULLY RESOLVED** through a series of fixes addressing service worker interference, resource paths, and authentication flow.

## The Problem
**Symptoms**: All task scheduler pages returned 502 errors in production
**Root Cause**: Service worker (`calendar-service-worker.js`) was intercepting ALL document requests and serving cached `management-allocations.html` as a fallback
**Secondary Issues**: Once service worker was fixed, additional issues with resource paths and authentication were uncovered

## The Solution Journey

### Step 1: Service Worker Fix
```javascript
// Added to calendar-service-worker.js
const excludedPaths = [
    '/training/task-scheduler.html',
    '/training/task-scheduler-debug.html',
    '/training/unregister-sw.html'
];

// In fetch event listener
if (excludedPaths.some(path => url.pathname === path)) {
    return; // Don't intercept
}
```

### Step 2: Server-Side Cache Prevention
```javascript
// Added to server.js
app.use((req, res, next) => {
    if (excludedPaths.includes(req.path)) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Service-Worker-Allowed', 'none');
    }
    next();
});
```

### Step 3: Resource Path Corrections
```html
<!-- WRONG (relative paths) -->
<script src="js/supabase-init-fix.js"></script>

<!-- CORRECT (absolute paths) -->
<script src="/js/supabase-init-fix.js"></script>
```

### Step 4: Authentication Flow Fix
```javascript
// Initialize Supabase before auth checks
supabase = await window.SupabaseInit.getClient();

// Use cached session check
const { data: { session } } = await supabase.auth.getSession();

// Use absolute redirect paths
window.location.href = `/auth.html?returnUrl=${returnUrl}`;
```

## Key Discoveries

1. **Service Worker Persistence**: Service workers survive deployments and require version bumping to update
2. **Express Static Quirk**: `express.static('training')` serves files at root, not under `/training/`
3. **Auth Best Practice**: Use `getSession()` for immediate checks, not `getUser()` which makes API calls
4. **Path Resolution**: Always use absolute paths in production to avoid confusion

## Current Status
- ✅ Task scheduler fully functional in production
- ✅ All resource loading issues resolved
- ✅ Authentication flow working correctly
- ✅ Service worker properly configured with exclusions
- ✅ Navigation links added to management dashboard

## If Similar Issues Arise

### Diagnostic Steps
1. Check browser console - is wrong content being served?
2. Look for service worker interference in Network tab
3. Verify resource paths are absolute
4. Check authentication state with console logs
5. Use `/training/sw-force-update.html` to clear service workers

### Quick Fixes to Try
1. Increment service worker version
2. Add paths to exclusion lists
3. Set cache-control headers
4. Convert relative paths to absolute
5. Switch from `getUser()` to `getSession()`

## Important Files
- `/training/calendar-service-worker.js` - The service worker (version: mbh-calendar-v2)
- `/server.js` - Express server with cache prevention middleware
- `/training/task-scheduler.html` - The task scheduler page
- `/training/sw-force-update.html` - Service worker management utility

## Lessons Learned
1. Service workers are powerful but dangerous - be very selective about what to cache
2. Always provide user tools for service worker management
3. Test caching behavior in production, not just locally
4. Use absolute paths consistently in production apps
5. Layer multiple fixes - client-side AND server-side prevention

The issue is now completely resolved and the task scheduler is working perfectly in production!
