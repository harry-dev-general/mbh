# Quick Reference: Checklist Links Implementation

## Key Changes

### 1. My Schedule Page (`training/my-schedule.html`)
Add to `showShiftDetails` function after the response buttons section:

```javascript
// Add vessel checklist link for booking allocations
if (shift.source === 'booking') {
    const checklistType = shift.role === 'Onboarding' ? 'Pre-Departure' : 'Post-Departure';
    const checklistPage = shift.role === 'Onboarding' ? 
        'pre-departure-checklist.html' : 'post-departure-checklist.html';
    
    modalHTML += `
        <div class="checklist-section" style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e0e0e0;">
            <h4 style="margin-bottom: 1rem; color: #2E86AB;">
                <i class="fas fa-clipboard-check"></i> Vessel Checklist
            </h4>
            <a href="${checklistPage}?bookingId=${shift.id}" 
               class="btn btn-primary" 
               style="width: 100%; background: #2E86AB; color: white; padding: 0.75rem; 
                      text-align: center; border-radius: 4px; text-decoration: none; display: block;">
                <i class="fas fa-clipboard-list"></i> 
                Complete ${checklistType} Checklist
            </a>
            <p style="margin-top: 0.5rem; font-size: 0.85rem; color: #666; text-align: center;">
                ${checklistType === 'Pre-Departure' ? 
                  'Complete safety checks before customer boards' : 
                  'Complete vessel checks after customer departs'}
            </p>
        </div>
    `;
}
```

### 2. Pre-Departure Checklist (`training/pre-departure-checklist.html`)
Add at the beginning of the script section:

```javascript
// Check for booking ID from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const bookingIdParam = urlParams.get('bookingId');
```

Modify the `loadBookings` function:

```javascript
async function loadBookings() {
    // ... existing code to fetch bookings ...
    
    if (data.records) {
        // Auto-select booking if ID provided in URL
        if (bookingIdParam) {
            const targetBooking = data.records.find(record => record.id === bookingIdParam);
            if (targetBooking) {
                const boatName = targetBooking.fields['Boat'] && targetBooking.fields['Boat'][0] ? 
                               await getBoatName(targetBooking.fields['Boat'][0]) : 'Unknown Vessel';
                
                // Hide booking selection, show checklist form
                document.getElementById('bookingsSection').style.display = 'none';
                selectBooking(targetBooking, boatName);
                return;
            }
        }
        
        // ... existing code to render booking cards ...
    }
}
```

### 3. Post-Departure Checklist (`training/post-departure-checklist.html`)
Apply the same changes as Pre-Departure Checklist.

## Navigation Flow

```
My Schedule → Click Booking → Modal Opens → Click "Complete Checklist" 
→ Checklist Page (with auto-selected booking) → Fill & Submit
```

## Testing Checklist

- [ ] Onboarding allocation shows Pre-Departure link
- [ ] Deloading allocation shows Post-Departure link
- [ ] Links pass correct bookingId parameter
- [ ] Checklist pages auto-select booking when parameter present
- [ ] Normal checklist flow still works without parameter
- [ ] Invalid bookingId handled gracefully
