# Checklist Links Fix - Summary

## Issue Fixed
The booking ID in the checklist URL was including the role suffix (e.g., `recxIc1ZAAH3nqo07-onboarding`) instead of just the booking record ID.

## Solution Applied
Changed the checklist link from using `shift.id` to `shift.booking`:

```javascript
// Before:
<a href="${checklistPage}?bookingId=${shift.id}">

// After: 
<a href="${checklistPage}?bookingId=${shift.booking}">
```

## Git Details
- **Commit**: 0d8d872
- **Message**: "Fix checklist link to use booking ID without role suffix"

## Production Path Note
Based on the URL you provided (`https://mbh-production-f0d1.up.railway.app/pre-departure-checklist.html`), it appears the production deployment serves files from the root directory rather than preserving the `/training/` subdirectory structure.

This is working correctly because:
- In development: Files are in `/training/` subdirectory
- In production: Files appear to be served from root
- The relative paths in the code work in both environments

## What This Means
The checklist links will now pass the correct booking ID (e.g., `recxIc1ZAAH3nqo07`) without any role suffix, allowing the checklist pages to properly auto-select the booking.

## Testing
After this fix deploys, clicking a checklist link should:
1. Navigate to the correct checklist page
2. Pass only the booking record ID (no `-onboarding` or `-deloading` suffix)
3. Auto-select the booking in the checklist form
