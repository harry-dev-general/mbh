# Role System Production Fix - October 17, 2025

## Executive Summary

The role-based access control (RBAC) system is failing in production because it requires the service role key to access the Supabase staff_profiles table. This is now fixed by the JWT authentication fix that uses the service role middleware.

## Root Cause Analysis

### The Problem Chain
1. **JWT Authentication Fails** → Users get 401 errors on `/api/user/permissions`
2. **Role System Can't Initialize** → Without SUPABASE_SERVICE_KEY, role-manager.js creates a null Supabase client
3. **getUserRole Fallback Fails** → The Airtable fallback doesn't work reliably in production
4. **Permissions Not Loaded** → Users can't access management features

### Code Issue in role-manager.js
```javascript
// This creates null if no service key
const supabase = SUPABASE_SERVICE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null;

// Later in getUserRole:
if (!supabase) {
    // Falls back to Airtable, but this is unreliable
    return await getUserRoleFromAirtable(email);
}
```

## The Solution

### 1. JWT Fix Enables Role System
The JWT authentication fix using service role key also fixes the role system:
- Service role key is now required in production
- Auth middleware can verify JWTs properly
- Role manager can access staff_profiles table

### 2. Updated Role Manager Pattern
To make the role system more robust, update role-manager.js to use the service role client properly:

```javascript
// Better pattern - fail early if service key not available
if (!SUPABASE_SERVICE_KEY) {
    console.error('FATAL: SUPABASE_SERVICE_KEY required for role management');
    throw new Error('Service role key not configured');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
```

## How the Systems Work Together

### Authentication Flow
1. User logs in → Supabase Auth issues JWT
2. Frontend calls `/api/user/permissions` with JWT
3. **auth-middleware-service.js** verifies JWT using service role key ✅
4. Request proceeds to permissions endpoint

### Role Checking Flow
1. Permissions endpoint calls `roleManager.getUserRole(email)`
2. Role manager queries `staff_profiles` table using service role client
3. Returns user's role (admin/staff/manager)
4. Permissions are calculated based on role

## Testing the Complete Fix

1. **Verify Service Role Key**
   ```bash
   # Check if set in Railway
   curl https://mbh-production-f0d1.up.railway.app/api/config
   ```

2. **Test Role Sync**
   ```bash
   # Admin endpoint to sync all roles
   curl -X POST https://mbh-production-f0d1.up.railway.app/api/admin/sync-roles \
     -H "Authorization: Bearer [admin-jwt-token]"
   ```

3. **Test User Permissions**
   - Visit `/training/jwt-debug-test-service.html`
   - Click "Test Permissions"
   - Should see role and permissions data

## Role Mapping Reference

### Airtable → Supabase
- **"Full Time"** → **"admin"** (all permissions)
- **"Casual"** → **"staff"** (limited permissions)
- **Future: "Manager"** → **"manager"** (most permissions)

### Permission Matrix
| Permission | Admin | Manager | Staff |
|------------|-------|---------|-------|
| canViewAllStaff | ✅ | ✅ | ❌ |
| canManageAllocations | ✅ | ✅ | ❌ |
| canViewReports | ✅ | ✅ | ❌ |
| canManageSettings | ✅ | ❌ | ❌ |
| canAccessManagementDashboard | ✅ | ✅ | ❌ |

## Environment Variables Required

```bash
# All required for production role system
SUPABASE_URL=https://etkugeooigiwahikrmzr.supabase.co
SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_KEY=[your-service-role-key]  # CRITICAL
AIRTABLE_API_KEY=[your-airtable-key]
```

## Key Files

### Backend
- `/api/auth-middleware-service.js` - JWT verification with service role
- `/api/role-manager.js` - Role sync and checking
- `/api/auth-hooks.js` - Login hook for profile sync
- `/server.js` - API endpoints for roles/permissions

### Frontend
- `/training/js/role-helper.js` - Client-side permission checking
- Management pages check permissions before displaying

## Common Issues and Solutions

### Issue: "Service key not configured" errors
**Solution**: Ensure SUPABASE_SERVICE_KEY is set in Railway

### Issue: Roles not syncing from Airtable
**Solution**: 
1. Check AIRTABLE_API_KEY is set
2. Run manual sync: POST /api/admin/sync-roles
3. Verify Staff Type field in Airtable

### Issue: User has wrong role
**Solution**:
1. Check Airtable Employee Details for Staff Type
2. Run sync for that user
3. Check staff_profiles table in Supabase

## Summary

The role system and JWT authentication are interdependent:
- Both require service role key in production
- JWT fix enables role system to work
- Together they provide complete RBAC functionality

With the service role key properly configured, both systems work as designed, providing secure role-based access control synchronized from Airtable.
