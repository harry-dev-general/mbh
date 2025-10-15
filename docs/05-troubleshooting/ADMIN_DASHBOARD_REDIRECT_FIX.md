# Admin Dashboard Redirect Fix

## Issue Summary
Date: October 2025

**Issues Fixed:**
1. Admin users were being shown the regular dashboard instead of management dashboard
2. Root URL (/) was directly serving dashboard.html without auth checks
3. 401 Unauthorized errors due to missing staff_profiles record

## Root Causes

### 1. Missing Staff Profile
The user harry@priceoffice.com.au had:
- An auth.users record in Supabase
- An Employee Details record in Airtable (marked as "Casual")
- **NO staff_profiles record** linking the two

This caused the role-based permissions check to fail with 401 errors.

### 2. Direct Dashboard Serving
The server was configured to serve dashboard.html directly at the root URL:
```javascript
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'training', 'dashboard.html'));
});
```

This bypassed proper authentication flow.

### 3. Incorrect Role Mapping
The Airtable record had "Casual" staff type, which maps to "staff" role, not "admin".

## Solutions Implemented

### 1. Created Staff Profile
Created a staff_profiles record for harry@priceoffice.com.au:
```sql
INSERT INTO staff_profiles (
  user_id,
  airtable_employee_id,
  full_name,
  email,
  mobile,
  role,
  is_active,
  onboarding_completed
) VALUES (
  '960c3bf0-9406-4920-914b-c72523e03ac6',
  'recdInFO4p3ennWpe',
  'Harry Price',
  'harry@priceoffice.com.au',
  '+61424913757',
  'admin',
  true,
  true
);
```

### 2. Updated Airtable Staff Type
Changed the Staff Type from "Casual" to "Full Time" in Airtable to maintain consistency.

### 3. Created Proper Index Page
Created `/training/index.html` that:
- Checks authentication status
- Fetches user permissions using RoleHelper
- Redirects admin users to management dashboard
- Redirects regular users to standard dashboard
- Respects `?view=regular` parameter for admins who want regular view

### 4. Updated Server Routes
Changed the root route to serve the new index.html:
```javascript
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'training', 'index.html'));
});
```

## Authentication Flow

1. User visits root URL (/)
2. index.html loads and checks authentication
3. If not authenticated → redirect to /training/auth.html
4. If authenticated:
   - Fetch user permissions via RoleHelper
   - Check if user has `canAccessManagementDashboard` permission
   - Admin users → /training/management-dashboard.html
   - Regular users → /training/dashboard.html
   - Admin users with ?view=regular → /training/dashboard.html?view=regular

## Verification Steps

1. Clear browser cache and cookies
2. Visit https://mbh-development.up.railway.app/
3. Login with admin credentials
4. Should automatically redirect to management dashboard
5. Can switch to regular view using toggle button

## Future Considerations

1. **Role Sync**: Implement automatic role synchronization between Airtable and Supabase
2. **Login Hook**: Use the auth login hook to create staff_profiles automatically
3. **Error Handling**: Better error messages when staff_profiles are missing
4. **JWT Verification**: Continue monitoring the auth middleware for any issues

## Related Files
- `/training/index.html` - New authentication router page
- `/api/auth-middleware-v2.js` - Simplified JWT verification
- `/server.js` - Updated route handlers
- `/training/dashboard.html` - Regular dashboard with role checks
- `/training/management-dashboard.html` - Admin dashboard
