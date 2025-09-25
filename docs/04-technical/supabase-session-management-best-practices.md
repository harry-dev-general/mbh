# Supabase Session Management Best Practices

## Overview
Critical lessons learned from debugging authentication redirect loops in the MBH Staff Portal, focusing on proper Supabase session management in multi-page applications.

## Table of Contents
- [The Problem with getUser()](#the-problem-with-getuser)
- [Why getSession() is Reliable](#why-getsession-is-reliable)
- [Implementation Patterns](#implementation-patterns)
- [Common Pitfalls](#common-pitfalls)
- [Best Practices Checklist](#best-practices-checklist)

## Last Updated
Date: 2025-09-23
Version: 1.0

## The Problem with getUser()

### Race Condition During Session Restoration
When a page loads, Supabase needs to restore the session from storage. Using `getUser()` during this process can fail:

```javascript
// PROBLEMATIC CODE
async function checkAuth() {
    // This might return null even with valid session
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        // Incorrectly redirects even with valid session!
        window.location.href = 'auth.html';
    }
}
```

### Why It Fails
1. `getUser()` makes a network request to verify the token
2. During initial page load, the session might not be fully restored
3. Returns null temporarily, causing false negatives
4. Results in redirect loops as valid users are sent to login

## Why getSession() is Reliable

### Local Session Check First
`getSession()` checks local storage before making network requests:

```javascript
// CORRECT APPROACH
async function checkAuth() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
        console.error('Auth error:', error);
        window.location.href = 'auth.html';
        return;
    }
    
    if (!session || !session.user) {
        console.log('No active session');
        window.location.href = 'auth.html';
        return;
    }
    
    // Session exists, user is authenticated
    const user = session.user;
    // Continue with app logic...
}
```

### Benefits
1. Immediate response from local storage
2. No race condition during session restoration
3. More reliable for auth guards
4. Better performance (fewer network requests)

## Implementation Patterns

### 1. Consistent Initialization
All pages must use identical Supabase configuration:

```javascript
// config/supabase.js (shared module)
export const SUPABASE_URL = 'https://your-project.supabase.co';
export const SUPABASE_ANON_KEY = 'your-anon-key';

// In each page
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config/supabase.js';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### 2. Auth State Change Listener
Monitor authentication events for robust handling:

```javascript
// Set up once on page load
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth event:', event);
    
    switch(event) {
        case 'SIGNED_IN':
            console.log('User signed in');
            break;
            
        case 'SIGNED_OUT':
            console.log('User signed out, redirecting...');
            window.location.href = 'auth.html';
            break;
            
        case 'TOKEN_REFRESHED':
            console.log('Token refreshed');
            break;
            
        case 'USER_UPDATED':
            console.log('User data updated');
            // Might need to refresh user permissions
            break;
    }
});
```

### 3. Protected Route Pattern
Standard pattern for protecting pages:

```javascript
// Protected page initialization
async function initializePage() {
    // 1. Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'auth.html';
        return;
    }
    
    // 2. Check authorization (if needed)
    const user = session.user;
    if (!isAuthorized(user)) {
        window.location.href = 'unauthorized.html';
        return;
    }
    
    // 3. Load page data
    await loadPageData(user);
    
    // 4. Set up listeners
    setupEventListeners();
}

// Run on page load
document.addEventListener('DOMContentLoaded', initializePage);
```

### 4. Handling Multiple Auth Checks
Avoid redundant auth checks across components:

```javascript
// Cache the session check result
let authCheckPromise = null;

async function ensureAuthenticated() {
    if (!authCheckPromise) {
        authCheckPromise = checkAuth();
    }
    return authCheckPromise;
}

// Use in multiple places without duplicate checks
await ensureAuthenticated();
```

## Common Pitfalls

### 1. Mismatched Supabase Projects
**Problem**: Different pages using different Supabase URLs
**Solution**: Centralize configuration

### 2. Timing Issues
**Problem**: Checking auth before Supabase client is ready
**Solution**: Wait for DOM and Supabase initialization

```javascript
// Ensure Supabase is loaded
if (typeof window.supabase === 'undefined') {
    console.error('Supabase not loaded');
    return;
}
```

### 3. Redirect Loops
**Problem**: Pages redirecting to each other infinitely
**Solution**: Clear redirect logic with proper session checks

```javascript
// Add redirect source tracking
const from = new URLSearchParams(window.location.search).get('from');
if (from === 'auth') {
    // Came from auth page, don't redirect back
    console.log('Already tried auth, showing error');
    showAuthError();
    return;
}
```

### 4. Lost URL Parameters
**Problem**: Losing query parameters during redirects
**Solution**: Preserve important parameters

```javascript
function redirectToAuth() {
    const currentPath = window.location.pathname;
    const returnUrl = encodeURIComponent(currentPath);
    window.location.href = `auth.html?returnTo=${returnUrl}`;
}
```

## Best Practices Checklist

### Configuration
- [ ] Use same Supabase project across all pages
- [ ] Store credentials in environment variables
- [ ] Create shared configuration module

### Session Management
- [ ] Always use `getSession()` for auth checks
- [ ] Implement `onAuthStateChange` listeners
- [ ] Handle all auth events appropriately
- [ ] Cache session checks to avoid redundancy

### Error Handling
- [ ] Log auth errors with context
- [ ] Provide user-friendly error messages
- [ ] Implement fallback behaviors
- [ ] Add retry logic for transient failures

### Security
- [ ] Never expose service keys in frontend
- [ ] Validate permissions server-side
- [ ] Use Row Level Security (RLS)
- [ ] Implement proper CORS settings

### Performance
- [ ] Minimize auth checks per page load
- [ ] Use local session data when possible
- [ ] Implement proper loading states
- [ ] Avoid blocking UI during auth checks

## Testing Authentication

### Local Testing
```javascript
// Force logout for testing
await supabase.auth.signOut();

// Check current session
const { data: { session } } = await supabase.auth.getSession();
console.log('Current session:', session);

// Monitor auth events
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth event in test:', event, session);
});
```

### Debug Utilities
```javascript
// Add to development builds
window.debugAuth = {
    async checkSession() {
        const { data, error } = await supabase.auth.getSession();
        console.log('Session:', data, 'Error:', error);
        return data;
    },
    
    async forceRefresh() {
        const { data, error } = await supabase.auth.refreshSession();
        console.log('Refresh result:', data, 'Error:', error);
        return data;
    },
    
    clearStorage() {
        localStorage.clear();
        sessionStorage.clear();
        console.log('Storage cleared');
    }
};
```

## Related Documentation
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Redirect Loop Fix](../05-troubleshooting/redirect-loop-fix.md)
- [Authentication Setup](../01-setup/authentication-setup.md)
