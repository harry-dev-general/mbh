# Security Update Impact on Availability System
**Date**: November 7, 2025  
**Security Update**: October 2025 API Key Protection  
**Affected Systems**: availability.html, my-schedule.html, vessel-checklists.html

## Security Update Summary

In October 2025, API keys were moved from client-side code to server-side only, accessible via authenticated `/api/config` endpoint.

## Impact on Availability System

### 1. Initial Authentication Errors

**Problem**: Pages failed with "Required configuration values missing"  
**Cause**: loadConfig() expected AIRTABLE_API_KEY on initial load  
**Fix**: Split configuration loading:
- Initial load: Only require Supabase config
- Post-auth: Load Airtable API key with auth headers

### 2. Configuration Loading Pattern

**Before** (Problematic):
```javascript
async function loadConfig() {
    const response = await fetch('/api/config');
    // ...
    if (!AIRTABLE_API_KEY || !SUPABASE_URL) {
        throw new Error('Required configuration values missing');
    }
}
```

**After** (Fixed):
```javascript
async function loadConfig() {
    // Only check Supabase config initially
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error('Required Supabase configuration values missing');
    }
}

async function loadConfigWithAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    const headers = {};
    if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    const response = await fetch('/api/config', { headers });
    // Load Airtable API key here
}
```

### 3. API Proxy Updates

All direct Airtable calls updated from:
```javascript
fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`, {
    headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }
})
```

To:
```javascript
fetch(`/api/airtable/${BASE_ID}/${TABLE_ID}`)
```

### 4. Initialization Flow Changes

**Before**:
1. Load config
2. Check auth
3. Load data

**After**:
1. Load config (Supabase only)
2. Check auth
3. Load config with auth (Airtable key)
4. Load data

## Files Updated

### availability.html
- Added loadConfigWithAuth() function
- Updated initialization flow
- Fixed default time format bug (discovered during investigation)

### my-schedule.html
- Fixed duplicate AIRTABLE_API_KEY declaration
- Updated all Airtable API calls to use proxy
- Fixed initialization order

### vessel-checklists.html
- Fixed Supabase initialization
- Corrected API endpoint paths
- Updated configuration property names

## Lessons Learned

1. **Gradual configuration loading**: Don't require all config on initial load
2. **Auth-dependent resources**: Load sensitive config only after authentication
3. **Consistent initialization**: Establish clear patterns across all pages
4. **Default value testing**: Security updates can expose existing bugs

## Testing Recommendations

1. Test with cleared browser cache
2. Test unauthenticated access attempts
3. Verify all API calls use proxy endpoints
4. Check console for exposed API keys
5. Test with empty/default form values
