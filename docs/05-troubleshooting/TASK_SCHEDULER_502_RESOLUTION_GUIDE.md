# Task Scheduler 502 Error Resolution Guide

## Overview
This document provides a comprehensive guide to understanding and resolving the critical 502 error issues that affected the MBH Staff Portal's Task Scheduler feature in October 2025. The issue prevented all task scheduler-related pages from loading in production, despite working correctly in local development.

## Issue Timeline
- **October 26, 2025**: Critical issue discovered - all task scheduler pages returning 502 errors
- **Root Cause**: Service Worker interference from `calendar-service-worker.js`
- **Resolution**: Multiple layers of fixes required, from service worker updates to authentication flow corrections

## Technical Discovery Process

### 1. Initial Symptoms
- Pages affected:
  - `/training/task-scheduler.html` - Main task scheduler page
  - `/training/task-scheduler-debug.html` - Diagnostic page
  - `/training/unregister-sw.html` - Service worker management page
- Error: 502 Bad Gateway in production (Railway)
- Browser console revealed: `management-allocations.html` was being served instead

### 2. Root Cause Analysis

#### Service Worker Interference
The primary issue was the `calendar-service-worker.js` intercepting all document requests:

```javascript
// PROBLEMATIC CODE
self.addEventListener('fetch', event => {
    // ...
    if (request.destination === 'document') {
        event.respondWith(
            caches.match(request).then(response => {
                return response || fetch(request).catch(() => {
                    // This was serving management-allocations.html for ALL document requests!
                    return caches.match('/management-allocations.html');
                });
            })
        );
    }
});
```

### 3. Cascading Issues Discovered

After fixing the service worker, several additional issues were uncovered:

#### A. Resource Path Issues
Express serves files from the `training` directory at the root level, causing path confusion:
- Relative path: `js/supabase-init-fix.js` → Resolved to: `/training/js/supabase-init-fix.js` ❌
- Correct path: `/js/supabase-init-fix.js` → Resolved to: `/js/supabase-init-fix.js` ✅

#### B. Supabase Initialization Missing
The `supabase` client wasn't initialized before authentication checks.

#### C. Authentication Flow Issues
- Using `getUser()` (API call) instead of `getSession()` (cached)
- Relative redirect paths causing 404 errors
- Missing authentication state handlers

## Complete Fix Implementation

### 1. Service Worker Updates

**File**: `/training/calendar-service-worker.js`

```javascript
// Version bump to force update
const CACHE_NAME = 'mbh-calendar-v2';

// Exclude task scheduler paths
const excludedPaths = [
    '/training/task-scheduler.html',
    '/training/task-scheduler-debug.html',
    '/training/unregister-sw.html',
    '/api/task-scheduler-proxy',
    '/api/task-scheduler-test'
];

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Skip excluded paths - let them go directly to network
    if (excludedPaths.some(path => url.pathname === path || url.pathname.startsWith(path))) {
        return; // Don't intercept
    }
    // ... rest of handler
});
```

### 2. Server-Side Cache Prevention

**File**: `/server.js`

```javascript
// Middleware to prevent service worker caching
app.use((req, res, next) => {
    const excludedPaths = [
        '/training/task-scheduler.html',
        '/training/task-scheduler-debug.html',
        '/training/unregister-sw.html',
        '/training/sw-force-update.html',
        '/task-scheduler.html',
        '/task-scheduler-debug.html',
        '/unregister-sw.html',
        '/sw-force-update.html'
    ];

    if (excludedPaths.includes(req.path)) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Service-Worker-Allowed', 'none');
    }
    next();
});

// Explicit routes for task scheduler pages
app.get('/training/task-scheduler.html', (req, res) => {
    const filePath = path.join(__dirname, 'training', 'task-scheduler.html');
    
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Error serving task-scheduler.html:', err);
            res.status(500).send('Error loading task scheduler');
        }
    });
});
```

### 3. Resource Path Fixes

