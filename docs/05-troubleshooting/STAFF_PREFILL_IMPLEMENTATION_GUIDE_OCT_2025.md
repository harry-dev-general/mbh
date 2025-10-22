# Staff Pre-fill Implementation Guide - October 2025

## Executive Summary

Based on the original checklist implementation, the system used **Supabase authentication** combined with **Airtable employee lookup** to automatically identify staff members. This is different from the simple URL parameter approach proposed earlier.

## Original Implementation Analysis

### How It Worked

1. **Authentication Flow**:
   ```javascript
   // User authenticated via Supabase
   const { data: { user } } = await supabase.auth.getUser();
   
   // Lookup employee by email in Airtable
   const response = await fetch(`/api/checklist/employee-by-email?email=${user.email}`);
   const employeeRecordId = data.employee.id;
   ```

2. **Data Storage**:
   ```javascript
   // Checklist submission included staff member link
   const checklistData = {
       fields: {
           "Booking": [selectedBooking.id],
           "Staff Member": employeeRecordId ? [employeeRecordId] : [],
           // ... other fields
       }
   };
   ```

3. **Benefits**:
   - Secure authentication
   - No URL manipulation possible
   - Direct employee record linking
   - Audit trail via auth logs

## Current SSR Challenge

The SSR implementation bypasses authentication to solve the SMS link loading issue. This creates a conflict:
- **Original**: Auth required → Employee lookup by email → Auto-fill
- **Current**: No auth → Direct access via SMS link → Manual entry

## Recommended Solution

### Option 1: Hybrid Approach (Best Practice)

Implement a **secure token system** that bridges authentication and SSR:

#### Implementation Steps:

1. **Create Access Token Table** in Airtable:
   ```
   Fields:
   - Token (formula: RECORD_ID())
   - Staff Member (linked record)
   - Booking (linked record)
   - Created (datetime)
   - Expires (formula: DATEADD(Created, 24, 'hours'))
   - Used (checkbox)
   ```

2. **Update SMS Link Generation**:
   ```javascript
   // In booking-reminder-scheduler-fixed.js
   async function generateAccessToken(staffId, bookingId) {
       // Create token record in Airtable
       const tokenRecord = await airtable('Access Tokens').create({
           'Staff Member': [staffId],
           'Booking': [bookingId],
           'Created': new Date().toISOString()
       });
       return tokenRecord.id;
   }
   
   // Generate secure link
   const token = await generateAccessToken(recipientStaff.id, booking.id);
   const checklistLink = `${baseUrl}/training/pre-departure-checklist-ssr.html?token=${token}`;
   ```

3. **Update Checklist Renderer**:
   ```javascript
   // In api/checklist-renderer.js
   async function validateToken(token) {
       // Fetch token record
       const tokenRecord = await airtable('Access Tokens')
           .select({
               filterByFormula: `AND({Token} = '${token}', NOT({Used}), {Expires} > NOW())`
           })
           .firstPage();
       
       if (tokenRecord.length === 0) {
           throw new Error('Invalid or expired token');
       }
       
       // Mark token as used
       await airtable('Access Tokens').update(tokenRecord[0].id, { 'Used': true });
       
       // Return linked staff and booking data
       return {
           staffId: tokenRecord[0].fields['Staff Member'][0],
           bookingId: tokenRecord[0].fields['Booking'][0]
       };
   }
   
   // In handleChecklistPage
   const token = req.query.token;
   const { staffId, bookingId } = await validateToken(token);
   
   // Fetch staff and booking data
   const [staff, booking] = await Promise.all([
       fetchStaff(staffId),
       fetchBooking(bookingId)
   ]);
   ```

### Option 2: Phone Number Verification (Alternative)

If tokens are too complex, implement phone verification:

1. **Add Phone Hash to URL**:
   ```javascript
   const phoneHash = crypto.createHash('sha256')
       .update(recipientStaff.fields['Phone'])
       .digest('hex')
       .substring(0, 8);
   
   const checklistLink = `${baseUrl}/checklist?bookingId=${booking.id}&ph=${phoneHash}`;
   ```

2. **Verify on Server**:
   ```javascript
   // Find staff by matching phone hash
   const staff = await findStaffByPhoneHash(phoneHash);
   ```

