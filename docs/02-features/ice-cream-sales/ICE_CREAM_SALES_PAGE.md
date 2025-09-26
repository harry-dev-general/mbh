# Ice Cream Boat Sales Page

## Overview
A dedicated page for managers to view real-time ice cream boat sales data from Square integration.

## Access
- **URL**: `/training/ice-cream-sales.html`
- **Access Level**: Managers only
- **Navigation**: Available via "Ice Cream Boat" tab in Management Dashboard

## Features

### 1. Real-Time Statistics
- **Sales Today**: Count of ice cream sales for current day
- **Revenue Today**: Total revenue from ice cream sales
- **Average Sale**: Average transaction amount
- **Active Vessels**: Number of unique vessels with sales

### 2. Sales Table
- Displays all ice cream sales from the Ice Cream Boat Sales table
- Shows: Customer, Vessel, Amount, Add-ons, Date/Time, Phone
- Sortable by date (newest first)
- Live updates every 30 seconds

### 3. Filtering Options
- **Date Range**: Today, This Week, This Month, All Time
- **Vessel**: All Vessels, Walker Courtney, Pumice Stone
- **Search**: Search by customer name, vessel, add-ons, or phone

### 4. Export Functionality
- Export sales data as CSV file
- Includes all visible fields
- Filename includes current date

## Technical Details

### Data Source
- **Airtable Base**: MBH Bookings Operation (`applkAFOn2qxtu7tx`)
- **Table**: Ice Cream Boat Sales (`tblTajm845Fiij8ud`)

### Authentication
- Uses Supabase authentication
- Checks user email against authorized managers list
- Redirects non-managers to regular dashboard

### API Endpoints
- Uses `/api/airtable/*` proxy for secure API calls
- No direct Airtable API key exposure

### Refresh Rate
- Automatic refresh every 30 seconds
- Manual refresh on filter/search changes

## Authorized Managers
```javascript
const authorizedManagers = [
    'harry@priceoffice.com.au',
    'harryjamesp45@gmail.com',
    'sarah@priceoffice.com.au',
    'brian@manlybh.com.au',
    'sarah@manlybh.com.au'
];
```

## Mobile Responsive
- Hides less critical columns on mobile
- Responsive filter controls
- Touch-friendly interface

## Future Enhancements
- [ ] Hourly sales chart
- [ ] Vessel performance comparison
- [ ] Customer repeat purchase tracking
- [ ] Integration with weather data
- [ ] Automated daily/weekly reports
