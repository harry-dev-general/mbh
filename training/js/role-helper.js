/**
 * Role Helper Script
 * Client-side utilities for role-based access control
 * Include this script in all pages that need role checking
 */

(function() {
    'use strict';

    // Cache for user permissions to avoid repeated API calls
    let permissionsCache = null;
    let cacheExpiry = null;
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    /**
     * Get user permissions from API or cache
     * @returns {Promise<Object>} User permissions object
     */
    async function getUserPermissions() {
        // Check if we have valid cached permissions
        if (permissionsCache && cacheExpiry && Date.now() < cacheExpiry) {
            return permissionsCache;
        }

        try {
            // Get the current session
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                throw new Error('No active session');
            }

            // Fetch permissions from API
            const response = await fetch('/api/user/permissions', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch permissions');
            }

            const data = await response.json();
            
            // Cache the permissions
            permissionsCache = data;
            cacheExpiry = Date.now() + CACHE_DURATION;
            
            return data;

        } catch (error) {
            console.error('Error fetching permissions:', error);
            // Return default permissions on error
            return {
                success: false,
                role: 'staff',
                permissions: {
                    canViewAllStaff: false,
                    canManageAllocations: false,
                    canViewReports: false,
                    canManageSettings: false,
                    canAccessManagementDashboard: false
                }
            };
        }
    }

    /**
     * Check if user has specific permission
     * @param {string} permission - Permission to check
     * @returns {Promise<boolean>} Whether user has permission
     */
    async function hasPermission(permission) {
        const permissions = await getUserPermissions();
        return permissions.permissions?.[permission] || false;
    }

    /**
     * Check if user has admin role
     * @returns {Promise<boolean>} Whether user is admin
     */
    async function isAdmin() {
        const permissions = await getUserPermissions();
        return permissions.role === 'admin';
    }

    /**
     * Check if user has manager or admin role
     * @returns {Promise<boolean>} Whether user is manager or admin
     */
    async function isManager() {
        const permissions = await getUserPermissions();
        return permissions.role === 'manager' || permissions.role === 'admin';
    }

    /**
     * Clear permissions cache (call on logout)
     */
    function clearPermissionsCache() {
        permissionsCache = null;
        cacheExpiry = null;
    }

    /**
     * Redirect to dashboard if user doesn't have management access
     */
    async function requireManagementAccess() {
        const canAccess = await hasPermission('canAccessManagementDashboard');
        
        if (!canAccess) {
            console.log('User does not have management access, redirecting to dashboard');
            window.location.href = 'dashboard.html';
            return false;
        }
        
        return true;
    }

    /**
     * Show/hide elements based on permissions
     * Add data-permission attribute to elements that should be conditionally shown
     * Example: <button data-permission="canManageAllocations">Manage Allocations</button>
     */
    async function applyPermissionVisibility() {
        const permissions = await getUserPermissions();
        
        // Find all elements with data-permission attribute
        const elements = document.querySelectorAll('[data-permission]');
        
        elements.forEach(element => {
            const requiredPermission = element.getAttribute('data-permission');
            const hasPermission = permissions.permissions?.[requiredPermission] || false;
            
            // Show or hide based on permission
            if (hasPermission) {
                element.style.display = '';
                element.classList.remove('permission-hidden');
            } else {
                element.style.display = 'none';
                element.classList.add('permission-hidden');
            }
        });

        // Also handle data-role attribute for role-specific elements
        const roleElements = document.querySelectorAll('[data-role]');
        
        roleElements.forEach(element => {
            const requiredRoles = element.getAttribute('data-role').split(',');
            const userRole = permissions.role || 'staff';
            
            // Check if user's role matches any of the required roles
            const hasRole = requiredRoles.includes(userRole) || 
                           (userRole === 'admin' && !requiredRoles.includes('staff-only'));
            
            if (hasRole) {
                element.style.display = '';
                element.classList.remove('role-hidden');
            } else {
                element.style.display = 'none';
                element.classList.add('role-hidden');
            }
        });
    }

    /**
     * Initialize role helper
     * Call this on DOMContentLoaded in pages that use role-based features
     */
    async function initializeRoleHelper() {
        // Apply permission visibility on page load
        await applyPermissionVisibility();
        
        // Listen for auth state changes
        supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_OUT') {
                clearPermissionsCache();
            } else if (event === 'SIGNED_IN') {
                // Clear cache to force refresh on sign in
                clearPermissionsCache();
                applyPermissionVisibility();
            }
        });
    }

    // Export functions to global scope
    window.RoleHelper = {
        getUserPermissions,
        hasPermission,
        isAdmin,
        isManager,
        clearPermissionsCache,
        requireManagementAccess,
        applyPermissionVisibility,
        initializeRoleHelper
    };

})();
