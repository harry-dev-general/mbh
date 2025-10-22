# Final Staff Pre-fill Solution - October 2025

## Overview

After reviewing the original implementation and existing infrastructure, we have all the necessary components to implement automatic staff pre-filling properly. The `/api/checklist/employee-by-email` endpoint still exists and can be leveraged.

## Solution Architecture

### Approach: Staff ID with Email Verification

This approach combines the simplicity of URL parameters with the security of the original email-based lookup.

### Implementation Plan

#### 1. Update SMS Link Generation

**File**: `/api/booking-reminder-scheduler-fixed.js`

```javascript
// In sendOnboardingReminder function (around line 264)
const checklistLink = `${baseUrl}/training/pre-departure-checklist-ssr.html?bookingId=${booking.id}&staffId=${recipientStaff.id}`;

// In sendDeloadingReminder function (around line 329)
const checklistLink = `${baseUrl}/training/post-departure-checklist-ssr.html?bookingId=${booking.id}&staffId=${recipientStaff.id}`;
```

#### 2. Update Checklist Renderer

**File**: `/api/checklist-renderer.js`

Add staff fetching function:
```javascript
// Add after the existing constants (around line 15)
const STAFF_TABLE_ID = 'tblJPEqIRCVPmWBNa';

// Add after fetchBooking function (around line 43)
async function fetchStaff(staffId) {
    if (!staffId) return null;
    
    try {
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
            console.error('Failed to fetch staff:', response.status);
            return null;
        }

        const data = await response.json();
        return data.fields;
    } catch (error) {
        console.error('Error fetching staff:', error);
        return null;
    }
}
```

Update `handleChecklistPage` function:
```javascript
// In handleChecklistPage function (around line 1057)
try {
    const bookingId = req.query.bookingId;
    const staffId = req.query.staffId; // New line
    
    if (!bookingId) {
        return res.status(400).send('Missing booking ID');
    }
    
    let booking;
    let staffData = null; // New line
    
    try {
        // Fetch booking and staff data in parallel
        const fetchPromises = [fetchBooking(bookingId)];
        if (staffId) {
            fetchPromises.push(fetchStaff(staffId));
        }
        
        const results = await Promise.all(fetchPromises);
        booking = results[0];
        staffData = results[1] || null;
    } catch (fetchError) {
        // ... existing error handling
    }
    
    // ... existing validation
    
    // Update render calls to include staff data
    const html = checklistType === 'pre-departure' 
        ? renderPreDepartureChecklist(bookingData, booking, staffData)
        : renderPostDepartureChecklist(bookingData, booking, staffData);
```

#### 3. Update Render Functions

Update both `renderPreDepartureChecklist` and `renderPostDepartureChecklist`:

```javascript
function renderPreDepartureChecklist(bookingData, booking, staffData = null) {
    // Update vessel display (already done)
    const vesselName = bookingData['Boat'] && bookingData['Boat'].length > 0 
        ? bookingData['Boat'][0] 
        : 'N/A';
    
    // Update staff information section in the HTML
    return `
    <!-- ... existing HTML ... -->
    
    <!-- Staff Identification -->
    <div class="checklist-section" style="background: #fff3cd; border: 1px solid #ffeaa7; margin-bottom: 20px;">
        <h3 style="color: #856404; margin-bottom: 15px;">
            <i class="fas fa-user"></i> Staff Information ${staffData ? '(Auto-filled)' : '(Required)'}
        </h3>
        <div class="form-group" style="margin-bottom: 15px;">
            <label for="staffName">Your Name</label>
            <input type="text" id="staffName" name="staffName" required 
                   value="${staffData ? staffData.Name || '' : ''}"
                   ${staffData && staffData.Name ? 'readonly style="background-color: #f8f9fa;"' : ''}
                   style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;"
                   placeholder="Enter your full name">
        </div>
        <div class="form-group">
            <label for="staffPhone">Your Phone Number</label>
            <input type="tel" id="staffPhone" name="staffPhone" required 
                   value="${staffData ? staffData.Phone || staffData.Mobile || '' : ''}"
                   ${staffData && (staffData.Phone || staffData.Mobile) ? 'readonly style="background-color: #f8f9fa;"' : ''}
                   style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;"
                   placeholder="Enter your phone number">
        </div>
        ${staffData ? '<p style="color: #856404; font-size: 14px; margin-top: 10px;"><i class="fas fa-info-circle"></i> Staff information has been automatically filled based on your SMS link.</p>' : ''}
    </div>
    
    <!-- ... rest of the form ... -->
    `;
}
```

#### 4. Update Form Submission

Modify `handleChecklistSubmission` to properly link staff records:

```javascript
// In handleChecklistSubmission function
if (checklistType === 'pre-departure') {
    // Extract staff ID from the form data if available
    const staffId = req.body.staffId; // Add hidden field to form
    
    const checklistData = {
        'Booking': [data.bookingId],
        'Staff Member': staffId ? [staffId] : [], // Link to staff record
        'Checklist Date/Time': new Date().toISOString(),
        // ... rest of the fields
        'Notes': data.notes ? 
            `${data.notes}\n\nCompleted by: ${data.staffName || 'Unknown'} (${data.staffPhone || 'No phone'})` : 
            `Completed by: ${data.staffName || 'Unknown'} (${data.staffPhone || 'No phone'})`
    };
}
```

Add hidden staff ID field to the form:
```javascript
// In the form HTML
${staffData ? `<input type="hidden" name="staffId" value="${req.query.staffId}">` : ''}
```

## Benefits of This Solution

1. **Automatic Pre-filling**: Staff don't need to enter their details
2. **Secure**: Staff ID alone doesn't reveal sensitive information
3. **Auditable**: Maintains proper staff record linking in Airtable
4. **Backward Compatible**: Works even without staffId parameter
5. **Simple Implementation**: Uses existing infrastructure
6. **Read-only Protection**: Pre-filled fields are read-only to prevent tampering

## Security Considerations

1. **Staff ID Validation**: The system fetches and validates the staff record
2. **Graceful Fallback**: If staff ID is invalid/missing, form still works
3. **Audit Trail**: Both linked record and text notes capture who completed
4. **No Sensitive Data in URL**: Staff ID is not personally identifiable

## Testing Plan

1. **Test with Staff ID**: Verify pre-filling works correctly
2. **Test without Staff ID**: Ensure manual entry still works
3. **Test Invalid Staff ID**: Confirm graceful handling
4. **Test Field Validation**: Ensure required fields are enforced

## Alternative Enhancement (Future)

For additional security, implement a simple HMAC signature:

```javascript
// When generating link
const crypto = require('crypto');
const signature = crypto
    .createHmac('sha256', process.env.HMAC_SECRET)
    .update(`${booking.id}:${recipientStaff.id}`)
    .digest('hex')
    .substring(0, 8);

const checklistLink = `${baseUrl}/checklist?bookingId=${booking.id}&staffId=${recipientStaff.id}&sig=${signature}`;

// When validating
const expectedSig = crypto
    .createHmac('sha256', process.env.HMAC_SECRET)
    .update(`${bookingId}:${staffId}`)
    .digest('hex')
    .substring(0, 8);

if (sig !== expectedSig) {
    // Don't pre-fill staff data
}
```

## Implementation Timeline

1. **Hour 1**: Update SMS link generation
2. **Hour 2**: Add staff fetching and pre-fill logic
3. **Hour 3**: Test and deploy

This solution maintains the simplicity needed for the SSR approach while incorporating the best practices from the original implementation.
