# Google Maps API Security Issue

## Problem
The Google Maps API key is exposed in the HTML source code at:
`https://mbh-production-f0d1.up.railway.app/vessel-locations-map.html`

## Immediate Fix Applied
Updated Content Security Policy (CSP) to allow Google Maps scripts:
- Added `https://maps.googleapis.com` to scriptSrc
- Added `https://maps.gstatic.com` to imgSrc
- Added `https://fonts.googleapis.com` to styleSrc
- Added `https://fonts.gstatic.com` to fontSrc
- Added `https://www.google.com` to frameSrc

## Security Recommendations

### Option 1: Restrict API Key (Recommended for Quick Fix)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services → Credentials
3. Find your API key: `AIzaSyBbjgKhMV5I1nwWa8pCf7m-_7G1dz8EDbw`
4. Click on it to edit
5. Under "Application restrictions", select "HTTP referrers"
6. Add these referrers:
   - `https://mbh-production-f0d1.up.railway.app/*`
   - `http://localhost:3000/*` (for development)
7. Under "API restrictions", select "Restrict key"
8. Choose only "Maps JavaScript API"
9. Save changes

### Option 2: Use Environment Variable (Better Security)
1. Add to Railway environment variables:
   ```
   GOOGLE_MAPS_API_KEY=your_new_api_key
   ```

2. Create a server endpoint to inject the key:
   ```javascript
   app.get('/api/maps-config', (req, res) => {
     res.json({ apiKey: process.env.GOOGLE_MAPS_API_KEY });
   });
   ```

3. Update the HTML to fetch the key dynamically:
   ```javascript
   fetch('/api/maps-config')
     .then(res => res.json())
     .then(config => {
       const script = document.createElement('script');
       script.src = `https://maps.googleapis.com/maps/api/js?key=${config.apiKey}&callback=initMap&libraries=&v=weekly`;
       script.async = true;
       document.head.appendChild(script);
     });
   ```

### Option 3: Server-Side Rendering
For maximum security, render the map server-side or use a proxy, but this is complex for Google Maps.

## Current Status
- CSP has been updated to allow Google Maps
- The map should work once Railway redeploys
- API key is still exposed but can be restricted via Google Cloud Console

## Action Items
1. **Immediate**: Restrict the current API key in Google Cloud Console
2. **Short-term**: Generate a new API key and restrict it properly
3. **Long-term**: Implement environment variable solution

## Notes
- The exposed API key (`AIzaSyBbjgKhMV5I1nwWa8pCf7m-_7G1dz8EDbw`) should be considered compromised
- Without restrictions, anyone can use this key for their own Google Maps requests
- This could lead to unexpected charges on your Google Cloud account