# Automatic Staff Allocation Proposal - October 2025

## Overview

This proposal outlines a solution for automatically populating staff information in checklists based on the phone number that receives the SMS reminder.

## Current State

1. **SMS Generation**: The `booking-reminder-scheduler-fixed.js` sends SMS reminders to specific staff members based on their allocation in Airtable
2. **Staff Information**: Each SMS recipient has their details (Name, Phone) in the Staff table
3. **Checklist URLs**: Currently only include the booking ID: `/training/pre-departure-checklist-ssr.html?bookingId=XXXXX`
4. **Manual Entry**: Staff must manually enter their name and phone number in the checklist form

## Proposed Solution

### Approach 1: Staff ID in URL (Recommended)

Add the staff record ID to the checklist URL when generating SMS reminders.

#### Implementation Steps:

1. **Update SMS Link Generation** in `booking-reminder-scheduler-fixed.js`:
   ```javascript
   // Current
   const checklistLink = `${baseUrl}/training/pre-departure-checklist-ssr.html?bookingId=${booking.id}`;
   
   // Proposed
   const checklistLink = `${baseUrl}/training/pre-departure-checklist-ssr.html?bookingId=${booking.id}&staffId=${recipientStaff.id}`;
   ```

2. **Update Checklist Renderer** in `api/checklist-renderer.js`:
   - Extract `staffId` from query parameters
   - Fetch staff record from Airtable using the Staff table ID
   - Pre-populate the staff name and phone fields in the rendered HTML

3. **Benefits**:
   - Direct link between SMS recipient and checklist completer
   - No ambiguity about which staff member completed the checklist
   - Simple to implement
   - Secure (staff ID is not sensitive information)

### Approach 2: Phone Number Hash (Alternative)

Create a hashed version of the phone number to include in the URL.

#### Implementation:
```javascript
// Generate a simple hash of the phone number
const crypto = require('crypto');
const phoneHash = crypto.createHash('sha256').update(phone).digest('hex').substring(0, 8);
const checklistLink = `${baseUrl}/training/pre-departure-checklist-ssr.html?bookingId=${booking.id}&ph=${phoneHash}`;
```

#### Challenges:
- Requires maintaining a mapping of hashes to phone numbers
- More complex to implement
- Potential for collisions (though unlikely with 8 characters)

### Approach 3: JWT Token (Most Secure)

Generate a JWT token containing staff information.

#### Implementation:
```javascript
const jwt = require('jsonwebtoken');
const staffToken = jwt.sign(
    { staffId: recipientStaff.id, name: recipientStaff.fields['Name'], phone: phone },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
);
const checklistLink = `${baseUrl}/training/pre-departure-checklist-ssr.html?bookingId=${booking.id}&token=${staffToken}`;
```

#### Benefits:
- Most secure approach
- Can include expiration
- Tamper-proof

#### Challenges:
- URLs become very long
- Requires JWT library and secret management
- More complex implementation

## Recommended Implementation Plan

### Phase 1: Immediate Implementation (Staff ID in URL)

1. **Update `booking-reminder-scheduler-fixed.js`**:
   ```javascript
   // In sendOnboardingReminder function
   const checklistLink = `${baseUrl}/training/pre-departure-checklist-ssr.html?bookingId=${booking.id}&staffId=${recipientStaff.id}`;
   
   // In sendDeloadingReminder function
   const checklistLink = `${baseUrl}/training/post-departure-checklist-ssr.html?bookingId=${booking.id}&staffId=${recipientStaff.id}`;
   ```

2. **Update `api/checklist-renderer.js`**:
   ```javascript
   // Add new function to fetch staff details
   async function fetchStaff(staffId) {
       const response = await fetch(
           `https://api.airtable.com/v0/${BOOKINGS_BASE_ID}/${STAFF_TABLE_ID}/${staffId}`,
           {
               headers: {
                   'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                   'Content-Type': 'application/json'
               }
           }
       );
       
       if (!response.ok) {
           throw new Error(`Failed to fetch staff: ${response.status}`);
       }
       
       const data = await response.json();
       return data;
   }
   
   // In handleChecklistPage function
   const bookingId = req.query.bookingId;
   const staffId = req.query.staffId;
   
   // Fetch both booking and staff data
   const [booking, staff] = await Promise.all([
       fetchBooking(bookingId),
       staffId ? fetchStaff(staffId) : Promise.resolve(null)
   ]);
   
   // Pass staff data to render functions
   const html = checklistType === 'pre-departure' 
       ? renderPreDepartureChecklist(booking.fields, booking, staff?.fields)
       : renderPostDepartureChecklist(booking.fields, booking, staff?.fields);
   ```

3. **Update Render Functions** to pre-populate staff fields:
   ```javascript
   function renderPreDepartureChecklist(bookingData, booking, staffData = null) {
       // In the staff information section
       <input type="text" id="staffName" name="staffName" required 
              value="${staffData?.Name || ''}"
              ${staffData?.Name ? 'readonly' : ''}
              placeholder="Enter your full name">
       
       <input type="tel" id="staffPhone" name="staffPhone" required 
              value="${staffData?.Phone || staffData?.Mobile || ''}"
              ${staffData?.Phone || staffData?.Mobile ? 'readonly' : ''}
              placeholder="Enter your phone number">
   ```

### Phase 2: Future Enhancement

1. **Add Staff Validation**: Ensure the staff member receiving the SMS is the one completing the checklist
2. **Create Audit Trail**: Store the staff ID directly in checklist records instead of just in notes
3. **Dashboard Integration**: Show which staff member completed each checklist in management views

## Security Considerations

1. **Staff ID Exposure**: Staff record IDs are not sensitive, but we should validate that the staff ID exists
2. **URL Tampering**: Users could modify the staffId parameter, but this would only change the pre-filled name/phone
3. **Validation**: The actual submission still records what was entered, providing an audit trail

## Database Structure

### Required Airtable Constants:
```javascript
const STAFF_TABLE_ID = 'tblJPEqIRCVPmWBNa'; // Staff table ID
```

### Staff Table Fields Used:
- `Name`: Staff member's full name
- `Phone` or `Mobile`: Primary contact number
- Record ID: Airtable's unique identifier

## Benefits of This Approach

1. **Zero Manual Entry**: Staff don't need to type their details
2. **Accurate Tracking**: Direct link between SMS recipient and checklist completer
3. **Simple Implementation**: Minimal code changes required
4. **Backward Compatible**: Works even if staffId is missing (falls back to manual entry)
5. **Audit Trail**: Can verify who received the SMS vs who completed the checklist

## Testing Plan

1. **Local Testing**: Test with sample staff IDs
2. **Production Testing**: Send test SMS to verify URL generation
3. **Edge Cases**: Test missing staffId, invalid staffId, etc.
4. **Validation**: Ensure submitted data matches pre-populated data

## Timeline

- **Phase 1**: 1-2 hours to implement and test
- **Deployment**: Immediate after testing
- **Phase 2**: Future enhancement based on usage feedback
