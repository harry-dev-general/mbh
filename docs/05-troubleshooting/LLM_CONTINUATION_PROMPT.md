# LLM Continuation Prompt for MBH Staff Portal Task Scheduler

## Context Overview

You are working on the **MBH Staff Portal**, a production Node.js/Express application for Manly Boat Hire in Sydney, Australia. The portal manages boat charter operations including bookings, vessel maintenance, and operational checklists.

### Current System Status (October 26, 2025)
- **Environment**: Node.js/Express deployed on Railway
- **Production URL**: https://mbh-production-f0d1.up.railway.app
- **Authentication**: Supabase
- **Data Storage**: 
  - Airtable (MBH Management base for tasks)
  - Airtable (MBH Bookings Operation base for staff)
- **Key Feature**: Task Scheduler with FullCalendar Vertical Resource View

### Recent Critical Issue (RESOLVED)
The task scheduler feature was completely inaccessible in production due to service worker interference. The issue has been fully resolved through multiple fixes detailed in `docs/05-troubleshooting/TASK_SCHEDULER_502_RESOLUTION_GUIDE.md`.

## Key Technical Understanding

### 1. Service Worker Architecture
The application uses `calendar-service-worker.js` which was aggressively caching document requests. Key points:
- Service workers persist across deployments
- Version control via `CACHE_NAME` is critical
- Exclusion paths prevent interference with dynamic content
- Located at: `/training/calendar-service-worker.js`

### 2. Express Static File Serving
```javascript
app.use(express.static('training'));
```
- Files in `/training/` directory are served at root level
- Example: `/training/task-scheduler.html` → accessible at `/task-scheduler.html`
- Always use absolute paths in HTML files

### 3. Authentication Flow
- Uses Supabase for authentication
- `supabase.auth.getSession()` for cached checks (preferred)
- `supabase.auth.getUser()` for fresh API calls
- Access control via `access_control` table
- Helper functions in `/js/role-helper.js`

### 4. Task Scheduler Implementation
- **Main file**: `/training/task-scheduler.html`
- **Features**:
  - FullCalendar with Vertical Resource View
  - External event dragging for task assignment
  - Staff resource management
  - Airtable integration for data persistence
- **Dependencies**:
  - `/js/supabase-init-fix.js` - Supabase client initialization
  - `/js/role-helper.js` - Role-based access control
  - FullCalendar libraries (CDN)

## Critical Files Reference

### Core Application Files
1. **`/server.js`**
   - Express server configuration
   - Static file serving
   - API endpoints and proxies
   - Middleware for cache control

2. **`/training/task-scheduler.html`**
   - Main task scheduler interface
   - Requires authentication
   - Integrates with Airtable for tasks and staff

3. **`/training/calendar-service-worker.js`**
   - Handles offline caching
   - Version: `mbh-calendar-v2`
   - Contains exclusion list for dynamic pages

4. **`/js/supabase-init-fix.js`**
   - Centralized Supabase client initialization
   - Handles auth state changes
   - Manages environment-specific configuration

### Documentation Files
1. **`/docs/05-troubleshooting/SERVICE_WORKER_INTERFERENCE_ISSUE_OCT_2025.md`**
   - Detailed issue description and resolution
   - Status: FULLY RESOLVED ✅

2. **`/docs/05-troubleshooting/TASK_SCHEDULER_502_RESOLUTION_GUIDE.md`**
   - Comprehensive guide to the resolution process
   - Technical discoveries and learnings
   - Prevention strategies

## Environment Variables Required
```
AIRTABLE_API_KEY=<your-key>
AIRTABLE_BASE_ID=applkAFOn2qxtu7tx  # Operations base
SUPABASE_URL=<your-url>
SUPABASE_ANON_KEY=<your-key>
# Plus Twilio variables for SMS features
```

## Current Working Features
1. ✅ Task Scheduler - Fully functional
2. ✅ Management Dashboard with navigation links
3. ✅ Authentication and access control
4. ✅ Service worker with proper exclusions
5. ✅ Airtable integration for tasks and staff

## Development Guidelines

### When Making Changes
1. **Service Worker Updates**:
   - Always increment `CACHE_NAME` version
   - Test in production-like environment
   - Provide user tools for cache clearing

2. **Adding New Pages**:
   - Add to service worker exclusion list if dynamic
   - Use absolute paths for all resources
   - Ensure proper authentication checks
   - Test resource loading thoroughly

3. **Authentication**:
   - Initialize Supabase before any auth operations
   - Use `getSession()` for immediate checks
   - Implement proper error handling
   - Always use absolute paths for redirects

4. **Static Resources**:
   - Remember Express serves `/training/` at root
   - Use absolute paths: `/js/`, `/css/`, `/images/`
   - Not relative paths: `js/`, `./js/`, `../js/`

## Testing Approach

### Local Development
```bash
npm start
# Access at http://localhost:3000
```

### Production Testing
1. Deploy to Railway
2. Test service worker updates
3. Verify authentication flow
4. Check resource loading
5. Monitor browser console for errors

### Key Test Scenarios
- [ ] Direct URL access to task scheduler
- [ ] Authentication redirect and return
- [ ] Service worker cache behavior
- [ ] Resource loading (JS, CSS, images)
- [ ] API endpoint connectivity
- [ ] Mobile device compatibility

## Common Issues and Solutions

### Issue: 502 Errors on New Pages
**Solution**: Check service worker exclusions and add cache-control headers

### Issue: Resources Loading with Wrong MIME Type
**Solution**: Fix paths - use absolute paths starting with `/`

### Issue: Authentication Redirect Loop
**Solution**: Use `getSession()` instead of `getUser()`, check redirect paths

### Issue: Service Worker Not Updating
**Solution**: Increment `CACHE_NAME`, use force update utility at `/training/sw-force-update.html`

## Next Steps for Development

### Immediate Priorities
1. Monitor task scheduler performance in production
2. Gather user feedback on functionality
3. Consider adding more task management features

### Potential Enhancements
1. Task templates for common operations
2. Recurring task patterns
3. Staff availability management
4. Task completion tracking
5. Performance metrics dashboard

## Contact and Resources
- **Documentation**: All in `/docs/` directory
- **Troubleshooting**: Check `/docs/05-troubleshooting/`
- **Railway Logs**: Available via Railway dashboard
- **Monitoring**: Browser console + Railway logs

## Important Reminders
1. Always test service worker changes thoroughly
2. Use absolute paths for reliability
3. Keep authentication flow simple and cached
4. Document any new issues in troubleshooting docs
5. Provide user-friendly error messages

This prompt should give you comprehensive context to continue development on the MBH Staff Portal. Focus on stability and user experience, and always test thoroughly in production-like environments.
