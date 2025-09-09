# Quick Setup: Airtable Announcements Table

## 1. Create Table
In your Airtable base (applkAFOn2qxtu7tx):
- Click "Add a table" → "Start from scratch"
- Name it: "Announcements"

## 2. Add Fields (in this order):

### Title (already exists as primary field)
- Type: Single line text
- Required

### Message
- Click "+" → Field type: "Long text"  
- Name: "Message"

### Priority
- Click "+" → Field type: "Single select"
- Name: "Priority"
- Add options:
  - low (color: green)
  - medium (color: yellow/orange)
  - high (color: red)

### Posted By
- Click "+" → Field type: "Single line text"
- Name: "Posted By"

### Expiry Date
- Click "+" → Field type: "Date"
- Name: "Expiry Date"
- Date format: Local

### SMS Sent
- Click "+" → Field type: "Checkbox"
- Name: "SMS Sent"

## 3. Get Table ID
- In Airtable, go to: Help → API Documentation
- Find your new Announcements table
- Copy the table ID (starts with "tbl")
- Update in `/api/announcements.js` line 7 if different from `tblAnnouncements`

## 4. Test
1. Go to Management Dashboard → Announcements tab
2. Post a test announcement
3. Check it appears on staff dashboard
4. Test SMS functionality with "Test Staff" account

That's it! The system is now ready to use.
