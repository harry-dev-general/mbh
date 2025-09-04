# Checklist Event Error Fix

## Issue
When navigating to checklist pages via URL parameter (from My Schedule), the page failed with:
```
TypeError: Cannot read properties of undefined (reading 'currentTarget')
at selectBooking (pre-departure-checklist.html?bookingId=recbPIh3iNDAE0yCW:768:19)
```

## Root Cause
The `selectBooking` function was designed to be called from click events and expected `event.currentTarget` to update the UI. When called programmatically (from URL parameter handling), there was no event object.

## Solution
Modified `selectBooking` function to handle both scenarios:

```javascript
// Before:
function selectBooking(booking, boatName) {
    // ...
    event.currentTarget.classList.add('selected');  // ERROR when no event!
}

// After:
function selectBooking(booking, boatName, element = null) {
    // ...
    // Update UI - only update cards if called from a click event
    if (element || (typeof event !== 'undefined' && event.currentTarget)) {
        document.querySelectorAll('.booking-card').forEach(card => {
            card.classList.remove('selected');
        });
        const targetElement = element || event.currentTarget;
        if (targetElement) {
            targetElement.classList.add('selected');
        }
    }
}
```

## Changes Applied
- Modified `selectBooking` in `pre-departure-checklist.html`
- Modified `selectBooking` in `post-departure-checklist.html`
- Added optional `element` parameter for programmatic calls
- Added check for event existence before accessing `currentTarget`

## Git Details
- **Commit**: daf7294
- **Message**: "Fix selectBooking function to handle programmatic calls"

## Result
The checklist pages now properly load when accessed via:
1. Direct navigation (clicking booking cards) - UI updates normally
2. URL parameters (from My Schedule) - Form loads without UI errors
