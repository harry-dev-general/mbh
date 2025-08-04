# MBH Staff Portal Implementation Log

## Session Date: July 18, 2025

### Overview
This document logs the implementation of email authentication and weekly availability submission form for the MBH Staff Portal, including all technical challenges encountered and their solutions.

## 1. Email Authentication Implementation

### What Was Built
- Complete email/password authentication using Supabase
- Login/signup combined form (`auth.html`)
- Email verification flow
- Protected pages with auth checks
- User session management

### Technical Challenges & Solutions

#### Challenge 1: Email Verification Redirect Issue
**Problem**: Verification emails were redirecting to `localhost:3000` instead of `localhost:8000`

**Root Cause**: Supabase "Site URL" was configured for port 3000 (Next.js default)

**Solution**:
1. Changed Supabase Site URL from `http://localhost:3000` to `http://localhost:8000`
2. Created `auth-callback.html` to handle email verification tokens
3. Updated signup to dynamically detect correct redirect URL

**Key Learning**: Supabase uses "Site URL" as the base for email templates, not just "Redirect URLs"

#### Challenge 2: Email Callback Handling
**Problem**: Clicking verification link showed "This site can't be reached"

**Solution**: Created dedicated callback handler that:
```javascript
// Extract tokens from URL hash
const hashParams = new URLSearchParams(window.location.hash.substring(1));
const accessToken = hashParams.get('access_token');
const refreshToken = hashParams.get('refresh_token');

// Set the session
await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken
});
```

## 2. Weekly Availability Submission Form

### What Was Built
- Dynamic availability form with day-by-day time selection
- Automatic employee record lookup by email
- Direct submission to Airtable
- Visual feedback (green highlighting for available days)
- Loading states and error handling

### Technical Implementation

#### Employee Linking Strategy
**Challenge**: How to link authenticated users to their Airtable employee records

**Solution**: Email-based lookup
```javascript
// Find employee by email
const response = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${EMPLOYEE_TABLE_ID}?filterByFormula={Email}='${email}'`,
    { headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }}
);
```

**Key Fields Mapped**:
- Supabase user email → Airtable Employee email
- Found employee record ID → Linked in submission

#### Airtable Integration Details
- **Base ID**: `applkAFOn2qxtu7tx`
- **Weekly Submissions Table**: `tblcBoyuVsbB1dt1I`
- **Employee Details Table**: `tbltAE4NlNePvnkpY`

**Submission Structure**:
```javascript
{
    "Employee": [employeeRecordId],  // Linked record
    "Week Starting": "2025-07-21",
    "Monday Available": true,
    "Monday From": "9:00 AM",        // Converted to 12-hour format
    "Monday Until": "5:00 PM",
    "Processing Status": "Pending"    // Auto-set for manager review
}
```

## 3. Navigation Bug Fix

### Problem
Submit Availability button wasn't working - required right-click → "Open in new tab"

### Root Cause
Smooth scrolling JavaScript was preventing ALL navigation:
```javascript
// BAD: This caught all links
document.querySelectorAll('.nav a').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();  // This blocked navigation!
```

### Solution
Only prevent default for anchor links:
```javascript
// GOOD: Only intercept anchor links
if (href && href.startsWith('#')) {
    e.preventDefault();
    // Smooth scroll logic
}
// Let normal links work
```

## 4. Key Technical Learnings

### Supabase Authentication
1. **URL Configuration**: Both "Site URL" and "Redirect URLs" must be configured
2. **Email Templates**: Use Site URL as base - critical for local development
3. **Session Handling**: Tokens come in URL hash, not query parameters
4. **Auth Persistence**: Sessions persist across refreshes automatically

### Airtable API Integration
1. **Linked Records**: Must pass array of record IDs: `[recordId]`
2. **Field Names**: Case-sensitive and must match exactly
3. **Time Format**: Airtable expects 12-hour format ("9:00 AM" not "09:00")
4. **Filter Formula**: Use curly braces for field names: `{Email}='value'`

### JavaScript Pitfalls
1. **Event Delegation**: Be specific about which elements to intercept
2. **preventDefault()**: Can break navigation if applied too broadly
3. **Async/Await**: Essential for API calls and auth checks

## 5. Security Considerations

### API Keys
- Airtable API key is exposed in client-side code (temporary for POC)
- Future: Move to server-side API or use environment variables

### Authentication
- Supabase anon key is safe for client-side (by design)
- Row Level Security should be implemented in production
- Email verification required for new accounts

### Data Validation
- Employee must exist in Airtable before submission
- Week starting date must be future Monday
- Time inputs have sensible defaults

## 6. Files Created/Modified

### New Files
1. `training/auth.html` - Login/signup page
2. `training/auth-callback.html` - Email verification handler
3. `training/availability.html` - Weekly availability form
4. `training/test-auth.html` - Auth testing page
5. `training/test-employee-lookup.html` - Employee lookup tester

### Modified Files
1. `training/index.html` - Added auth checks, user info display, fixed navigation

### Documentation
1. `docs/AUTHENTICATION_SETUP.md` - Auth implementation guide
2. `docs/AUTH_CALLBACK_SETUP.md` - Email verification flow
3. `docs/AVAILABILITY_FORM_GUIDE.md` - Form usage documentation
4. `docs/IMPLEMENTATION_LOG.md` - This file

## 7. Testing Performed

### Authentication Tests
- ✅ New user signup with email verification
- ✅ Existing user login
- ✅ Session persistence across refreshes
- ✅ Logout functionality
- ✅ Protected page redirects

### Availability Form Tests
- ✅ Employee lookup by email (harry@priceoffice.com.au)
- ✅ Form submission to Airtable
- ✅ Time format conversion (24h → 12h)
- ✅ Visual feedback for selected days
- ✅ Error handling for missing employee

### Verified Data
- Employee Record: `recdInFO4p3ennWpe` (Harry Price)
- Submission Record: `rechklt44NxMGGpV1` (Week of July 21, 2025)

## 8. Next Steps Recommended

1. **Move API Keys Server-Side**: Implement backend API for Airtable operations
2. **Add Features**:
   - View past submissions
   - Edit pending submissions
   - Manager approval interface
3. **Improve UX**:
   - Remember common availability patterns
   - Bulk week submission
   - Calendar view
4. **Production Prep**:
   - HTTPS setup
   - Custom domain
   - Proper environment variables
   - Error tracking

## 9. Console Errors to Ignore

These errors are harmless:
- `Failed to load resource: favicon.ico` - No site icon
- `Bad request version` - HTTPS requests to HTTP server
- Chrome extension logs - Local development artifacts

---
*End of Implementation Log - July 18, 2025*

## Session Date: July 19, 2025 (Automation Fix)

### Airtable Automation Integration Fix

#### Issue Discovered
The Airtable automation for processing Weekly Availability Submissions was failing due to:
1. Incorrect field name in automation script ("Test" instead of "Employee")
2. Web app not generating required Submission ID field

#### Fixes Applied
1. **Automation Script**: Changed field name from "Test" to "Employee" in the Roster record creation
2. **Web App Update**: Modified availability.html to auto-generate Submission IDs in format `WK[date]-[employeeCode]`
3. **Data Cleanup**: Removed invalid records missing Submission IDs

#### Result
- Automation successfully processes submissions
- Creates roster records with correct employee links
- Maintains compatibility with existing Airtable workflows

See [AIRTABLE_AUTOMATION_FIX.md](./AIRTABLE_AUTOMATION_FIX.md) for detailed documentation.

---
*Updated: July 19, 2025* 