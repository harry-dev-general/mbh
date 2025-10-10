# Create Magic Link Tokens Table in Airtable

**Date**: October 10, 2025  
**Purpose**: Fix the shift response token persistence issue

## Problem

The SMS accept/decline links are failing with "Invalid or expired link" error because tokens are stored in memory and lost when the server restarts or redeploys.

## Solution

Store tokens persistently in Airtable instead of in-memory storage.

## Manual Table Creation Steps

1. **Log into Airtable**
   - Go to the MBH base: `applkAFOn2qxtu7tx`

2. **Create New Table**
   - Name: `Magic Link Tokens`
   - Description: `Stores temporary tokens for shift response magic links`

3. **Add Fields** (in this exact order):

   | Field Name | Field Type | Options/Settings |
   |------------|------------|------------------|
   | Token | Single line text | Primary field |
   | Allocation ID | Single line text | - |
   | Employee ID | Single line text | - |
   | Action | Single select | Options: `accept`, `deny` |
   | Expires At | Date & time | Format: ISO, 24-hour, Australia/Sydney |
   | Is Booking Allocation | Checkbox | - |
   | Role | Single line text | - |
   | Used | Checkbox | - |
   | Created At | Date & time | Format: ISO, 24-hour, Australia/Sydney |

4. **Get the Table ID**
   - After creating the table, click on the table name
   - Look at the URL: `airtable.com/applkAFOn2qxtu7tx/tblXXXXXXXXXXXX/...`
   - Copy the table ID (starts with `tbl`)

5. **Update the Code**
   - Edit `/api/token-storage.js`
   - Replace `const TOKENS_TABLE_ID = 'tblTokens';` with the actual table ID
   - Example: `const TOKENS_TABLE_ID = 'tbl1234567890ABC';`

## Airtable Script Alternative

If you have scripting block access, you can use this script to create the table:

```javascript
// Run this in Airtable Scripting Block

const base = base;

// Create the table
const table = await base.createTable('Magic Link Tokens', [
    {
        name: 'Token',
        type: 'singleLineText'
    },
    {
        name: 'Allocation ID',
        type: 'singleLineText'
    },
    {
        name: 'Employee ID',
        type: 'singleLineText'
    },
    {
        name: 'Action',
        type: 'singleSelect',
        options: {
            choices: [
                { name: 'accept' },
                { name: 'deny' }
            ]
        }
    },
    {
        name: 'Expires At',
        type: 'dateTime',
        options: {
            dateFormat: { name: 'iso' },
            timeFormat: { name: '24hour' },
            timeZone: 'Australia/Sydney'
        }
    },
    {
        name: 'Is Booking Allocation',
        type: 'checkbox'
    },
    {
        name: 'Role',
        type: 'singleLineText'
    },
    {
        name: 'Used',
        type: 'checkbox'
    },
    {
        name: 'Created At',
        type: 'dateTime',
        options: {
            dateFormat: { name: 'iso' },
            timeFormat: { name: '24hour' },
            timeZone: 'Australia/Sydney'
        }
    }
]);

console.log('Table created! Table ID:', table.id);
```

## Deployment Steps

1. **Create the Airtable table** (using steps above)
2. **Update token-storage.js** with the correct table ID
3. **Test locally** if possible
4. **Deploy to production**:
   ```bash
   git add api/token-storage.js api/notifications.js api/shift-response-handler.js
   git commit -m "fix: Implement persistent token storage for shift response links"
   git push origin development
   ```
5. **Merge to production** when ready

## Testing

After deployment:
1. Create a new shift allocation
2. Check that SMS is sent
3. Click the accept/decline link
4. Verify it works without "Invalid or expired link" error
5. Check the Airtable table to see the token was marked as used

## Maintenance

The token storage includes a cleanup function that can be called periodically to remove expired tokens:

```javascript
// Can be called from a scheduled job
const tokenStorage = require('./api/token-storage');
await tokenStorage.cleanupExpiredTokens();
```

## Benefits

1. **Persistence**: Tokens survive server restarts
2. **Scalability**: Works across multiple server instances
3. **Auditability**: Can see token usage in Airtable
4. **Debugging**: Easy to inspect token status
5. **Security**: Tokens expire and are marked as used

## Rollback Plan

If issues occur:
1. The old in-memory system is commented out but not deleted
2. Can temporarily revert the changes in notifications.js
3. But note that the in-memory system will continue to have the same issues
