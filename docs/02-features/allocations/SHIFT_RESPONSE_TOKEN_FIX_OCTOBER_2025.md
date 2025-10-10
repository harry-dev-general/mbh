# Shift Response Token Persistence Fix

**Date**: October 10, 2025  
**Issue**: SMS accept/decline links failing with "Invalid or expired link" error  
**Root Cause**: Tokens stored in memory are lost on server restart/redeploy  

## Problem Details

When staff members receive SMS notifications for shift allocations, they get accept/decline links. However, clicking these links results in a 400 error: "Invalid or expired link. Please contact management."

The root cause is that tokens are stored in a JavaScript Map in memory (`const magicTokens = new Map()`), which is lost when:
- The server restarts
- New code is deployed
- Multiple server instances are running
- Railway cycles the container

## Solution Implemented

### 1. Persistent Token Storage

Created a dual-layer token storage system:

1. **Primary**: Airtable-based storage (`token-storage.js`)
   - Stores tokens in Airtable for true persistence
   - Survives server restarts and works across instances
   - Provides audit trail and debugging capability

2. **Fallback**: File-based storage (`token-storage-file.js`)
   - Uses a JSON file to persist tokens
   - Automatic fallback if Airtable table doesn't exist
   - Immediate fix while Airtable table is being created

### 2. Automatic Fallback Logic

The system automatically falls back to file storage if:
- Airtable API key is not configured
- Tokens table ID is not set (still default 'tblTokens')
- Airtable table doesn't exist (404 error)
- Any Airtable operation fails

### 3. Updated Files

- `/api/token-storage.js` - New Airtable-based token storage
- `/api/token-storage-file.js` - File-based fallback storage
- `/api/notifications.js` - Updated to use persistent storage
- `/api/shift-response-handler.js` - Updated for async token operations

## Immediate Deployment Instructions

### Option 1: Deploy with File Storage (Immediate Fix)

1. **Deploy the code as-is**:
   ```bash
   cd /Users/harryprice/kursol-projects/mbh-staff-portal
   git add api/token-storage.js api/token-storage-file.js api/notifications.js api/shift-response-handler.js
   git add docs/02-features/allocations/CREATE_TOKENS_TABLE.md
   git add docs/02-features/allocations/SHIFT_RESPONSE_TOKEN_FIX_OCTOBER_2025.md
   git commit -m "fix: Implement persistent token storage for shift response links

   - Replace in-memory Map with persistent storage
   - Add file-based storage as immediate solution
   - Prepare for Airtable-based storage
   - Fixes 'Invalid or expired link' errors"
   
   git push origin development
   ```

2. **The system will automatically use file storage** until the Airtable table is created

3. **Tokens will be stored in** `/data/magic-tokens.json`

### Option 2: Create Airtable Table First (Recommended)

1. **Create the Airtable table** following instructions in `/docs/02-features/allocations/CREATE_TOKENS_TABLE.md`

2. **Update the table ID**:
   - Get the table ID from Airtable (starts with `tbl`)
   - Set environment variable: `TOKENS_TABLE_ID=tblYourActualID`
   - Or update in `token-storage.js` line 31

3. **Deploy the code** (same as Option 1)

## Testing

After deployment:

1. **Create a test allocation**:
   - Assign Test Staff to a shift
   - Verify SMS is sent

2. **Test the accept link**:
   - Click the accept link from SMS
   - Should see success page (not error)
   - Check calendar shows accepted status

3. **Verify persistence**:
   - If using file storage: Check `/data/magic-tokens.json` exists
   - If using Airtable: Check tokens appear in the table

## Monitoring

Watch the logs for these messages:

- `⚠️ Airtable token storage not configured, using file storage` - Using file fallback
- `✅ Token stored in file: abc12345...` - File storage working
- `✅ Token stored in Airtable: abc12345...` - Airtable storage working
- `⚠️ Airtable table not found, falling back to file storage` - Automatic fallback

## Long-term Migration

Once the Airtable table is created:

1. Set the `TOKENS_TABLE_ID` environment variable
2. The system will automatically switch to Airtable storage
3. Old file-based tokens will continue to work until they expire
4. New tokens will be created in Airtable

## Benefits

1. **Immediate Fix**: File storage works instantly without setup
2. **No Data Loss**: Tokens persist across restarts
3. **Scalable**: Airtable storage works across multiple instances
4. **Debuggable**: Can inspect tokens in file or Airtable
5. **Automatic Cleanup**: Expired tokens are cleaned up hourly

## Rollback

If issues occur:

1. The original in-memory code is preserved but unused
2. Can temporarily disable by removing the require for token-storage
3. But note that will bring back the original problem

## Success Metrics

- No more "Invalid or expired link" errors
- Staff can accept/decline shifts via SMS
- Tokens survive server restarts
- System continues to work during deployments
