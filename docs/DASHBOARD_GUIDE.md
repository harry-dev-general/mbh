# Dashboard Homepage Guide

## Overview
The dashboard (`dashboard.html`) is now the main landing page for authenticated staff members. It provides a personalized welcome and easy navigation to all portal features.

## Features

### 1. Personalized Welcome
- Displays "Welcome, [First Name]!" using the employee's name from Airtable
- Shows the logged-in user's email address
- Falls back to "Welcome, Staff Member!" if name lookup fails

### 2. Navigation Toolbar
The dashboard includes four main navigation buttons:

#### Training Resources
- **Icon**: Graduation cap
- **Links to**: `index.html` (Interactive Staff Training)
- **Purpose**: Access all training materials and emergency procedures

#### Vessel Locations
- **Icon**: Map with marker
- **Links to**: `vessel-locations-map.html`
- **Purpose**: View interactive map of boat storage locations and safe anchorages

#### Availability Form
- **Icon**: Calendar with check
- **Links to**: `availability.html`
- **Purpose**: Submit weekly availability for scheduling
- **Note**: Highlighted in orange to draw attention

#### Roster
- **Icon**: Clipboard list
- **Links to**: `roster.html`
- **Purpose**: View work assignments (currently under construction)

#### Vessel Checklists
- **Icon**: Clipboard with check
- **Links to**: `vessel-checklists.html`
- **Purpose**: Complete pre-departure and post-departure checklists
- **Note**: Essential safety checks for each booking

### 3. Quick Action Cards
The dashboard displays three information cards:

1. **Quick Actions**
   - Direct link to submit availability
   - Emergency contacts access
   - Safety procedures link

2. **Announcements**
   - Placeholder for management announcements
   - Will be updated with real announcements in future

3. **Fleet Status**
   - Shows operational status of vessels
   - Links to detailed vessel information

## Authentication Flow

### Login Redirects
All authentication now flows through the dashboard:
- `auth.html` → After successful login → `dashboard.html`
- `auth-callback.html` → After email verification → `dashboard.html`
- Availability form → After submission → `dashboard.html`

### Protected Pages
All pages now require authentication and include:
- Authentication check on page load
- Redirect to `auth.html` if not logged in
- Dashboard button for easy navigation back

## Navigation Structure
```
dashboard.html (Home)
├── index.html (Training Resources)
├── vessel-locations-map.html (Vessel Locations)
├── availability.html (Availability Form)
├── roster.html (Roster - Coming Soon)
└── vessel-checklists.html (Vessel Checklists)
```

## Technical Details

### Supabase Integration
- Uses Supabase Auth for user authentication
- Checks user session on page load
- Provides logout functionality

### Airtable Integration
- Fetches employee name from Airtable using email lookup
- Uses filterByFormula to find matching employee record
- Extracts first name from full name for personalized greeting

### Responsive Design
- Mobile-friendly layout
- Navigation buttons stack on smaller screens
- Touch-friendly button sizes

## Future Enhancements
1. Real-time announcements from Airtable
2. Fleet status integration with vessel tracking
3. Quick stats (e.g., "You have submitted availability for this week")
4. Upcoming shift reminders
5. Direct messaging or notifications 