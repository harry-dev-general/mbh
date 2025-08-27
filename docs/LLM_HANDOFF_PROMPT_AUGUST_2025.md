# LLM Handoff Prompt - MBH Staff Portal (August 2025)

## 🚀 Initial Context for Next LLM

You are about to work on the **MBH Staff Portal** project, a web application for managing boat rental bookings and staff allocations. This is a production system currently live at https://mbh-production-f0d1.up.railway.app.

**CRITICAL: Start by reading these documents in order:**
1. `@docs/SMS_NOTIFICATION_FINAL_IMPLEMENTATION.md` - Latest feature implementation
2. `@docs/SMS_NOTIFICATION_LESSONS_LEARNED.md` - Critical technical learnings
3. `@docs/PLATFORM_INTEGRATION_REQUIREMENTS.md` - Platform-specific requirements
4. `@docs/BOOKING_ALLOCATION_FIX_2025.md` - Recent system fixes

## 📍 Current Working Context

```
Project Location: /Users/harryprice/kursol-projects/mbh-staff-portal/
Repository: https://github.com/harry-dev-general/mbh (branch: main)
Production URL: https://mbh-production-f0d1.up.railway.app
Deployment: Railway (auto-deploys from GitHub main branch)

Technology Stack:
- Frontend: Vanilla HTML/CSS/JavaScript (NO React/Vue/Angular)
- Backend: Express.js server
- Database: Airtable (Base ID: applkAFOn2qxtu7tx)
- Auth: Supabase (Project: etkugeooigiwahikrmzr)
- SMS: Twilio API
- Deployment: Railway
```

## 🎯 Latest Implementation (August 2025)

### SMS Shift Notification System - FULLY OPERATIONAL ✅

**What was just completed:**
1. **SMS Notifications**: Employees receive SMS when allocated to shifts
2. **Magic Link Authentication**: One-click accept/decline from SMS without login
3. **Standalone Confirmation Page**: Non-authenticated page for shift responses
4. **Visual Status Indicators**: Shows pending/accepted/declined in employee schedules
5. **Management Notifications**: Managers notified when shifts declined

**Key Files Modified/Created:**
- `/api/notifications.js` - Twilio SMS integration
- `/api/shift-response-handler.js` - Magic link processing
- `/training/shift-confirmation.html` - Standalone confirmation page
- `/server.js` - New API endpoints and routing fixes
- `/training/management-allocations.html` - Triggers SMS on allocation
- `/training/my-schedule.html` - Shows response status

## ⚠️ CRITICAL WARNINGS - READ FIRST

### 1. Airtable Field Name Variations
```javascript
// ALWAYS check multiple field names for phone numbers
const employeePhone = employee['Phone'] || 
                     employee['Mobile'] || 
                     employee['Mobile Number'];
```

### 2. Environment Variables Required
```env
# These MUST be set in Railway dashboard
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+61xxxxxxxxx
MANAGER_PHONE_1=+61xxxxxxxxx
MANAGER_PHONE_2=+61xxxxxxxxx
BASE_URL=https://mbh-production-f0d1.up.railway.app
```

### 3. Middleware Order in Express (server.js)
```javascript
// CRITICAL: Order matters!
// 1. CSP bypass middleware (for shift-confirmation.html)
// 2. CORS
// 3. Body parser
// 4. Specific routes BEFORE static
// 5. Static files LAST
```

### 4. Magic Token Context
```javascript
// Tokens MUST include context for proper handling
magicTokens.set(token, {
    allocationId,
    employeeId,
    action,
    expiresAt,
    isBookingAllocation,  // CRITICAL for booking vs general handling
    role                  // NEEDED for booking context
});
```

### 5. Session Management Gotchas
```javascript
// DON'T cause reload loops
supabase.auth.onAuthStateChange((event, session) => {
    // ONLY handle sign out
    if (event === 'SIGNED_OUT') {
        window.location.href = 'auth.html';
    }
    // IGNORE 'SIGNED_IN' to prevent loops
});
```

## 🔧 Current System State

### What's Working
- ✅ SMS notifications sending successfully
- ✅ Magic links processing correctly
- ✅ Confirmation page loading without authentication
- ✅ Response status updating in Airtable
- ✅ Visual indicators in employee schedule
- ✅ Management notifications for declines
- ✅ Booking allocations display correctly
- ✅ Staff availability showing in management view
- ✅ Authentication flow operational

