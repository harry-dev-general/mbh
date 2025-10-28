# Quick Start Prompt for Continuing MBH Staff Portal Development

## Project Context
You're working on the MBH Staff Portal for Manly Boat Hire in Sydney. It's a Node.js/Express app deployed on Railway that manages boat charter operations.

**Production URL**: https://mbh-production-f0d1.up.railway.app

## Critical Recent History (October 26, 2025)
A critical issue with the task scheduler feature returning 502 errors has been FULLY RESOLVED. The root cause was service worker interference. All fixes are documented in:
- `/docs/05-troubleshooting/TASK_SCHEDULER_502_RESOLUTION_GUIDE.md` - Complete technical guide
- `/docs/05-troubleshooting/SERVICE_WORKER_INTERFERENCE_ISSUE_OCT_2025.md` - Original issue tracking

## Key Technical Stack
- **Backend**: Node.js/Express
- **Auth**: Supabase
- **Data**: Airtable (tasks in Management base, staff in Operations base)
- **Deployment**: Railway
- **Frontend**: Vanilla JS with FullCalendar for task scheduling

## Essential Technical Knowledge

### 1. Express Static File Serving Quirk
```javascript
app.use(express.static('training'));
```
This serves files from `/training/` at the ROOT level:
- File location: `/training/task-scheduler.html`
- Accessible at: `/task-scheduler.html` (NOT `/training/task-scheduler.html`)
- **ALWAYS use absolute paths in HTML**: `/js/script.js` not `js/script.js`

### 2. Service Worker Management
- File: `/training/calendar-service-worker.js`
- Current version: `mbh-calendar-v2`
- Has exclusion list for dynamic pages
- **Always increment version when updating**
- User tool available at: `/training/sw-force-update.html`

### 3. Authentication Pattern
```javascript
// Initialize Supabase first
supabase = await window.SupabaseInit.getClient();

// Use getSession() for cached checks (fast)
const { data: { session } } = await supabase.auth.getSession();

// Use absolute paths for redirects
window.location.href = `/auth.html?returnUrl=${returnUrl}`;
```

## Current Feature Status
✅ Task Scheduler - Fully working with drag-and-drop task assignment
✅ Management Dashboard - Has navigation links to all features
✅ SMS System - Twilio integration for notifications
✅ Booking Management - Connected to Airtable
✅ Service Worker - Fixed with proper exclusions

## Working on Task Scheduler?
Main file: `/training/task-scheduler.html`
- Uses FullCalendar Vertical Resource View
- External event dragging for task assignment
- Connects to Airtable for persistence
- Requires authentication

## Quick Debugging Tips
1. **502 Errors?** → Check service worker exclusions
2. **404 on JS/CSS?** → Fix paths (use absolute `/path`)
3. **Auth loops?** → Check redirect paths and use `getSession()`
4. **Service worker issues?** → Increment version, use force update page

## Environment Variables
Check `.env` for all required vars. Key ones:
- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID=applkAFOn2qxtu7tx` (Operations base)
- Supabase credentials
- Twilio credentials

## Next Development Steps
The task scheduler is now fully functional. Potential enhancements:
1. Task templates for common operations
2. Recurring task scheduling
3. Staff availability tracking
4. Task completion metrics
5. Mobile responsiveness improvements

## Testing Checklist
- [ ] Test new features with service worker active
- [ ] Verify paths work in production (Railway)
- [ ] Check authentication flow
- [ ] Test on mobile devices
- [ ] Monitor browser console for errors

## Key Files for Reference
- `/server.js` - Express server and API routes
- `/training/task-scheduler.html` - Task scheduler UI
- `/js/supabase-init-fix.js` - Auth initialization
- `/docs/` - All documentation

Remember: The 502 issue is RESOLVED. Focus on enhancing features, not debugging the service worker!
