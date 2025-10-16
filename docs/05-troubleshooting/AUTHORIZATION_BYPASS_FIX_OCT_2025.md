# Authorization Bypass Security Fix - October 16, 2025

## Issue Summary

**Date Discovered**: October 16, 2025  
**Severity**: HIGH - Unauthorized access to admin functionality  
**Reporter**: User testing with harry@kursol.io account  

### The Problem

A regular staff account (harry@kursol.io) was able to access the admin-only management allocation page at `/management-allocations.html`. This represented a critical security vulnerability where any authenticated user could access management functions regardless of their actual role/permissions.

## Root Cause Analysis

### 1. Missing Staff Profile
The harry@kursol.io user account existed in Supabase auth.users but had no corresponding record in the staff_profiles table. This caused the role manager to return a default 'staff' role.

### 2. Insufficient Frontend Authorization
The `checkAuth()` function in management-allocations.html was only verifying that a user was authenticated, not that they had the appropriate permissions:

```javascript
// OLD CODE - VULNERABLE
async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = 'auth.html';
    } else {
        document.getElementById('userEmail').textContent = user.email;
        loadWeekData();  // Allowed access without permission check!
    }
}
```

### 3. Inconsistent Implementation
While `management-dashboard.html` correctly used RoleHelper to verify permissions, `management-allocations.html` did not include or use the RoleHelper library.

## The Fix

### 1. Created Staff Profile
Added a proper staff profile for harry@kursol.io in Supabase:

```sql
INSERT INTO staff_profiles (
  id, user_id, airtable_employee_id, full_name, email, role, is_active, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '2925a982-0927-481f-adac-c89262120c5c',
  'rec_test_harry_kursol',
  'Harry Kursol',
  'harry@kursol.io',
  'staff',  -- Correctly assigned staff role
  true,
  NOW(), NOW()
);
```

### 2. Added RoleHelper Integration
Added the RoleHelper script inclusion to management-allocations.html:

```html
<script src="js/role-helper.js"></script>
```

### 3. Updated Authorization Check
Replaced the vulnerable checkAuth() function with proper permission checking:

```javascript
// NEW CODE - SECURE
async function checkAuth() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (!session || !session.user) {
        window.location.href = 'auth.html';
        return;
    }
    
    // Check permissions using RoleHelper
    const canAccessManagement = await RoleHelper.hasPermission('canAccessManagementDashboard');
    
    if (!canAccessManagement) {
        alert('Access Denied: You do not have permission to access the management allocation dashboard.');
        window.location.href = 'dashboard.html';
        return;
    }
    
    // User has appropriate permissions
    document.getElementById('userEmail').textContent = session.user.email;
    loadWeekData();
}
```

## Backend Security Analysis

The backend `/api/user/permissions` endpoint correctly checks roles via the role-manager module:

```javascript
const permissions = {
    canViewAllStaff: await roleManager.hasRole(userEmail, ['admin', 'manager']),
    canManageAllocations: await roleManager.hasRole(userEmail, ['admin', 'manager']),
    canViewReports: await roleManager.hasRole(userEmail, ['admin', 'manager']),
    canManageSettings: await roleManager.hasRole(userEmail, ['admin']),
    canAccessManagementDashboard: await roleManager.hasRole(userEmail, ['admin', 'manager'])
};
```

The issue was purely on the frontend - the backend was already secure.

## Current User Roles

After the fix, the system has these user profiles:

| Email | Role | Access Level |
|-------|------|--------------|
| harry@priceoffice.com.au | admin | Full management access |
| harry@kursol.io | staff | Staff dashboard only |

## Testing Verification

1. **Admin User (harry@priceoffice.com.au)**
   - ✅ Can access management dashboard
   - ✅ Can access management allocations
   - ✅ All admin features available

2. **Staff User (harry@kursol.io)**
   - ✅ Can access staff dashboard
   - ❌ Cannot access management dashboard (redirected with error)
   - ❌ Cannot access management allocations (redirected with error)

## Recommendations

1. **Audit All Management Pages**: Check all admin/management pages for similar vulnerabilities
2. **Consistent Implementation**: Ensure all protected pages use RoleHelper
3. **Backend Double-Check**: While frontend checks improve UX, always verify permissions on the backend
4. **Regular Security Audits**: Periodically test with different user roles
5. **Missing Profile Handling**: Consider creating staff profiles automatically on first login

## Files Modified

- `/training/management-allocations.html` - Added RoleHelper and proper permission checking
- Supabase `staff_profiles` table - Added harry@kursol.io record

## Deployment

Changes have been committed and pushed to the development branch. The fix will be automatically deployed to Railway within 1-2 minutes.

## Conclusion

The security vulnerability has been successfully resolved. The system now properly enforces role-based access control on both frontend and backend, preventing unauthorized access to management functions.
