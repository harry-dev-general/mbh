# SMS Environment URL Fix

**Date**: October 10, 2025  
**Issue**: SMS links pointing to wrong environment  
**Fix**: Auto-detect Railway environment for correct URLs  

## Problem

When testing in the development environment (`https://mbh-development.up.railway.app`), SMS links were pointing to production (`https://mbh-production-f0d1.up.railway.app`). This caused "Invalid or expired link" errors because:

1. Tokens were created in development database
2. Links tried to validate in production database
3. Tokens didn't exist in production = error

## Solution Implemented

Updated the code to automatically detect the Railway environment:

```javascript
// Before - Always defaulted to production
const BASE_URL = process.env.BASE_URL || 'https://mbh-production-f0d1.up.railway.app';

// After - Auto-detects environment
const BASE_URL = process.env.BASE_URL || 
                 (process.env.RAILWAY_ENVIRONMENT === 'development' 
                   ? 'https://mbh-development.up.railway.app' 
                   : 'https://mbh-production-f0d1.up.railway.app');
```

### Files Updated

1. `/api/notifications.js` - SMS link generation
2. `/server.js` - Shift confirmation redirect

## Environment Setup

### Option 1: Use Auto-Detection (Recommended)
The code now automatically detects the Railway environment. No configuration needed.

### Option 2: Manual Override
Set the `BASE_URL` environment variable in Railway:

**Development Environment:**
```
BASE_URL=https://mbh-development.up.railway.app
```

**Production Environment:**
```
BASE_URL=https://mbh-production-f0d1.up.railway.app
```

## Testing

After deployment:

1. **In Development** (`https://mbh-development.up.railway.app`):
   - Create allocation
   - Check SMS links point to: `https://mbh-development.up.railway.app/api/shift-response?token=...`
   - Click link - should work

2. **In Production** (`https://mbh-production-f0d1.up.railway.app`):
   - SMS links should point to: `https://mbh-production-f0d1.up.railway.app/api/shift-response?token=...`

## How It Works

Railway automatically sets `RAILWAY_ENVIRONMENT` variable:
- `development` in development environment
- `production` in production environment

Our code checks this variable and uses the appropriate URL.

## Benefits

1. **No Manual Configuration**: Works automatically in both environments
2. **No More Errors**: Links always point to the correct environment
3. **Easy Testing**: Can test SMS flows in development without affecting production
4. **Override Available**: Can still set BASE_URL manually if needed

## Rollback

If issues occur, you can manually set the BASE_URL environment variable to override the auto-detection.
