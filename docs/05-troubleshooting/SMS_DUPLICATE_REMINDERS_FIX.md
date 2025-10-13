# SMS Duplicate Reminders Fix

**Date**: October 14, 2025  
**Issue**: Multiple SMS reminders sent for the same allocation  
**Root Cause**: Multiple app instances with in-memory tracking  
**Solution**: Persistent reminder tracking using Airtable  

## The Problem

When Railway runs multiple instances of the app (during deployments, scaling, or updates), each instance maintains its own in-memory tracker of sent reminders. This causes:

1. **Duplicate SMS**: Each instance sends its own reminder
2. **Irregular Timing**: Different instances start at different times
3. **Resource Waste**: Unnecessary SMS costs and poor user experience

### Evidence from Logs

```
22:27:19 - Instance A sends reminder to Test Staff
22:35:37 - Instance B sends reminder to Test Staff (8 min later)
22:35:52 - Instance C sends reminder to Test Staff (15 sec later!)
```

## The Solution

### 1. Create Airtable Table for Reminder Tracking

Create a new table in your MBH base with these fields:

| Field Name | Field Type | Description |
|------------|------------|-------------|
| Key | Single Line Text | Unique identifier (e.g., "allocation-recXXX") |
| Last Sent | Date & Time | When the reminder was last sent |
| Created At | Date & Time | When this tracking record was created |
| Updated At | Date & Time | When this record was last updated |

### 2. Set Environment Variable

Add to your Railway environment:

```bash
REMINDER_TRACKER_TABLE_ID=tblYourTableId
```

Replace `tblYourTableId` with your actual table ID from Airtable.

### 3. How It Works

The updated system:

1. **Before sending a reminder**: Checks Airtable to see if any instance has sent one recently
2. **After sending**: Records the timestamp in Airtable
3. **All instances share**: The same tracking data, preventing duplicates
4. **Automatic cleanup**: Old tracking records are removed after 72 hours

### 4. Fallback Behavior

- **Production with table ID**: Uses persistent Airtable storage
- **Production without table ID**: Falls back to in-memory (with warning)
- **Local development**: Uses in-memory tracking by default

## Implementation Details

### Files Modified

1. **`/api/reminder-tracker-persistent.js`** (New)
   - Handles all Airtable operations for tracking
   - Includes 5-minute cache for performance
   - Automatic retry and error handling

2. **`/api/reminder-scheduler.js`** (Updated)
   - Now uses persistent tracker when available
   - Backwards compatible with in-memory tracking
   - Async operations for Airtable queries

### Performance Considerations

- **5-minute cache**: Reduces Airtable API calls
- **Batch operations**: Cleanup deletes records in batches
- **Graceful degradation**: Falls back to cache if Airtable is unavailable

## Testing the Fix

### 1. Verify No Duplicates

```bash
# Check reminder status
GET /api/admin/reminder-status?adminKey=your-admin-key
```

### 2. Monitor Airtable Table

Watch the reminder tracking table to see entries being created and updated.

### 3. Force Multiple Instances

```bash
# Deploy without stopping the old instance
railway up --detach

# Both instances should coordinate through Airtable
```

## Monitoring

### Check for Issues

1. **Airtable Rate Limits**: Monitor API usage
2. **Table Growth**: Ensure cleanup is working
3. **SMS Logs**: Verify no duplicates being sent

### Admin Endpoints

```bash
# View all tracked reminders
GET /api/admin/reminder-tracking?adminKey=your-admin-key

# Clear old tracking records manually
POST /api/admin/cleanup-reminders?adminKey=your-admin-key
```

## Rollback Plan

If issues occur:

1. Remove `REMINDER_TRACKER_TABLE_ID` environment variable
2. System automatically falls back to in-memory tracking
3. Fix issues and re-enable when ready

## Future Improvements

1. **Redis/Database**: For higher performance at scale
2. **Distributed Locking**: Ensure exactly-once delivery
3. **SMS Provider Deduplication**: Additional safety at provider level
