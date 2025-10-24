# Service Worker Interference Issue - October 2025

## Overview
This document details a critical issue discovered on October 24, 2025, where the calendar service worker was intercepting all page requests and serving the wrong content, preventing access to the task scheduler feature.

## Issue Summary
- **Problem**: Task scheduler pages (`task-scheduler.html` and `task-scheduler-debug.html`) were returning 502 errors
- **Root Cause**: The calendar service worker (`calendar-service-worker.js`) was intercepting all document requests and serving `management-allocations.html` as a fallback for any uncached page
- **Impact**: Any page not explicitly cached by the service worker would display the management allocations page instead
- **Resolution**: Modified service worker to only serve fallback content for management-allocations specific paths

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

## Solution Implementation

### Service Worker Fix
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

## Post-Fix Actions Required
1. Users experiencing the issue need to:
   - Visit `/training/unregister-sw.html`
   - Unregister service workers
   - Clear caches
2. New visitors will automatically get the fixed service worker
3. Consider removing diagnostic endpoints and pages after verification

## Related Documentation
- [Task Scheduler Implementation](/docs/02-features/task-scheduler/TASK_SCHEDULER_README.md)
- [Calendar Implementation](/docs/02-features/calendar/)
- [Service Worker Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)
