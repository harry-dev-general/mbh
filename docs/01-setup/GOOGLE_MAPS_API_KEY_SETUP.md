# Google Maps API Key Setup Guide

## Overview
The MBH Staff Portal uses Google Maps for vessel location tracking and fleet visualization. After the recent security update, the API key must be configured as an environment variable on the server.

## Current Issue
The Google Maps features are showing "Map configuration error" because the `GOOGLE_MAPS_API_KEY` environment variable is not set in Railway.

## Solution Steps

### 1. Obtain a Google Maps API Key

If you don't have a key yet:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Maps JavaScript API**
4. Go to **APIs & Services → Credentials**
5. Click **+ CREATE CREDENTIALS** → **API key**
6. Copy the generated API key

### 2. Secure the API Key

**IMPORTANT**: Restrict your API key immediately to prevent unauthorized use:

1. In the API key settings, under **Application restrictions**, select **HTTP referrers**
2. Add these referrers:
   - `https://mbh-production-f0d1.up.railway.app/*`
   - `https://mbh-development.up.railway.app/*`
   - `http://localhost:3000/*` (for local development)
3. Under **API restrictions**, select **Restrict key**
4. Choose only **Maps JavaScript API**
5. Click **Save**

### 3. Add to Railway Environment Variables

1. Go to your [Railway Dashboard](https://railway.app/)
2. Select your **mbh-staff-portal** project
3. Navigate to the environment (development or production)
4. Go to the **Variables** tab
5. Add the following variable:
   ```
   GOOGLE_MAPS_API_KEY=your_api_key_here
   ```
6. Railway will automatically redeploy your application

### 4. Verify the Fix

After Railway redeploys (usually within 1-2 minutes):

1. Visit `/management-dashboard.html` and check the Fleet section
2. Visit `/vessel-maintenance.html` and click "Update Location" on any vessel
3. The maps should now load properly

## Alternative: Temporary Workaround

If you need to continue using the portal without maps temporarily, the application will show clear instructions in place of the maps. All other features will continue to work normally.

## Security Considerations

### Previously Compromised Key
According to the documentation, there was a previously exposed API key (`AIzaSyBbjgKhMV5I1nwWa8pCf7m-_7G1dz8EDbw`). If this is still in use:

1. **Immediately** create a new API key
2. Delete or disable the old key in Google Cloud Console
3. Update Railway with the new key

### Best Practices
- Never commit API keys to Git
- Always use environment variables for sensitive data
- Restrict API keys to specific domains
- Monitor usage in Google Cloud Console
- Set up billing alerts to avoid unexpected charges

## Troubleshooting

### Map Still Not Loading
1. Check Railway logs for any errors
2. Verify the environment variable is set correctly
3. Ensure the API key has Maps JavaScript API enabled
4. Check domain restrictions match your Railway URL

### "RefererNotAllowedMapError"
This means your domain isn't in the allowed referrers list. Add your Railway URLs to the API key restrictions.

### Billing Issues
Google Maps provides a monthly $200 credit. For MBH usage levels, this should be more than sufficient. Monitor usage in the Google Cloud Console.

## Future Improvements

Consider implementing:
1. Server-side proxy for additional security
2. Caching of map tiles to reduce API calls
3. Fallback to OpenStreetMap if Google Maps fails

## Support

For issues with:
- **Google Maps API**: Check [Google Maps Documentation](https://developers.google.com/maps/documentation/javascript/overview)
- **Railway Deployment**: View logs in Railway dashboard
- **Application Issues**: Check `/docs/05-troubleshooting/`
