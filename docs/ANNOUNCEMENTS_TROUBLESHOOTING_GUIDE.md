# Announcements System - Setup & Troubleshooting Guide

## Quick Setup Checklist

### 1. Airtable Table Setup ✅
- [ ] Create "Announcements" table in base `applkAFOn2qxtu7tx`
- [ ] Note the table ID (should be `tblDCSmGREv0tF0Rq`)
- [ ] Add all required fields with correct types
- [ ] Verify "Priority" options are: Low, Medium, High (capitalized)

### 2. Environment Variables ✅
```bash
AIRTABLE_API_KEY=patYiJdXfvcSenMU4.xxx
AIRTABLE_BASE_ID=applkAFOn2qxtu7tx
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_FROM_NUMBER=+xxx
```

### 3. Active Roster Setup ✅
- [ ] Ensure "Employee Details" table has "Active Roster" checkbox field
- [ ] Mark appropriate employees as active roster

---

## Common Issues & Solutions

### Issue 1: "Failed to fetch announcements" Error

**Symptoms:**
- Error loading announcements on both management and staff dashboards
- 404 or 422 errors in console

**Solutions:**
1. **Verify Table ID**
   ```javascript
   // In api/announcements.js
   const ANNOUNCEMENTS_TABLE_ID = 'tblDCSmGREv0tF0Rq'; // Must match your table
   ```

2. **Check API Key**
   ```javascript
   // Ensure fallback is present for local development
   const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || 'patYiJdXfvcSenMU4.xxx';
   ```

3. **Verify Table Fields**
   Use Airtable MCP to confirm field names:
   ```
   mcp_airtable_describe_table(
     baseId: "applkAFOn2qxtu7tx",
     tableId: "tblDCSmGREv0tF0Rq"
   )
   ```

### Issue 2: "Cannot parse date value" Error (422)

**Symptoms:**
- Error when posting announcement without expiry date
- Airtable returns 422 error

**Solution:**
Only include date field if value exists:
```javascript
// In createAnnouncement function
fields: {
    'Title': title,
    'Message': message,
    'Priority': priority || 'Low',
    ...(expiryDate ? { 'Expiry Date': expiryDate } : {}), // Conditional inclusion
    'Posted By': postedBy,
    'SMS Sent': false
}
```

### Issue 3: SMS Sent to 0 Staff

**Symptoms:**
- Announcement posts successfully
- Pop-up shows "SMS sent to 0 staff"
- No SMS messages received

**Debugging Steps:**

1. **Check Console Logs**
   Look for:
   - "Fetching active roster employees..."
   - "Found X active roster employees"

2. **Verify Active Roster Field**
   ```javascript
   // Should filter by checkbox field
   filterByFormula: `{Active Roster}=1`
   ```

3. **Check Employee Table**
   - Ensure employees have "Active Roster" checked
   - Verify they have valid phone numbers in one of:
     - Mobile Number
     - Mobile  
     - Phone

4. **Verify Twilio Credentials**
   ```javascript
   if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM_NUMBER) {
       console.error('Missing Twilio credentials');
   }
   ```

### Issue 4: Priority Display Issues

**Symptoms:**
- Priority colors not showing correctly
- Priority values not matching

**Solution:**
Ensure consistent capitalization:
```javascript
// Frontend (management-dashboard.html)
<input type="radio" name="priority" value="Low" id="priorityLow">
<input type="radio" name="priority" value="Medium" id="priorityMedium">
<input type="radio" name="priority" value="High" id="priorityHigh">

// Display logic
const priorityColor = announcement.Priority === 'High' ? '#dc3545' : 
                     announcement.Priority === 'Medium' ? '#ffc107' : '#28a745';
```

---

## Testing the System

### 1. Test Without SMS First
```javascript
// Post announcement without checking "Send SMS"
// Verify it appears on:
// - Management dashboard (all announcements)
// - Staff dashboard (active only)
```

### 2. Test SMS with Console Logging
Add debug logging to `sendAnnouncementSMS`:
```javascript
console.log('Active roster query:', filterFormula);
console.log('Employee count:', employeeData.records.length);
employeeData.records.forEach(record => {
    console.log('Employee:', record.fields['Name'], 
                'Active:', record.fields['Active Roster'],
                'Phone:', record.fields['Mobile Number'] || record.fields['Mobile']);
});
```

### 3. Test Expiry Date Filtering
Create announcements with:
- No expiry date (should always show)
- Past expiry date (should not show on staff dashboard)
- Future expiry date (should show)

---

## API Response Debugging

### Enable Detailed Error Logging
```javascript
try {
    const response = await axios.get(url, config);
    return response.data;
} catch (error) {
    console.error('Airtable API Error:', {
        url: url,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
    });
    throw error;
}
```

### Common HTTP Status Codes
- **200**: Success
- **401**: Invalid API key
- **404**: Table/Record not found
- **422**: Invalid field value or type
- **429**: Rate limit exceeded
- **500**: Airtable server error

---

## Production Deployment Checklist

### Before Deployment
- [ ] Test locally with console logging
- [ ] Verify all environment variables set in Railway
- [ ] Test with at least one active roster employee
- [ ] Confirm Twilio account has credits/active

### After Deployment
- [ ] Create test announcement without SMS
- [ ] Verify it appears on dashboards
- [ ] Create announcement with SMS to limited test group
- [ ] Check Twilio logs for delivery status

### Monitoring
- Railway logs: Check for API errors
- Twilio console: Monitor SMS delivery
- Browser console: Check for client-side errors

---

## System Architecture Reference

```
┌─────────────────────┐     ┌──────────────────┐
│ Management Dashboard│────▶│ /api/announcements│
│ (Create/View/Delete)│     │    (server.js)   │
└─────────────────────┘     └────────┬─────────┘
                                     │
┌─────────────────────┐              ▼
│  Staff Dashboard    │     ┌──────────────────┐
│  (View Active Only) │────▶│ announcements.js │
└─────────────────────┘     └────────┬─────────┘
                                     │
                            ┌────────┴────────┐
                            ▼                 ▼
                    ┌──────────────┐  ┌──────────────┐
                    │   Airtable   │  │    Twilio    │
                    │ Announcements│  │   SMS API    │
                    └──────────────┘  └──────────────┘
```

---

## Quick Fixes

### Reset Everything
```javascript
// 1. Delete all test announcements in Airtable
// 2. Clear browser cache
// 3. Restart server
// 4. Try creating fresh announcement
```

### Force Refresh Dashboards
```javascript
// Add to console for testing
localStorage.clear();
location.reload();
```

### Manual SMS Test
```javascript
// Test Twilio directly in console
fetch('/api/send-test-sms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        to: '+61414960734',
        message: 'Test announcement SMS'
    })
});
```

---

*Last updated: September 9, 2025*
