# Authentication Architecture - MBH Staff Portal

## Overview

The MBH Staff Portal uses a multi-layered authentication system that combines Supabase Auth for user authentication with a custom role-based access control (RBAC) system that syncs roles from Airtable.

## Authentication Flow

### 1. User Login
1. User enters credentials on `/training/auth.html`
2. Supabase Auth validates credentials
3. JWT token is issued and stored in browser
4. User is redirected to appropriate dashboard

### 2. API Request Authentication
1. Frontend includes JWT in Authorization header: `Bearer <token>`
2. Backend middleware (`/api/auth-middleware.js`) verifies token
3. User object is attached to Express request
4. Route handlers can access `req.user` for authenticated user info

### 3. Role Determination
1. User's email is used to look up employee record in Airtable
2. "Staff Type" field determines role:
   - "Full Time" → admin
   - "Casual" → staff
3. Role is cached in Supabase `staff_profiles` table
4. Permissions are computed based on role

## Key Components

### Frontend

**`/training/js/role-helper.js`**
- Provides `RoleHelper` global object
- Caches permissions for 5 minutes
- Methods:
  - `getUserPermissions()` - Fetches from `/api/user/permissions`
  - `hasPermission(permissionName)` - Checks specific permission
  - `hasRole(roles)` - Checks if user has one of specified roles
  - `clearCache()` - Clears permission cache

**Authentication Pages**
- `/training/auth.html` - Login/signup page
- `/training/dashboard.html` - Regular employee dashboard
- `/training/management-dashboard.html` - Management dashboard

### Backend

**`/api/auth-middleware.js`**
- `verifyToken(req)` - Verifies JWT with Supabase
- `authenticate` - Middleware requiring authentication
- `optionalAuthenticate` - Middleware with optional auth

**`/api/role-manager.js`**
- `mapStaffTypeToRole(staffType)` - Maps Airtable to system roles
- `getUserRole(email)` - Gets user's role
- `hasRole(email, allowedRoles)` - Checks role membership
- `syncEmployeeRole(airtableId, email)` - Syncs single employee
- `syncAllEmployeeRoles()` - Bulk sync operation
- `getCurrentUserRole` - Express handler for API endpoint

**`/api/auth-hooks.js`**
- `handleUserLogin(user)` - Syncs profile on login
- `loginHookHandler` - Express handler for login hook

### API Endpoints

**Authentication**
- `GET /api/user/role` - Get current user's role
- `GET /api/user/permissions` - Get user's permissions object
- `POST /api/auth/login-hook` - Called after successful login

**Admin Only**
- `POST /api/admin/sync-roles` - Manually sync all roles from Airtable

## Permissions System

### Permission Flags
```javascript
{
  canViewAllStaff: boolean,           // View employee directory
  canManageAllocations: boolean,      // Create/edit shift allocations
  canViewReports: boolean,            // Access reporting features
  canManageSettings: boolean,         // System settings (admin only)
  canAccessManagementDashboard: boolean // Access management UI
}
```

### Role Permissions
- **admin**: All permissions enabled
- **manager**: All except `canManageSettings`
- **staff**: All permissions disabled

## Database Schema

### Supabase: `staff_profiles` Table
```sql
CREATE TABLE staff_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  airtable_employee_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT,
  role TEXT DEFAULT 'staff' CHECK (role IN ('staff', 'manager', 'admin')),
  is_active BOOLEAN DEFAULT true,
  onboarding_completed BOOLEAN DEFAULT false,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Airtable: Employee Details Table
- **ID**: `tbltAE4NlNePvnkpY`
- **Key Field**: "Staff Type" (single select)
  - Options: "Full Time", "Casual"
- **Used for**: Source of truth for employee roles

## Security Considerations

1. **JWT Verification**: Must create new Supabase client with auth header
2. **Service Key**: Required for role sync operations (bypasses RLS)
3. **Client-Side Checks**: For UI only, not security enforcement
4. **Server-Side Validation**: All protected operations verified server-side

## Known Issues

1. **401 Authentication Errors**: JWT verification failing in production
2. **Environment Variables**: Must be set correctly in Railway
3. **Multi-Environment**: Development and production running simultaneously
