/**
 * Role Manager Module
 * Handles syncing roles from Airtable Staff Type to Supabase staff_profiles
 * and provides role-based access control utilities
 */

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Airtable configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = 'applkAFOn2qxtu7tx';
const EMPLOYEES_TABLE_ID = 'tbltAE4NlNePvnkpY';

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Initialize Supabase client with service key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Map Airtable Staff Type to Supabase role
 * @param {string} staffType - Staff Type from Airtable ("Full Time" or "Casual")
 * @returns {string} - Corresponding Supabase role
 */
function mapStaffTypeToRole(staffType) {
    if (staffType === 'Full Time') {
        return 'admin';
    }
    return 'staff';
}

/**
 * Sync a single employee's role from Airtable to Supabase
 * @param {string} airtableEmployeeId - The Airtable employee record ID
 * @param {string} email - Employee email
 * @returns {Promise<Object>} - Result of the sync operation
 */
async function syncEmployeeRole(airtableEmployeeId, email) {
    try {
        // Fetch employee from Airtable
        const response = await axios.get(
            `https://api.airtable.com/v0/${BASE_ID}/${EMPLOYEES_TABLE_ID}/${airtableEmployeeId}`,
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const employee = response.data;
        const staffType = employee.fields['Staff Type'];
        const role = mapStaffTypeToRole(staffType);

        // Update role in Supabase staff_profiles
        const { data, error } = await supabase
            .from('staff_profiles')
            .update({ 
                role,
                updated_at: new Date().toISOString()
            })
            .eq('airtable_employee_id', airtableEmployeeId);

        if (error) {
            console.error(`Error updating role for ${email}:`, error);
            return { success: false, error: error.message };
        }

        console.log(`✅ Updated role for ${email}: ${staffType} → ${role}`);
        return { 
            success: true, 
            email,
            staffType,
            role,
            updated: data
        };

    } catch (error) {
        console.error(`Error syncing role for ${airtableEmployeeId}:`, error);
        return { 
            success: false, 
            error: error.message 
        };
    }
}

/**
 * Sync all employee roles from Airtable to Supabase
 * @returns {Promise<Object>} - Summary of sync operation
 */
async function syncAllEmployeeRoles() {
    console.log('🔄 Starting role sync from Airtable to Supabase...');
    
    try {
        // Fetch all employees from Airtable
        const response = await axios.get(
            `https://api.airtable.com/v0/${BASE_ID}/${EMPLOYEES_TABLE_ID}`,
            {
                params: {
                    filterByFormula: `AND({Active Roster} = 1, {Email} != '')`,
                    fields: ['Name', 'Email', 'Staff Type']
                },
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const employees = response.data.records;
        const results = {
            total: employees.length,
            synced: 0,
            failed: 0,
            details: []
        };

        // Process each employee
        for (const employee of employees) {
            const email = employee.fields['Email'];
            const result = await syncEmployeeRole(employee.id, email);
            
            if (result.success) {
                results.synced++;
            } else {
                results.failed++;
            }
            
            results.details.push(result);
        }

        console.log(`✅ Role sync completed: ${results.synced} synced, ${results.failed} failed`);
        return results;

    } catch (error) {
        console.error('Error in bulk role sync:', error);
        throw error;
    }
}

/**
 * Get user role from Supabase by email
 * @param {string} email - User email
 * @returns {Promise<string|null>} - User role or null if not found
 */
async function getUserRole(email) {
    try {
        const { data, error } = await supabase
            .from('staff_profiles')
            .select('role')
            .eq('email', email.toLowerCase())
            .single();

        if (error) {
            console.error(`Error fetching role for ${email}:`, error);
            return null;
        }

        return data?.role || 'staff';
    } catch (error) {
        console.error(`Error in getUserRole:`, error);
        return null;
    }
}

/**
 * Check if user has required role
 * @param {string} email - User email
 * @param {string[]} allowedRoles - Array of allowed roles
 * @returns {Promise<boolean>} - Whether user has required role
 */
async function hasRole(email, allowedRoles) {
    const userRole = await getUserRole(email);
    
    if (!userRole) return false;
    
    // Admin has access to everything
    if (userRole === 'admin') return true;
    
    // Check if user's role is in allowed roles
    return allowedRoles.includes(userRole);
}

/**
 * Express middleware for role-based access control
 * @param {string[]} allowedRoles - Roles allowed to access the route
 * @returns {Function} - Express middleware function
 */
function requireRole(allowedRoles) {
    return async (req, res, next) => {
        // Get user email from request (assumes auth middleware has run)
        const userEmail = req.user?.email;
        
        if (!userEmail) {
            return res.status(401).json({ 
                error: 'Unauthorized: No user email found' 
            });
        }

        const hasAccess = await hasRole(userEmail, allowedRoles);
        
        if (!hasAccess) {
            return res.status(403).json({ 
                error: 'Forbidden: Insufficient permissions' 
            });
        }

        // Attach user role to request for downstream use
        req.userRole = await getUserRole(userEmail);
        
        next();
    };
}

/**
 * Get role information for current user (API endpoint handler)
 */
async function getCurrentUserRole(req, res) {
    try {
        const userEmail = req.user?.email;
        
        if (!userEmail) {
            return res.status(401).json({ 
                error: 'Unauthorized' 
            });
        }

        const role = await getUserRole(userEmail);
        
        // Also fetch from Airtable for Staff Type
        const { data: profile } = await supabase
            .from('staff_profiles')
            .select('airtable_employee_id, full_name')
            .eq('email', userEmail.toLowerCase())
            .single();

        let staffType = null;
        if (profile?.airtable_employee_id) {
            try {
                const response = await axios.get(
                    `https://api.airtable.com/v0/${BASE_ID}/${EMPLOYEES_TABLE_ID}/${profile.airtable_employee_id}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                staffType = response.data.fields['Staff Type'];
            } catch (error) {
                console.error('Error fetching staff type:', error);
            }
        }

        res.json({
            email: userEmail,
            role: role || 'staff',
            staffType,
            fullName: profile?.full_name,
            isAdmin: role === 'admin',
            isManager: role === 'manager' || role === 'admin',
            permissions: {
                canViewAllStaff: role === 'admin' || role === 'manager',
                canManageAllocations: role === 'admin' || role === 'manager',
                canViewReports: role === 'admin' || role === 'manager',
                canManageSettings: role === 'admin'
            }
        });

    } catch (error) {
        console.error('Error getting user role:', error);
        res.status(500).json({ 
            error: 'Failed to fetch user role' 
        });
    }
}

module.exports = {
    mapStaffTypeToRole,
    syncEmployeeRole,
    syncAllEmployeeRoles,
    getUserRole,
    hasRole,
    requireRole,
    getCurrentUserRole
};
