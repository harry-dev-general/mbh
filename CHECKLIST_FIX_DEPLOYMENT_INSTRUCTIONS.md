# Deployment Instructions: Pre/Post-Departure Checklist Fix

## Quick Deploy Steps

### 1. Replace the Checklist Pages

```bash
# Navigate to the training directory
cd training/

# Backup the current (broken) pages
cp pre-departure-checklist.html pre-departure-checklist-broken.html
cp post-departure-checklist.html post-departure-checklist-broken.html

# Replace with fixed versions
cp pre-departure-checklist-fixed.html pre-departure-checklist.html
cp post-departure-checklist-fixed.html post-departure-checklist.html
```

### 2. Commit and Push Changes

```bash
# Go back to project root
cd ..

# Add all changes
git add .

# Commit with descriptive message
git commit -m "Fix pre/post-departure checklist loading issues

- Add server-side API endpoints for Airtable access
- Remove hardcoded API keys from client code
- Add management mode for users without employee records
- Fix CORS issues with direct Airtable calls"

# Push to trigger Railway deployment
git push origin main
```

### 3. Verify Deployment

Once Railway finishes deploying (usually 2-3 minutes):

1. **Test the Pre-Departure Checklist**:
   - Visit: https://mbh-production-f0d1.up.railway.app/training/pre-departure-checklist.html
   - Should load without getting stuck
   - If you're management, should show "Management View" badge

2. **Test the Post-Departure Checklist**:
   - Visit: https://mbh-production-f0d1.up.railway.app/training/post-departure-checklist.html
   - Should load without getting stuck
   - Location capture should still work

3. **Test Direct Booking Link**:
   - Visit: https://mbh-production-f0d1.up.railway.app/training/pre-departure-checklist.html?bookingId=rec3KoDMTOKicct1Q
   - Should auto-select the booking if you have access

## What Was Fixed

1. **Security Issue**: Removed hardcoded Airtable API key from client-side code
2. **CORS Issue**: Moved Airtable API calls to server-side
3. **Management Access**: Added support for management users without employee records
4. **Loading Issue**: Fixed the infinite loading animation

## New Features

- **Management Mode**: Users without employee records can see ALL bookings
- **Better Error Handling**: Clear messages when things go wrong
- **Secure API**: All Airtable operations now go through secure server endpoints

## Files Changed

- `api/checklist-api.js` - NEW: Server-side API endpoints
- `server.js` - UPDATED: Added checklist API routes
- `training/pre-departure-checklist.html` - REPLACED: Fixed version
- `training/post-departure-checklist.html` - REPLACED: Fixed version

## Rollback Instructions (If Needed)

If something goes wrong:

```bash
# Restore original pages
cd training/
cp pre-departure-checklist-broken.html pre-departure-checklist.html
cp post-departure-checklist-broken.html post-departure-checklist.html

# Remove new API file
rm ../api/checklist-api.js

# Revert server.js changes
git checkout HEAD -- ../server.js

# Commit and push
cd ..
git add .
git commit -m "Rollback checklist changes"
git push origin main
```

## Success Indicators

✅ Pages load without infinite spinner  
✅ Employee lookup works (or shows management mode)  
✅ Bookings are displayed  
✅ Checklists can be submitted  
✅ No console errors about CORS or API keys

## Support

If you encounter issues:
1. Check Railway logs for server errors
2. Check browser console for client errors
3. Verify environment variables are set in Railway
4. The fix has been tested locally and should work in production
