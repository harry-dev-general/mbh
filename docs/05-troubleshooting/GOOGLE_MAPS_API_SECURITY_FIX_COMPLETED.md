# Google Maps API Security Fix - Completed

## Summary
The Google Maps API key has been successfully moved from hardcoded values in HTML files to server-side environment configuration.

## Changes Made

### 1. Environment Configuration
- Added `GOOGLE_MAPS_API_KEY` to `env.example` file

### 2. Server Configuration
- Added `/api/config` endpoint in `server.js` to serve the API key securely
- The endpoint returns: `{ googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '' }`

### 3. Updated HTML Files
The following files have been updated to fetch the API key from the server:
- `training/vessel-locations-map.html`
- `training/management-dashboard.html`
- `training/post-departure-checklist.html`
- `training/vessel-maintenance.html`
- `training/my-schedule.html`

### 4. Implementation Pattern
All files now use this pattern:
```javascript
async function loadGoogleMapsWithConfig() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        const GOOGLE_MAPS_API_KEY = config.googleMapsApiKey;
        
        if (!GOOGLE_MAPS_API_KEY) {
            throw new Error('Google Maps API key not configured on server');
        }
        
        // Load Google Maps script with the key
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}...`;
        document.head.appendChild(script);
    } catch (error) {
        console.error('Failed to load configuration:', error);
        // Handle error appropriately
    }
}
```

## Deployment Steps Required

### 1. Set Environment Variable on Railway
1. Go to your Railway project dashboard
2. Navigate to the Variables tab
3. Add new variable:
   - Key: `GOOGLE_MAPS_API_KEY`
   - Value: `AIzaSyBbjgKhMV5I1nwWa8pCf7m-_7G1dz8EDbw` (or a new restricted key)

### 2. Restrict the API Key (CRITICAL)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services → Credentials**
3. Find your API key: `AIzaSyBbjgKhMV5I1nwWa8pCf7m-_7G1dz8EDbw`
4. Click on it to edit
5. Under **Application restrictions**, select **HTTP referrers (web sites)**
6. Add these allowed referrers:
   ```
   https://mbh-production-f0d1.up.railway.app/*
   http://localhost:3000/*
   http://localhost:8080/*
   ```
7. Under **API restrictions**, select **Restrict key**
8. Choose only: **Maps JavaScript API**
9. Click **SAVE**

### 3. Deploy the Changes
```bash
git add -A
git commit -m "Security Fix: Move Google Maps API key to environment variables

- Removed hardcoded API key from all HTML files
- Added /api/config endpoint to serve API key securely
- Updated all map-related pages to fetch key from server
- Added GOOGLE_MAPS_API_KEY to env.example

IMPORTANT: After deployment, the GOOGLE_MAPS_API_KEY environment variable must be set on Railway"

git push origin main
```

### 4. Verify Deployment
After Railway auto-deploys:
1. Check that all map pages still load correctly
2. Verify no API key is visible in page source
3. Monitor Google Cloud Console for any unauthorized usage

## Security Benefits
- API key is no longer exposed in public HTML
- Key can be rotated without code changes
- Different keys can be used for different environments
- Reduces risk of unauthorized usage and unexpected charges

## Rollback Plan
If issues occur after deployment:
1. The old hardcoded key will continue to work if it's still valid
2. You can temporarily revert the changes while troubleshooting
3. Consider creating a new restricted key if the old one was compromised

## Long-term Recommendations
1. Create separate API keys for production and development
2. Set up billing alerts in Google Cloud Console
3. Regularly audit API usage
4. Consider implementing request quotas
