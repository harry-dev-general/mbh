# September 2025 Feature Implementations - MBH Staff Portal

## Overview
This document details all feature implementations, fixes, and integrations completed in September 2025 for the Manly Boat Hire (MBH) Staff Portal.

## 1. Google Maps API Key Security Fix

### Issue
Google Maps API key was hardcoded in multiple HTML files, exposing it to potential abuse.

### Solution
- Created `/api/config` endpoint in `server.js` to serve API keys securely
- Updated all HTML files to fetch the key from the backend
- Added `GOOGLE_MAPS_API_KEY` to environment variables

### Files Modified
- `server.js` - Added config endpoint
- `training/vessel-locations-map.html`
- `training/management-dashboard.html`
- `training/post-departure-checklist.html`
- `training/vessel-maintenance.html`
- `training/my-schedule.html`

### Implementation Pattern
```javascript
// Frontend
const configResponse = await fetch('/api/config');
const config = await configResponse.json();
const script = document.createElement('script');
script.src = `https://maps.googleapis.com/maps/api/js?key=${config.googleMapsApiKey}&callback=initMap`;
```

## 2. Checkfront Webhook Phone Number Capture

### Feature
Capture customer phone numbers from Checkfront booking webhooks and store in Airtable.

### Implementation
- Added "Phone Number" field extraction in `api/checkfront-webhook.js`
- Phone number stored in new single-line text field in "Bookings Dashboard" table
- Handles cases where phone number may not be provided

### Webhook Payload Path
```javascript
const customerPhone = customer.phone || null; // Path: booking.customer.phone
```

## 3. Add-on Indicator for Bookings

### Feature
Visual indicator (orange "+" badge) on booking blocks when customers have add-ons.

### Implementation
- Added CSS class `.addon-indicator` across calendar components
- Badge positioned absolutely in top-right corner of booking blocks
- Tooltip shows "This booking includes add-ons" on hover

### Files Modified
- `training/management-dashboard.html` - Weekly Schedule
- `training/daily-run-sheet.html` - Daily calendar
- `training/management-allocations.html` - Allocation blocks

### CSS Pattern
```css
.addon-indicator {
    position: absolute;
    top: -4px;
    right: -4px;
    background: #ff9800;
    color: white;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: bold;
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    z-index: 15;
}
```

## 4. Square Integration for Ice Cream Sales

### Overview
Integration with Square payment system to automatically sync ice cream boat sales to Airtable.

### Components

#### 4.1 Webhook Handler (`api/square-webhook.js`)
- HMAC-SHA256 signature verification for security
- Filters payments by "Ice-Cream-Boat-Sales" category
- Maps Square payment data to Airtable fields
- Creates records in "Ice Cream Boat Sales" table

#### 4.2 Airtable Table Structure
**Table**: Ice Cream Boat Sales (`tblTajm845Fiij8ud`)
**Fields**:
- Sale Code (single line text) - Receipt number
- Customer Name (single line text)
- Customer Email (email)
- Phone Number (single line text)
- Sale Amount (currency)
- Vessel/Operation (single line text)
- Add-ons (long text)
- Sale Date (date)
- Sale Time (single line text)
- Square Payment ID (single line text)
- Square Order ID (single line text)
- Notes (long text)

#### 4.3 Environment Variables
```bash
SQUARE_ACCESS_TOKEN=<token>
SQUARE_APPLICATION_ID=<app-id>
SQUARE_ENVIRONMENT=sandbox|production
SQUARE_WEBHOOK_SIGNATURE_KEY=<signature-key>
```

### Security Features
- Webhook signature verification
- Category-based filtering (only Ice-Cream-Boat-Sales)
- Secure environment variable storage

## 5. Ice Cream Sales Dashboard Page

### Feature
Dedicated page for viewing live ice cream sales with statistics and filtering.

### Location
`training/ice-cream-sales.html`

### Features
- **Live Statistics**: Sales count and revenue for today
- **Date Filters**: Today, This Week, This Month, All Time
- **Vessel Filter**: Filter by specific ice cream boat
- **Search**: Search by customer name
- **Export**: CSV export functionality
- **Auto-refresh**: Updates every 60 seconds
- **Manual refresh**: Button for immediate updates

### Access Control
- Manager-only access (same as management dashboard)
- Navigation via "Ice Cream Boat" tab in management dashboard

## 6. Performance Optimizations

### Issues Addressed
1. Slow Airtable API responses (minutes to load)
2. Browser tab showing continuous loading animation
3. Memory leaks from uncleaned intervals

### Solutions Implemented

#### 6.1 Request Timeouts
- 30-second timeout for sales data
- 15-second timeout for statistics
- AbortController for clean cancellation

#### 6.2 Reduced Payload Size
- Max records reduced from 100 to 50 for sales
- Stats limited to 20 records
- Smaller responses = faster loading

#### 6.3 Sequential Loading
- Changed from parallel to sequential API calls
- 500ms delay between requests
- Respects Airtable's 5 requests/second limit

#### 6.4 Smart Refresh Strategy
- Auto-refresh interval increased from 30s to 60s
- Pause refresh when tab is hidden
- Resume when tab becomes visible
- Cleanup on page unload

#### 6.5 Date Filter Fix
- Changed from `{Sale Date} = '2025-09-26'` 
- To `IS_SAME({Sale Date}, '2025-09-26', 'day')`
- Properly handles Airtable date field comparisons

### Performance Pattern
```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);

