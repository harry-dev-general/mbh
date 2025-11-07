# Google Maps API Troubleshooting Guide

## Issue: "Map configuration error" after Security Update

### Problem Description
After the October 2025 security update, Google Maps stopped loading on:
- `/management-dashboard.html` (Fleet component)
- `/vessel-maintenance.html` (Update Location modal)

Error in console: `Failed to load Google Maps configuration: Error: Google Maps API key not configured on server`

### Root Cause
The `/api/config` endpoint only returns the Google Maps API key when the user is authenticated. The authentication headers were missing when fetching the configuration.

### Solution Applied

1. **Updated API calls to include authentication headers**:
   ```javascript
   // Get current session for authentication
   const { session } = await window.SupabaseInit.getSession();
   const headers = {};
   if (session?.access_token) {
       headers['Authorization'] = `Bearer ${session.access_token}`;
   }
   
   const response = await fetch('/api/config', { headers });
   ```

2. **Files updated**:
   - `/training/vessel-maintenance.html`
   - `/training/management-dashboard.html`

### Verification Steps

1. **Check Railway Environment Variables**:
   - Go to Railway Dashboard → Your Project → Variables
   - Ensure `GOOGLE_MAPS_API_KEY` is set
   - The key should match what's configured in Google Cloud Console

2. **Verify Google Cloud Console Settings**:
   - API key should have HTTP referrer restrictions
   - Allowed referrers should include:
     - `https://mbh-production-f0d1.up.railway.app/*`
     - `https://mbh-development.up.railway.app/*`
   - Maps JavaScript API should be enabled

3. **Test the Fix**:
   - Clear browser cache
   - Log in to the application
   - Navigate to `/management-dashboard.html`
   - Check if the Fleet map loads
   - Go to `/vessel-maintenance.html`
   - Click "Update Location" on any vessel
   - Verify the map appears in the modal

### Debug Checklist

If maps still don't load:

1. **Check Browser Console**:
   ```javascript
   // Run this in console after logging in
   fetch('/api/config', {
       headers: {
           'Authorization': `Bearer ${(await window.SupabaseInit.getSession()).session.access_token}`
       }
   }).then(r => r.json()).then(console.log)
   ```
   - Verify `googleMapsApiKey` is present and not empty

2. **Check Authentication**:
   ```javascript
   // Verify session exists
   const { session } = await window.SupabaseInit.getSession();
   console.log('Session:', session ? 'Present' : 'Missing');
   console.log('Access Token:', session?.access_token ? 'Present' : 'Missing');
   ```

3. **Check Network Tab**:
   - Look for `/api/config` request
   - Verify it has Authorization header
   - Check response includes `googleMapsApiKey`

4. **Railway Logs**:
   - Check for any server errors
   - Look for "Optional authentication error" messages
   - Verify environment variables are loaded

### Common Issues

1. **"RefererNotAllowedMapError"**:
   - The domain isn't in Google Cloud Console allowed referrers
   - Add your Railway URL to the API key restrictions

2. **Empty googleMapsApiKey in response**:
   - Environment variable not set in Railway
   - Variable name mismatch (should be `GOOGLE_MAPS_API_KEY`)
   - Authentication failed

3. **Maps load for admin but not staff**:
   - This shouldn't happen with current fix
   - Both roles should have access to maps
   - Check role permissions if issue persists

### Emergency Workaround

If urgent and maps won't load, you can temporarily modify server.js:

```javascript
// In server.js, line 214-226
// TEMPORARY - Remove after fixing auth issue
const publicConfig = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    API_BASE_URL: '',
    APP_URL: process.env.APP_URL || '',
    // Temporarily expose Maps API key
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || ''
};

// Comment out the auth check
// if (req.user) { ... }
```

⚠️ **WARNING**: This exposes the API key publicly. Only use temporarily and ensure API key has proper domain restrictions.

### Long-term Recommendations

1. Consider implementing a separate endpoint for public resources like map configuration
2. Add retry logic for loading Google Maps
3. Implement fallback UI when maps fail to load
4. Add monitoring for API key usage in Google Cloud Console
