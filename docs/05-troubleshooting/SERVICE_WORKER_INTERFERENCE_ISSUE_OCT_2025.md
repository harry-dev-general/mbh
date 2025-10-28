# Service Worker Interference Issue - October 2025 (RESOLVED)

## Overview
This document details a critical issue discovered on October 24, 2025, where task scheduler pages failed to load in production with 502 errors. The issue was caused by service worker interference and has been resolved.

## Issue Summary
- **Problem**: Task scheduler pages (`task-scheduler.html` and `task-scheduler-debug.html`) are returning 502 errors
- **Initial Theory**: The calendar service worker (`calendar-service-worker.js`) was intercepting all document requests and serving `management-allocations.html` as a fallback for any uncached page
- **Impact**: Task scheduler functionality is completely inaccessible in production
- **Status**: FULLY RESOLVED AND TESTED IN PRODUCTION ✅ - All issues fixed including authentication redirects. Task scheduler is now fully functional.

## Technical Discovery Process

### Initial Symptoms
1. Browser console showed 502 errors when accessing `/training/task-scheduler.html`
2. Diagnostic endpoints created in `server.js` showed no server-side issues
3. Environment variables were correctly configured

### Investigation Steps

#### Step 1: Server-Side Diagnostics
Created health check endpoints to verify server functionality:
```javascript
// /api/health - Check server status and environment variables
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseAnon: !!process.env.SUPABASE_ANON_KEY,
      hasSupabaseService: !!process.env.SUPABASE_SERVICE_KEY,
      hasAirtableKey: !!process.env.AIRTABLE_API_KEY,
      hasTwilioSid: !!process.env.TWILIO_ACCOUNT_SID,
      nodeEnv: process.env.NODE_ENV,
      railwayEnv: process.env.RAILWAY_ENVIRONMENT
    }
  });
});

// /api/task-scheduler-test - Test Airtable connectivity for Management base
app.get('/api/task-scheduler-test', async (req, res) => {
  try {
    const testUrl = 'https://api.airtable.com/v0/appPyOlmuQyAM6cJQ/tblKNgpHZ8sWHYuEt?maxRecords=1';
    const response = await axios({
      method: 'GET',
      url: testUrl,
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`
      }
    });
    
    res.json({
      status: 'ok',
      message: 'Task scheduler test successful',
      airtable: {
        connected: true,
        recordCount: response.data.records.length
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Task scheduler test failed',
      error: error.message
    });
  }
});
```

#### Step 2: Diagnostic Page Creation
Created `task-scheduler-debug.html` to test various aspects:
- Server health check
- Task scheduler API endpoint
- Direct Airtable API access for both Management and Operations bases

#### Step 3: Discovering the Root Cause
When the diagnostic page also failed to load, browser console logs revealed:
- `management-allocations.html` was being served instead of the requested page
- JavaScript errors from `calendar-enhancements.js` (which belongs to management-allocations)
- This indicated a routing or caching issue, not a server-side problem

#### Step 4: Service Worker Analysis
Examined `calendar-service-worker.js` and found the problematic code:
```javascript
// Original problematic code
.catch(() => {
  // Return offline page for navigation requests
  if (event.request.destination === 'document') {
    return caches.match('/training/management-allocations.html');
  }
})
```

This code was serving `management-allocations.html` as a fallback for ANY document request that wasn't in the cache.

## Attempted Solutions (Failed)

### Service Worker Fix (Did Not Resolve Issue)
Modified the service worker to only serve the fallback for management-allocations specific paths:
```javascript
.catch(() => {
  // Only return offline page for management-allocations related requests
  if (event.request.destination === 'document' && 
      (url.pathname === '/training/management-allocations.html' || 
       url.pathname === '/training/management-allocations')) {
    return caches.match('/training/management-allocations.html');
  }
  // For other pages, just fail normally
  return new Response('Offline - Page not available', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: new Headers({
      'Content-Type': 'text/plain'
    })
  });
})
```

### Service Worker Management Utility
Created `unregister-sw.html` to help manage service workers:
- Check active service workers
- Unregister all service workers
- Clear all caches
- Provides links to test affected pages

## Key Learnings

### 1. Service Worker Scope Issues
- Service workers can affect pages outside their intended scope
- Fallback strategies must be carefully scoped to specific paths
- Generic fallbacks can break unrelated functionality

### 2. Debugging Approach
- Initial assumption of server-side issues (502 errors) was incorrect
- Browser console logs showing unexpected page content were the key indicator
- Service workers can masquerade as server errors

### 3. Cache Strategy Best Practices
- Always scope fallback pages to specific paths
- Consider using different service workers for different features
- Implement proper error responses instead of generic fallbacks

### 4. Testing Considerations
- Service workers persist across deployments
- Users may have cached service workers that need manual clearing
- Always test service worker changes in incognito/private mode first

## Environment Variables
The investigation revealed these are correctly configured:
- `AIRTABLE_BASE_ID`: Set to Operations base (`applkAFOn2qxtu7tx`)
- `AIRTABLE_API_KEY`: Properly configured
- Server correctly handles both Management (`appPyOlmuQyAM6cJQ`) and Operations bases through API proxy

## Files Modified
1. `/training/calendar-service-worker.js` - Fixed fallback logic
2. `/training/unregister-sw.html` - Created service worker management utility
3. `/server.js` - Added diagnostic endpoints (can be removed if not needed)
4. `/training/task-scheduler-debug.html` - Created diagnostic page (can be removed)

## Current Status
The issue remains unresolved. After attempting the service worker fix:
1. The unregister service worker page (`/training/unregister-sw.html`) also fails to load
2. The task scheduler pages continue to return 502 errors
3. The diagnostic page (`/training/task-scheduler-debug.html`) also fails to load
4. Browser console logs show that `management-allocations.html` is still being served instead

## Next Investigation Steps
1. **Check Railway deployment logs** - The 502 errors suggest a server-side issue
2. **Verify static file serving** - The Express static middleware configuration may have issues
3. **Check file permissions** - Ensure the new files are accessible in the Railway deployment
4. **Review nginx/proxy configuration** - Railway's edge proxy may be blocking certain paths
5. **Test direct server access** - Try accessing the Node.js server directly without Railway's proxy

## Resolution (October 2025) - COMPLETE

The issue was resolved through a multi-pronged approach:

### 1. Service Worker Updates
- **Version Bump**: Incremented cache version from `mbh-calendar-v1` to `mbh-calendar-v2` to force updates
- **Path Exclusions**: Added excluded paths array to prevent service worker from intercepting task scheduler pages
- **Fetch Handler Fix**: Modified fetch event to skip excluded paths entirely

### 2. Server-Side Changes
- **Explicit Routes**: Added explicit Express routes for task scheduler pages with no-cache headers
- **Cache Prevention Middleware**: Added middleware to set cache-control headers for excluded paths
- **Direct File Serving**: Ensured task scheduler files bypass service worker entirely

### 3. Service Worker Management
- **Force Update Page**: Created `/training/sw-force-update.html` to help users update stuck service workers
- **Inline Implementation**: Made the page self-contained with no external dependencies

### Implementation Details

#### Updated Service Worker (calendar-service-worker.js)
```javascript
const CACHE_NAME = 'mbh-calendar-v2'; // Incremented version
const excludedPaths = [
  '/training/task-scheduler.html',
  '/training/task-scheduler-debug.html',
  '/training/unregister-sw.html',
  '/api/task-scheduler-proxy',
  '/api/task-scheduler-test'
];

