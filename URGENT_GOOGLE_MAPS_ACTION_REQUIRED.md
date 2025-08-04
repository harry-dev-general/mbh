# 🚨 URGENT: Google Maps API Security Action Required

## What Happened
Your Google Maps API key is publicly exposed at:
https://mbh-production-f0d1.up.railway.app/vessel-locations-map.html

**Exposed API Key:** `AIzaSyBbjgKhMV5I1nwWa8pCf7m-_7G1dz8EDbw`

## Immediate Actions Required

### Step 1: Restrict the Current API Key (Do This NOW!)
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

### Step 2: Monitor Usage
1. Go to **APIs & Services → Dashboard**
2. Check for any unusual usage spikes
3. Review billing to ensure no unexpected charges

### Step 3: Consider Creating a New Key
If you see suspicious activity:
1. Create a new API key with restrictions already in place
2. Update the code with the new key
3. Delete the old exposed key

## What We Fixed
✅ Updated Content Security Policy to allow Google Maps scripts
✅ Added error handling for failed map loads
✅ Created documentation for proper API key management

## The Map Should Work Now
Railway will automatically redeploy with the CSP fix. The map should start working within a few minutes.

## Long-term Recommendations
1. Never commit API keys to public repositories
2. Use environment variables for sensitive keys
3. Always restrict API keys to specific domains
4. Set up billing alerts in Google Cloud Console

## Need Help?
If the map still doesn't work after restricting the API key, check:
- Google Cloud Console for any error messages
- Browser console for specific errors
- Railway logs for deployment status

---
**Remember:** An unrestricted Google Maps API key can be used by anyone, potentially resulting in significant charges to your Google Cloud account!