# Management Dashboard Redirect Loop Fix

## Overview
Resolved a critical redirect loop issue that occurred when management users tried to access the new management dashboard, causing the page to cycle infinitely between auth.html, dashboard.html, and management-dashboard.html.

## Table of Contents
- [Problem Description](#problem-description)
- [Root Causes](#root-causes)
- [Failed Attempts](#failed-attempts)
- [Successful Solution](#successful-solution)
- [Technical Implementation](#technical-implementation)
- [Lessons Learned](#lessons-learned)

## Last Updated
Date: 2025-09-23
Version: 1.0

## Problem Description

### Symptoms
- Management users clicking "Manager" view or accessing `/management-dashboard.html` directly
- Infinite redirect loop: auth → dashboard → management-dashboard → auth
- Browser eventually stops with "too many redirects" error
- Both production and development environments affected

### User Impact
- Complete inability to access management dashboard
- Forced to use employee view only
- New UI features inaccessible

## Root Causes

### 1. Different Supabase Projects
The management dashboard was using different Supabase credentials than the regular dashboard:

```javascript
// management-dashboard.html (WRONG)
const SUPABASE_URL = 'https://btqbpgknekirqpwstizp.supabase.co';

// dashboard.html (CORRECT)
const SUPABASE_URL = 'https://etkugeooigiwahikrmzr.supabase.co';
```

### 2. Session Check Method
Using `getUser()` instead of `getSession()` caused race conditions:

```javascript
// PROBLEMATIC
const { data: { user } } = await supabase.auth.getUser();

// CORRECT
const { data: { session }, error } = await supabase.auth.getSession();
```

### 3. Missing Auth State Handler
No listener for authentication state changes:

```javascript
// NEEDED
supabase.auth.onAuthStateChange((event, session) => {
    // Handle auth events
});
```

### 4. Management Email List Mismatch
Different authorized email lists between dashboards caused authorization failures.

## Failed Attempts

### Attempt 1: Session Storage Flags
Tried using `sessionStorage` to prevent loops:
```javascript
if (sessionStorage.getItem('redirecting')) {
    return; // Don't redirect again
}
```
**Result**: Didn't work - storage was cleared between redirects

### Attempt 2: Local Storage Preferences
Implemented view preference system:
```javascript
localStorage.setItem('preferredView', 'management');
```
**Result**: Made the problem worse - conflicted with URL parameters

### Attempt 3: URL Parameter Preservation
Attempted to maintain `?view=regular` parameter:
```javascript
window.location.href = `dashboard.html?view=regular`;
```
**Result**: Parameters were stripped during redirects

## Successful Solution

### 1. Unified Supabase Configuration
Ensured both dashboards use the same Supabase instance:

```javascript
// Both dashboard.html and management-dashboard.html
const SUPABASE_URL = 'https://etkugeooigiwahikrmzr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
```

### 2. Robust Session Checking
Switched to `getSession()` for reliable auth checks:

```javascript
async function checkAuth() {
    // Use getSession instead of getUser
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
        console.error('Auth error:', error);
        window.location.href = 'auth.html';
        return;
    }
    
    if (!session || !session.user) {
        console.log('No active session, redirecting to auth');
        window.location.href = 'auth.html';
        return;
    }
    
    const user = session.user;
    // Continue with authorization checks...
}
```

### 3. Auth State Change Listener
Added proper event handling:

```javascript
// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth event:', event);
    
    if (event === 'SIGNED_OUT') {
        window.location.href = 'auth.html';
    }
    
    if (event === 'INITIAL_SESSION' && !session) {
        console.log('No initial session, will redirect from checkAuth');
    }
});
```

### 4. Synchronized Management Emails
Aligned email lists across both dashboards:

```javascript
const managementEmails = [
    'harry@priceoffice.com.au',
    'mmckelvey03@gmail.com',
    'manager@mbh.com',
    'admin@mbh.com',
    'operations@mbh.com'
];
```

## Technical Implementation

### Complete Auth Flow
1. User lands on management-dashboard.html
2. `getSession()` checks for valid session
3. If no session → redirect to auth.html
4. If session exists → verify user email against management list
5. If not authorized → redirect to dashboard.html
6. If authorized → load management interface

### Key Code Changes

#### File: `/training/management-dashboard.html`
```javascript
// Initialize Supabase - must match dashboard.html
const SUPABASE_URL = 'https://etkugeooigiwahikrmzr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkAuth() {
    const { data: { session }, error } = await supabase.auth.getSession();
    // ... proper session handling
}
```

## Lessons Learned

### 1. Supabase Best Practices
- Always use `getSession()` for auth checks, not `getUser()`
- Ensure all pages use the same Supabase project
- Implement `onAuthStateChange` listeners

### 2. Debugging Techniques
- Use browser DevTools Network tab to trace redirect sequence
- Add console.log at each redirect point
- Check for mismatched configurations between files

### 3. Architecture Considerations
- Centralize auth configuration
- Use environment variables for credentials
- Consider a shared auth module

### 4. Testing Approach
- Test in incognito/private browsing to avoid cache issues
- Clear localStorage/sessionStorage between tests
- Test both direct URL access and navigation

## Prevention Strategies

1. **Configuration Management**
   - Use a central config file for Supabase settings
   - Environment-based configuration loading

2. **Code Review Checklist**
   - Verify Supabase URLs match across files
   - Check auth flow uses `getSession()`
   - Ensure management email lists are synchronized

3. **Monitoring**
   - Log redirect attempts
   - Track failed auth attempts
   - Monitor for redirect loops in production

## Related Documentation
- [Authentication Setup](../01-setup/authentication-setup.md)
- [View Toggle Feature](../VIEW_TOGGLE_FEATURE.md)
- [Management Dashboard Guide](../02-features/management-dashboard/overview.md)