### Recent Bug Fixes Applied
1. **Fixed phone number field detection** - Now checks Phone/Mobile/Mobile Number
2. **Fixed magic link for booking allocations** - Added isBookingAllocation flag to tokens
3. **Fixed confirmation page navigation** - Changed from anchor to button with absolute URL
4. **Fixed dashboard redirect loop** - Modified auth state change listener
5. **Fixed confirmation page loading** - Added CSP bypass and dedicated route handler
6. **Fixed staff availability display** - Moved renderStaffList() after data loading
7. **Fixed SMS for booking allocations** - Corrected variable scope and time extraction

## 📊 Airtable Structure

### Critical Tables and IDs
```javascript
const BASE_ID = 'applkAFOn2qxtu7tx';  // MBH Bookings Operation

// Table IDs - DO NOT CHANGE WITHOUT VERIFICATION
const BOOKINGS_TABLE_ID = 'tblRe0cDmK3bG2kPf';     // Bookings Dashboard
const EMPLOYEES_TABLE_ID = 'tbltAE4NlNePvnkpY';    // Employee Details
const ALLOCATIONS_TABLE_ID = 'tbl22YKtQXZtDFtEX';  // Shift Allocations
const ROSTER_TABLE_ID = 'tblwwK1jWGxnfuzAN';       // Roster
```

### Required Fields for SMS System
**Shift Allocations Table:**
- `Response Status` (Text) - Values: Pending/Accepted/Declined
- `Response Date` (DateTime)
- `Response Method` (Text) - Values: SMS Link/Portal/Manual

**Employee Details Table:**
- `Phone` OR `Mobile` OR `Mobile Number` (Phone field)

## 🐛 Common Issues & Solutions

### Issue: SMS not sending
```javascript
// Check 1: Employee phone number
console.log('Employee data:', employee);
// Ensure one of Phone/Mobile/Mobile Number exists

// Check 2: Twilio credentials
console.log('Twilio configured:', !!process.env.TWILIO_ACCOUNT_SID);

// Check 3: Phone format
// Must be +61XXXXXXXXX for Australian numbers
```

### Issue: Magic link shows "Error Processing Response"
```javascript
// Check token data includes all context
console.log('Token data:', magicTokens.get(token));
// Must have: isBookingAllocation, role (if booking)

// For bookings: fetch from Bookings Dashboard
// For general: update Shift Allocations
```

### Issue: Confirmation page not loading
```javascript
// Verify CSP bypass is working
// Check /server.js for:
app.use((req, res, next) => {
    if (req.path === '/training/shift-confirmation.html') {
        return next(); // Skip CSP
    }
    // Apply CSP for other routes
});
```

## 📁 Project Structure

```
mbh-staff-portal/
├── api/
│   ├── notifications.js          # Twilio SMS service
│   └── shift-response-handler.js # Magic link processor
├── training/
│   ├── management-allocations.html    # Management dashboard
│   ├── my-schedule.html              # Employee schedule
│   ├── shift-confirmation.html       # NEW - Standalone confirmation
│   ├── dashboard.html                 # Main hub
│   └── auth.html                     # Login/signup
├── docs/
│   ├── SMS_NOTIFICATION_FINAL_IMPLEMENTATION.md
│   ├── SMS_NOTIFICATION_LESSONS_LEARNED.md
│   ├── PLATFORM_INTEGRATION_REQUIREMENTS.md
│   └── [other documentation]
└── server.js                          # Express server with new endpoints
```

## 🎯 Next Priority Tasks

### Immediate (If Issues Arise)
1. **If SMS not sending**: Check Twilio logs in dashboard
2. **If magic links failing**: Verify token has isBookingAllocation flag
3. **If page not loading**: Check CSP bypass in server.js
4. **If redirect failing**: Ensure BASE_URL environment variable is set

### Short-term Enhancements
1. **Add SMS reminders** for unconfirmed shifts (24 hours before)
2. **Bulk SMS notifications** for multiple allocations
3. **SMS preferences** per employee
4. **Response tracking** for booking allocations in Airtable
5. **Token cleanup** job for expired tokens

### Long-term Improvements
1. **Move tokens to Redis** (currently in-memory)
2. **Add SMS templates** system
3. **Implement shift swapping** via SMS
4. **Add two-way SMS** responses
5. **Create SMS analytics** dashboard

## 🧪 Testing the SMS System