**File**: `/training/task-scheduler.html`

```html
<!-- BEFORE (incorrect relative paths) -->
<script src="js/supabase-init-fix.js"></script>
<script src="js/role-helper.js"></script>

<!-- AFTER (correct absolute paths) -->
<script src="/js/supabase-init-fix.js"></script>
<script src="/js/role-helper.js"></script>
```

### 4. Authentication Flow Corrections

**File**: `/training/task-scheduler.html`

```javascript
// Global variable initialization
let supabase = null;

// Proper authentication check using cached session
async function checkAuth() {
    // Use getSession for immediate cached check
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session || !session.user) {
        return { user: null };
    }
    
    const user = session.user;
    const hasAccess = await checkAccessControl(user.email);
    
    if (!hasAccess) {
        await supabase.auth.signOut();
        return { user: null };
    }
    
    return { user };
}

// DOMContentLoaded with proper initialization order
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Initialize Supabase FIRST
        supabase = await window.SupabaseInit.getClient();
        
        // Then check authentication
        const authResult = await checkAuth();
        const user = authResult.user;
        
        if (!user) {
            // Use ABSOLUTE paths for redirects
            const returnUrl = encodeURIComponent(window.location.pathname);
            window.location.href = `/auth.html?returnUrl=${returnUrl}`;
            return;
        }
        
        // Continue with initialization...
    } catch (error) {
        console.error('Initialization error:', error);
        alert('Failed to initialize application. Please refresh the page.');
        return;
    }
});
```

## Service Worker Management Tools

### Force Update Page
Created `/training/sw-force-update.html` to help users clear problematic service workers:

```javascript
// Force update all service workers
async function forceUpdateServiceWorkers() {
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    for (let registration of registrations) {
        // Skip waiting to activate new worker immediately
        if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        
        // Force update check
        await registration.update();
    }
}
```

## Key Learnings

### 1. Service Worker Persistence
- Service workers persist across deployments and browser sessions
- Version bumping (`CACHE_NAME`) is essential for forcing updates
- Users may have cached service workers that intercept requests indefinitely

### 2. Express Static File Serving
- `express.static('training')` serves files at root level, not under `/training/`
- Always use absolute paths (`/path`) in HTML when Express serves from subdirectories
- Middleware order matters - cache prevention must come before static serving

### 3. Authentication Best Practices
- Use `getSession()` for immediate checks (cached)
- Use `getUser()` only when fresh data is required (API call)
- Always use absolute paths for auth redirects
- Initialize Supabase client before any auth operations

### 4. Debugging Strategies
- Create minimal test pages to isolate issues
- Add extensive logging to both client and server
- Use browser DevTools to check actual network requests
- Create service worker management utilities for users

## Prevention Strategies

### 1. Service Worker Design
- Be extremely selective about what paths to intercept
- Always include version control in cache names
- Provide clear exclusion lists for dynamic content
- Consider if service workers are necessary for your use case

### 2. Development vs Production Parity
- Test service worker behavior in production-like environments
- Be aware of path differences between local and deployed environments
- Test cache clearing and update mechanisms

### 3. Error Handling
- Implement comprehensive error logging
- Provide user-friendly error messages
- Create diagnostic endpoints for troubleshooting
- Include service worker management tools

## Testing Checklist

When implementing similar features, test:

1. [ ] Service worker behavior with new pages
2. [ ] Resource loading with correct paths
3. [ ] Authentication flow including redirects
4. [ ] Cache behavior across deployments
5. [ ] Error states and fallbacks
6. [ ] Service worker updates and migrations
7. [ ] Cross-browser compatibility
8. [ ] Mobile device behavior

## References

- Original issue: `docs/05-troubleshooting/SERVICE_WORKER_INTERFERENCE_ISSUE_OCT_2025.md`
- Service Worker API: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- Express Static Files: https://expressjs.com/en/starter/static-files.html
- Railway Deployment: https://docs.railway.app/
