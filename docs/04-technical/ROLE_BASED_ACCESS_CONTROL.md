# Role-Based Access Control (RBAC) System

## Overview

The MBH Staff Portal now uses a robust role-based access control system that synchronizes staff roles from Airtable's "Staff Type" field to Supabase, replacing the previous hardcoded email list approach.

## Architecture

### Role Mapping
- **Full Time** (Airtable) → **admin** (Supabase)
- **Casual** (Airtable) → **staff** (Supabase)

### Components

1. **Role Manager Module** (`/api/role-manager.js`)
   - Syncs roles from Airtable to Supabase
   - Provides role checking utilities
   - Maps Staff Type to system roles

2. **Authentication Middleware** (`/api/auth-middleware.js`)
   - Validates JWT tokens
   - Attaches user information to requests

3. **Auth Hooks** (`/api/auth-hooks.js`)
   - Syncs user profile and role on login
   - Creates/updates staff profiles in Supabase

4. **Client-Side Role Helper** (`/training/js/role-helper.js`)
   - Caches permissions for performance
   - Provides UI element visibility control
   - Handles permission checking

## API Endpoints

### Public Endpoints
- `POST /api/auth/login-hook` - Syncs user role on login

### Authenticated Endpoints
- `GET /api/user/role` - Get current user's role and permissions
- `GET /api/user/permissions` - Get detailed permission flags

### Admin-Only Endpoints
- `POST /api/admin/sync-roles` - Sync all employee roles
- `POST /api/admin/sync-user-role` - Sync single user role

## Permissions

The system defines the following permissions:

- `canViewAllStaff` - Access to employee directory and all staff data
- `canManageAllocations` - Create and manage shift allocations
- `canViewReports` - Access to reports and analytics
- `canManageSettings` - Modify system settings
- `canAccessManagementDashboard` - Access to management dashboard

## Implementation Details

### Server-Side

1. **Role Synchronization**
   ```javascript
   // Sync all roles
   await roleManager.syncAllEmployeeRoles();
   
   // Sync single user
   await roleManager.syncEmployeeRole(airtableId, email);
   ```

2. **Permission Checking**
   ```javascript
   // Check if user has specific role
   const isAdmin = await roleManager.hasRole(email, ['admin']);
   
   // Middleware for route protection
   app.get('/api/protected', authenticate, roleManager.requireRole(['admin']), handler);
   ```

### Client-Side

1. **Include Role Helper**
   ```html
   <script src="js/role-helper.js"></script>
   ```

2. **Check Permissions**
   ```javascript
   // Check single permission
   const canManage = await RoleHelper.hasPermission('canManageAllocations');
   
   // Check if user is admin
   const isAdmin = await RoleHelper.isAdmin();
   ```

3. **UI Element Visibility**
   ```html
   <!-- Show only to users with specific permission -->
   <button data-permission="canManageAllocations">Manage Allocations</button>
   
   <!-- Show only to specific roles -->
   <div data-role="admin,manager">Management Section</div>
   ```

4. **Initialize on Page Load**
   ```javascript
   document.addEventListener('DOMContentLoaded', async () => {
       await RoleHelper.initializeRoleHelper();
   });
   ```

## Database Schema

### Supabase `staff_profiles` Table
```sql
CREATE TABLE staff_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users UNIQUE,
  airtable_employee_id TEXT UNIQUE,
  full_name TEXT,
  email TEXT,
  mobile TEXT,
  role TEXT CHECK (role IN ('staff', 'manager', 'admin')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security (RLS)
- Users can view their own profile
- Managers and admins can view all profiles
- Only admins can modify roles

## Migration Guide

### For Existing Users

1. **Initial Sync**: Run the role sync to populate all existing users:
   ```bash
   node scripts/test-role-sync.js
   ```

2. **Manual Admin Sync**: Use the admin API to sync roles:
   ```bash
   curl -X POST https://your-domain.com/api/admin/sync-roles \
     -H "X-Admin-Key: your-admin-key"
   ```

### For New Users

Roles are automatically synced when users log in for the first time.

## Security Considerations

1. **Server-Side Validation**: All permission checks are validated server-side
2. **JWT Authentication**: Uses Supabase JWT tokens for authentication
3. **Service Key Protection**: Service key is only used server-side for bypassing RLS
4. **Permission Caching**: Client-side cache expires after 5 minutes

## Testing

### Test Role Sync
```bash
# Test all users
node scripts/test-role-sync.js

# Test specific user
node scripts/test-role-sync.js user@example.com
```

### Test Permissions
1. Log in as a Full Time staff member - should have admin access
2. Log in as a Casual staff member - should have limited access
3. Try accessing management dashboard with each role

## Troubleshooting

### User Can't Access Management Features
1. Check their Staff Type in Airtable
2. Run role sync for their email
3. Have them log out and log in again
4. Check browser console for permission errors

### Role Not Syncing
1. Verify AIRTABLE_API_KEY is set correctly
2. Check if user exists in Employee Details table
3. Ensure email matches between Supabase and Airtable
4. Check server logs for sync errors

### Permission Cache Issues
1. Clear browser cache
2. Call `RoleHelper.clearPermissionsCache()`
3. Log out and log in again

## Future Enhancements

1. **Granular Permissions**: Add more specific permissions for features
2. **Role Hierarchy**: Implement role inheritance (e.g., admin inherits manager permissions)
3. **Custom Roles**: Allow creation of custom roles with specific permission sets
4. **Audit Trail**: Log all permission checks and role changes
5. **Real-time Updates**: Use WebSocket to update permissions without logout/login