### Quick Test Process
```bash
# 1. Ensure you're in the project directory
cd /Users/harryprice/kursol-projects/mbh-staff-portal

# 2. Check server is running
npm start  # or node server.js

# 3. Test SMS notification
curl -X POST http://localhost:8080/api/send-shift-notification \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "recU2yfUOIGFsIuZV",
    "allocationId": "test123",
    "shiftType": "General Operations",
    "shiftDate": "2025-08-28",
    "startTime": "09:00",
    "endTime": "17:00"
  }'

# 4. Test magic link (use actual token from SMS)
# Visit: http://localhost:8080/api/shift-response?token=ACTUAL_TOKEN
```

### Test Accounts
- **Test Employee**: harry@kursol.io (ID: recU2yfUOIGFsIuZV)
- **Test Phone**: Check Employee Details in Airtable for phone number
- **Test Booking**: ID: rec5Qsszj8fkEgKTY (Customer: Test Customer - SMS Test)

## 💡 Implementation Patterns to Follow

### Pattern 1: Always Check Multiple Fields
```javascript
// For any Airtable field that might vary
const value = record['FieldName1'] || 
              record['FieldName2'] || 
              record['FieldName3'] ||
              defaultValue;
```

### Pattern 2: Comprehensive Error Logging
```javascript
try {
    // Operation
    console.log('Operation starting with:', data);
    const result = await operation();
    console.log('Operation succeeded:', result);
} catch (error) {
    console.error('Operation failed:', {
        error: error.message,
        stack: error.stack,
        context: relevantData
    });
}
```

### Pattern 3: Booking vs General Allocation Handling
```javascript
if (isBookingAllocation) {
    // Fetch from Bookings Dashboard
    // Use booking fields for details
    // Don't create allocation record
} else {
    // Update Shift Allocations table
    // Standard allocation handling
}
```

## 🚀 Deployment Process

```bash
# Make your changes, then:
git add -A
git commit -m "Descriptive message about changes"
git push origin main

# Railway auto-deploys in ~2 minutes
# Check deployment at: https://mbh-production-f0d1.up.railway.app
```

## 🔍 Debugging Commands

### Browser Console (for client-side issues)
```javascript
// Check current employee
console.log('Employee ID:', employeeRecordId);

// Check allocations
console.log('My allocations:', myAllocations);

// Force refresh data
await loadMyAllocations();
renderScheduleView();
```

### Server Logs (via Railway dashboard)
- Look for SMS_SENT, SMS_FAILED events
- Check for Twilio error codes
- Verify environment variables loaded
- Monitor token validation

## 📚 Documentation Priority

**Must Read (in order):**
1. `@docs/SMS_NOTIFICATION_FINAL_IMPLEMENTATION.md` - Complete feature overview
2. `@docs/SMS_NOTIFICATION_LESSONS_LEARNED.md` - Critical discoveries
3. `@docs/PLATFORM_INTEGRATION_REQUIREMENTS.md` - Platform specifics

**Reference as Needed:**
- `@docs/BOOKING_ALLOCATION_FIX_2025.md` - Booking system fixes
- `@docs/SHIFT_NOTIFICATION_SETUP_GUIDE.md` - Initial setup guide
- `@docs/LLM_HANDOFF_AUGUST_2025.md` - Previous handoff context

## ⚡ Quick Start Commands

```bash
# View current status
git status

# Check recent commits
git log --oneline -10

# Test locally
node server.js

# Check production
curl https://mbh-production-f0d1.up.railway.app/api/shift-status/test

# View Railway logs
# Go to Railway dashboard → mbh project → View logs
```

## 🎯 Your First Actions

1. **Review the SMS notification implementation** in the referenced docs
2. **Check if any SMS-related environment variables need setting** in Railway
3. **Test the system** with a mock allocation to Test Staff
4. **Review any console errors** in production
5. **Check Railway deployment logs** for any issues

## ⚠️ DO NOT:
- Change Airtable table IDs without verification
- Remove the CSP bypass for shift-confirmation.html
- Modify token structure without updating handler
- Cause auth state reload loops
- Commit Twilio credentials to GitHub

## ✅ DO:
- Always check multiple field names for Airtable data
- Log comprehensively at each step
- Test with actual phone numbers
- Verify environment variables are set
- Handle both booking and general allocations
- Keep confirmation pages standalone (no auth)

---

**System Status**: ✅ FULLY OPERATIONAL
**Last Major Update**: SMS Notification System (August 2025)
**Current Issues**: None reported
**Next Priority**: SMS reminders for unconfirmed shifts

Welcome to the MBH Staff Portal project! The SMS notification system has just been successfully implemented and is working in production. The system is stable, well-documented, and ready for enhancements.