try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
} catch (error) {
    if (error.name === 'AbortError') {
        // Handle timeout
    }
}
```

## 7. Technical Patterns and Best Practices

### 7.1 Date Handling
- Always use Australia/Sydney timezone
- Format dates as YYYY-MM-DD for Airtable
- Use `IS_SAME()` for date field comparisons

### 7.2 API Proxy Pattern
All Airtable calls go through backend proxy:
```javascript
/api/airtable/{baseId}/{tableId}
```

### 7.3 Error Handling
- Graceful timeouts with user-friendly messages
- Continue with partial data when possible
- Console logging for debugging

### 7.4 Memory Management
- Cleanup intervals on page unload
- Prevent duplicate API requests
- Single initialization guards

## 8. Testing Scripts Created

### Local Testing Pattern
```javascript
// Direct Airtable test bypassing Square API
const testData = {
    records: [{
        fields: {
            'Sale Code': `TEST-${Date.now()}`,
            'Customer Name': 'Test Customer',
            'Sale Amount': 25.00,
            // ... other fields
        }
    }]
};

await axios.post(
    'http://localhost:8080/api/airtable/baseId/tableId',
    testData
);
```

## 9. Railway Deployment Notes

### Environment Variables Required
```bash
# Airtable
AIRTABLE_API_KEY=

# Google Maps
GOOGLE_MAPS_API_KEY=

# Square Integration
SQUARE_ACCESS_TOKEN=
SQUARE_APPLICATION_ID=
SQUARE_ENVIRONMENT=
SQUARE_WEBHOOK_SIGNATURE_KEY=

# Base URL
BASE_URL=https://mbh-production-f0d1.up.railway.app
```

### Deployment Commands
```bash
railway variables set KEY=value
git push origin main
railway logs -f
```

## 10. Known Issues and Limitations

### Airtable API Performance
- Rate limit: 5 requests/second per base
- Shared across all integrations
- Can cause slow loading during peak times

### Solutions
- Request timeouts prevent infinite loading
- Manual refresh button for user control
- Consider server-side caching in future

## Summary

This implementation phase added significant new features to the MBH Staff Portal:
1. Secured API keys
2. Enhanced booking data capture
3. Visual indicators for add-ons
4. Complete Square payment integration
5. Dedicated ice cream sales tracking
6. Performance optimizations for better UX

All features are production-ready and deployed, with comprehensive error handling and user-friendly interfaces.