### Option 3: Session-Based (Most Secure)

Create a lightweight session system:

1. **Generate Session**:
   ```javascript
   // Create session in Redis/memory
   const sessionId = uuid.v4();
   sessions[sessionId] = {
       staffId: recipientStaff.id,
       bookingId: booking.id,
       expires: Date.now() + (24 * 60 * 60 * 1000)
   };
   ```

2. **Use Session in URL**:
   ```javascript
   const checklistLink = `${baseUrl}/checklist?session=${sessionId}`;
   ```

## Implementation Comparison

| Approach | Security | Complexity | User Experience | Alignment with Original |
|----------|----------|------------|-----------------|------------------------|
| Token Table | High | Medium | Seamless | High |
| Phone Hash | Medium | Low | Seamless | Medium |
| Session | High | High | Seamless | High |
| Staff ID in URL | Low | Very Low | Seamless | Low |

## Recommended Implementation Plan

### Phase 1: Immediate (Token Table Approach)

1. **Create Access Tokens Table** in Airtable:
   - Provides audit trail
   - Prevents replay attacks
   - Links staff to specific bookings

2. **Update SMS Generation**:
   - Generate unique tokens per SMS
   - Include expiration logic

3. **Update Checklist Renderer**:
   - Validate tokens
   - Pre-fill staff data from token lookup

### Phase 2: Enhancement

1. **Add Rate Limiting**: Prevent token guessing
2. **Add IP Logging**: Track access patterns
3. **Add Notification**: Alert when checklist completed

## Security Considerations

1. **Token Security**:
   - One-time use only
   - 24-hour expiration
   - Linked to specific staff/booking

2. **Data Integrity**:
   - Staff cannot change their identity
   - Booking association is fixed
   - Audit trail maintained

3. **Access Control**:
   - Only valid tokens allow access
   - Expired tokens rejected
   - Used tokens cannot be reused

## Database Schema

### Access Tokens Table (Airtable)
```
Fields:
- Token (Formula: RECORD_ID())
- Staff Member (Link to Staff)
- Booking (Link to Bookings)
- Created (Date/Time)
- Expires (Formula: DATEADD(Created, 24, 'hours'))
- Used (Checkbox)
- IP Address (Text - populated on use)
- User Agent (Text - populated on use)
```

## Code Examples

### Token Generation
```javascript
async function createAccessToken(staffId, bookingId) {
    const tokenData = {
        'Staff Member': [staffId],
        'Booking': [bookingId],
        'Created': new Date().toISOString()
    };
    
    const response = await axios.post(
        `https://api.airtable.com/v0/${BASE_ID}/Access%20Tokens`,
        { fields: tokenData },
        { headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` } }
    );
    
    return response.data.id;
}
```

### Token Validation
```javascript
async function validateAndUseToken(token) {
    // Find valid token
    const response = await axios.get(
        `https://api.airtable.com/v0/${BASE_ID}/Access%20Tokens`,
        {
            params: {
                filterByFormula: `AND(RECORD_ID() = '${token}', NOT({Used}), {Expires} > NOW())`
            },
            headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }
        }
    );
    
    if (response.data.records.length === 0) {
        throw new Error('Invalid or expired token');
    }
    
    const tokenRecord = response.data.records[0];
    
    // Mark as used
    await axios.patch(
        `https://api.airtable.com/v0/${BASE_ID}/Access%20Tokens/${tokenRecord.id}`,
        {
            fields: {
                'Used': true,
                'IP Address': req.ip,
                'User Agent': req.headers['user-agent']
            }
        },
        { headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` } }
    );
    
    return {
        staffId: tokenRecord.fields['Staff Member'][0],
        bookingId: tokenRecord.fields['Booking'][0]
    };
}
```

## Migration Path

1. **Week 1**: Implement token table and generation
2. **Week 2**: Update SMS links to use tokens
3. **Week 3**: Monitor and refine
4. **Week 4**: Remove manual staff fields

## Conclusion

The original implementation used authentication-based employee lookup for good reasons:
- Security
- Data integrity
- Audit trail
- Automatic staff identification

The recommended token-based approach maintains these benefits while working within the SSR framework. This aligns with the original best practices while solving the current technical constraints.
