# MBH Staff Portal - Quick Start Prompt for LLMs

## What You're Working On
The MBH Staff Portal - a web app for Manly Boat Hire that manages staff schedules, boat bookings, vessel maintenance, and SMS notifications.

## First Things to Read
1. **MUST READ**: `/mbh-staff-portal/PROJECT_HANDOVER_PROMPT.md` - Has all API keys and critical info
2. **Documentation Hub**: `/mbh-staff-portal/docs/README.md` - Links to everything
3. **Full Context**: `/mbh-staff-portal/docs/LLM_CONTINUATION_PROMPT.md` - Comprehensive guide

## Tech Stack Quick Reference
- Frontend: Plain HTML/JS/CSS in `/training/` folder
- Backend: Node.js/Express (`server.js`)
- Database: Airtable (Base: `applkAFOn2qxtu7tx`)
- Auth: Supabase
- SMS: Twilio
- Host: Railway (auto-deploys from GitHub main)

## Key Airtable Tables
```javascript
const BOOKINGS_TABLE_ID = 'tblcBoyuVsbB1dt1I';     // Customer bookings
const EMPLOYEE_TABLE_ID = 'tbltAE4NlNePvnkpY';      // Staff info
const BOATS_TABLE_ID = 'tblNLoBNb4daWzjob';         // Vessels
const ANNOUNCEMENTS_TABLE_ID = 'tblDCSmGREv0tF0Rq'; // Announcements
```

## Common Tasks

### "Fix a bug"
1. Check `/docs/05-troubleshooting/` first
2. Look for similar fixes in `/docs/` (search for the feature name)
3. Test locally, then deploy

### "Add a feature"
1. Review similar features in `/training/` folder
2. Check patterns in `/docs/02-features/`
3. Update documentation after implementing

### "Work with Airtable"
1. Field names are case-sensitive
2. Always use arrays for linked records: `[recordId]`
3. Check `/docs/TECHNICAL_REFERENCE_AIRTABLE_API.md` for examples

### "Debug SMS issues"  
1. Check if Twilio credentials are set
2. Verify "Active Roster" checkbox in Employee table
3. Review `/docs/02-features/sms/` guides

## Important Patterns

### Backend API Calls (Node.js)
```javascript
const axios = require('axios'); // Use axios, not fetch!

const response = await axios.get(
  `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`,
  {
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`
    }
  }
);
```

### Frontend API Calls
```javascript
// Frontend can use fetch
const response = await fetch(`/api/endpoint`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

### Date Handling (Sydney Time)
```javascript
const today = new Date();
today.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
```

## Quick Wins
- Documentation is in `/docs/` - it probably has your answer
- Recent fixes are in `/docs/SEPTEMBER_2025_IMPLEMENTATIONS.md`
- Console logs are your friend (but remove them after debugging)
- Test on mobile - staff use phones

## Need More Detail?
Read the full guide: `/mbh-staff-portal/docs/LLM_CONTINUATION_PROMPT.md`

---
*Pro tip: When in doubt, search the docs folder. Previous developers documented almost everything.*