// In fetch handler:
if (excludedPaths.some(path => url.pathname === path || url.pathname.startsWith(path))) {
  return; // Don't intercept, let browser handle normally
}
```

#### Server Routes (server.js)
```javascript
// Explicit routes with cache prevention
app.get('/training/task-scheduler.html', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, 'training', 'task-scheduler.html'));
});
```

### Deployment Steps
1. Deploy the updated service worker with new version
2. Deploy server.js with explicit routes and cache headers
3. Users with stuck service workers can access `/training/sw-force-update.html`
4. The force update page will update and clear old service workers

### Additional Issues Found and Fixed

#### Resource Path Issues
- **Problem**: Task scheduler page used relative paths that didn't match Express static serving
- **Fix**: Updated paths from relative to absolute:
  - `js/supabase-init-fix.js` → `/js/supabase-init-fix.js`
  - `js/role-helper.js` → `/js/role-helper.js`
  - `MBH.svg` → `/images/mbh-logo.png`

#### Supabase Initialization Missing
- **Problem**: `supabase` variable was undefined, causing `Cannot read properties of undefined` errors
- **Fix**: Added proper initialization in task-scheduler.html:
  ```javascript
  // Added to global variables
  let supabase = null;
  
  // Added to DOMContentLoaded handler
  supabase = await window.SupabaseInit.getClient();
  ```

#### Authentication Redirect Loop
- **Problem**: Direct access to task scheduler page caused redirect to auth page
- **Fix**: Changed authentication check to use `getSession()` instead of `getUser()`:
  ```javascript
  // Before (makes API call)
  const { data: { user } } = await supabase.auth.getUser();
  
  // After (uses cached session)
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  ```
  Also added auth state listener and proper returnUrl handling for auth redirects.

#### Variable Scoping Issue
- **Problem**: User variable was destructured inside try block but used outside, causing undefined reference and authentication failures
- **Fix**: Declared user variable outside try block to ensure proper scoping:
  ```javascript
  // Before (scoping issue)
  try {
      const { user } = await checkAuth();
      // ...
  }
  currentUser = user; // Error: user is undefined
  
  // After (fixed)
  let user = null;
  try {
      const authResult = await checkAuth();
      user = authResult.user;
      // ...
  }
  currentUser = user; // Works correctly
  ```
- **Result**: Eliminated runtime errors and authentication failures due to scoping issues

### Files Modified in Resolution
1. `/training/calendar-service-worker.js` - Added path exclusions and version bump
2. `/server.js` - Added explicit routes and cache prevention middleware
3. `/training/sw-force-update.html` - Created service worker management utility
4. `/training/task-scheduler.html` - Fixed resource paths, Supabase initialization, and authentication flow (using getSession instead of getUser)
5. `/training/management-dashboard.html` - Added Task Scheduler navigation links
6. This documentation file - Updated with complete resolution details

### Final Summary
The task scheduler 502 error issue was successfully resolved through a multi-layered approach:
1. **Service Worker Fix**: Prevented the service worker from intercepting task scheduler pages
2. **Server-Side Fix**: Added explicit routes with cache prevention headers
3. **Resource Path Fix**: Corrected JavaScript and image paths to use absolute URLs
4. **Supabase Fix**: Added proper Supabase client initialization
5. **Authentication Fix**: Changed to use cached session checks and absolute auth paths
6. **Navigation**: Added task scheduler links to the management dashboard for easy access

The task scheduler is now fully functional and accessible in production.

## Final Verification (October 26, 2025)

The task scheduler has been successfully tested in production with the following results:

### Browser Console (Success)
```
task-scheduler.html:605 Initializing Supabase client...
supabase-init-fix.js:78 [SupabaseInit] Client created successfully
task-scheduler.html:572 Checking authentication...
task-scheduler.html:584 User found: harry@priceoffice.com.au
task-scheduler.html:588 Access control result: true
task-scheduler.html:708 Loaded staff members: 5
task-scheduler.html:740 Loaded tasks: Array(23)
```

### Server Logs (Success)
- Task scheduler page served successfully with no-cache headers
- All static assets loaded without errors
- Airtable API calls successful
- No 502 errors or authentication loops

### Production Verification
- **URL**: https://mbh-production-f0d1.up.railway.app/task-scheduler.html
- **Access**: Available through Management Dashboard navigation
- **Data**: Loading 5 staff members and 23 tasks from Airtable
- **Authentication**: Working correctly with session persistence

## Related Documentation
- [Task Scheduler Implementation](/docs/02-features/task-scheduler/TASK_SCHEDULER_README.md)
- [Calendar Implementation](/docs/02-features/calendar/)
- [Service Worker Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)
