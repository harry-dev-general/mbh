# Announcements System Implementation Guide

## Overview
This guide documents the implementation of the announcements system that allows management to post announcements that appear on staff dashboards and can be sent as SMS to all active roster staff.

## Airtable Table Setup

### Create "Announcements" Table
1. In Airtable base (applkAFOn2qxtu7tx), create a new table called "Announcements"
2. Table ID will be: `tblAnnouncements` (update in code if different)

### Table Fields:
1. **Title** (Single line text)
   - The announcement title
   - Required field

2. **Message** (Long text)
   - The full announcement message
   - Required field

3. **Priority** (Single select)
   - Options: low (green), medium (yellow), high (red)
   - Default: low

4. **Posted By** (Single line text)
   - Email of the manager who posted
   - Automatically filled from current user

5. **Expiry Date** (Date)
   - Optional field
   - When set, announcement won't show after this date

6. **SMS Sent** (Checkbox)
   - Tracks if SMS was sent to staff
   - Set automatically by system

7. **Created Time** (Created time)
   - Auto-generated field
   - Used for sorting and display

## Features Implemented

### Management Dashboard (/management-dashboard.html)
- **Post Announcements**: Form with title, message, priority, and optional expiry date
- **SMS Option**: Confirmation dialog to send SMS to all active roster staff
- **View All**: Shows all announcements including expired ones
- **Delete**: Remove announcements with confirmation
- **Edit**: Placeholder for future implementation

### Staff Dashboard (/dashboard.html)  
- **View Active**: Shows only non-expired announcements
- **Priority Display**: Visual indicators (🚨 High, ⚠️ Medium, ℹ️ Low)
- **Auto-refresh**: Loads on page load

### SMS Notifications
- Sends to all staff on current week's roster
- Message format includes priority emoji, title, and full message
- Only sends to staff with valid phone numbers
- Tracks success/failure counts

## API Endpoints

### GET /api/announcements
- Query params: `includeExpired=true` (optional)
- Returns all active announcements

### POST /api/announcements
- Body: `{ title, message, priority, expiryDate, sendSMS, postedBy }`
- Creates announcement and optionally sends SMS

### PATCH /api/announcements/:id
- Body: Fields to update
- Updates existing announcement

### DELETE /api/announcements/:id
- Deletes announcement

## SMS Logic
1. Queries current week's roster for active staff
2. Gets phone numbers from employee records
3. Sends SMS via Twilio to each staff member
4. Updates announcement record to mark SMS as sent

## Environment Variables Required
```
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token  
TWILIO_FROM_NUMBER=+your_twilio_phone_number
```

## Usage Instructions

### For Management:
1. Navigate to Management Dashboard → Announcements tab
2. Fill in announcement details
3. Choose priority level
4. Optionally set expiry date
5. Click "Post Announcement"
6. Choose whether to send SMS notification
7. View confirmation of posting and SMS status

### For Staff:
1. Announcements appear automatically on dashboard
2. High priority shown with red indicator
3. Expired announcements are hidden

## Testing
1. Create test announcement without SMS first
2. Verify it appears on staff dashboard
3. Test with SMS to limited staff (use Test Staff account)
4. Check SMS delivery logs in Twilio console

## Future Enhancements
- Edit existing announcements
- Schedule announcements for future posting
- Target specific staff groups
- Read receipts for important announcements
- Push notifications via app
