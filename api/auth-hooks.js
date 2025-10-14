/**
 * Auth Hooks Module
 * Handles authentication-related events like login, role syncing, etc.
 */

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const roleManager = require('./role-manager');

// Airtable configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = 'applkAFOn2qxtu7tx';
const EMPLOYEES_TABLE_ID = 'tbltAE4NlNePvnkpY';

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Initialize Supabase client with service key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Handle user login - sync role and profile from Airtable
 * @param {Object} user - Supabase user object
 * @returns {Promise<Object>} - Login result with profile and role
 */
async function handleUserLogin(user) {
    try {
        console.log(`Processing login for user: ${user.email}`);
        
        // Find employee in Airtable by email
        const response = await axios.get(
            `https://api.airtable.com/v0/${BASE_ID}/${EMPLOYEES_TABLE_ID}`,
            {
                params: {
                    filterByFormula: `LOWER({Email}) = '${user.email.toLowerCase()}'`,
                    maxRecords: 1
                },
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.data.records || response.data.records.length === 0) {
            console.log(`No Airtable employee found for ${user.email}`);
            return {
                success: false,
                error: 'No employee record found'
            };
        }

        const employee = response.data.records[0];
        const airtableId = employee.id;
        const staffType = employee.fields['Staff Type'];
        const role = roleManager.mapStaffTypeToRole(staffType);

        // Check if staff profile exists
        const { data: existingProfile } = await supabase
            .from('staff_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

        let profile;
        if (existingProfile) {
            // Update existing profile
            const { data, error } = await supabase
                .from('staff_profiles')
                .update({
                    airtable_employee_id: airtableId,
                    full_name: employee.fields['Name'],
                    email: user.email.toLowerCase(),
                    mobile: employee.fields['Mobile'] || null,
                    role,
                    is_active: employee.fields['Active Roster'] === true,
                    last_login: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) {
                console.error('Error updating profile:', error);
                throw error;
            }
            profile = data;
        } else {
            // Create new profile
            const { data, error } = await supabase
                .from('staff_profiles')
                .insert({
                    user_id: user.id,
                    airtable_employee_id: airtableId,
                    full_name: employee.fields['Name'],
                    email: user.email.toLowerCase(),
                    mobile: employee.fields['Mobile'] || null,
                    role,
                    is_active: employee.fields['Active Roster'] === true,
                    onboarding_completed: true,
                    last_login: new Date().toISOString()
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating profile:', error);
                throw error;
            }
            profile = data;
        }

        console.log(`✅ Login processed for ${user.email} - Role: ${role}`);
        
        return {
            success: true,
            profile,
            role,
            staffType,
            permissions: {
                canViewAllStaff: role === 'admin' || role === 'manager',
                canManageAllocations: role === 'admin' || role === 'manager',
                canViewReports: role === 'admin' || role === 'manager',
                canManageSettings: role === 'admin',
                canAccessManagementDashboard: role === 'admin' || role === 'manager'
            }
        };

    } catch (error) {
        console.error('Error handling user login:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Express endpoint handler for login hook
 */
async function loginHookHandler(req, res) {
    try {
        const { user } = req.body;
        
        if (!user || !user.email) {
            return res.status(400).json({
                success: false,
                error: 'Invalid user data'
            });
        }

        const result = await handleUserLogin(user);
        res.json(result);

    } catch (error) {
        console.error('Login hook error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

module.exports = {
    handleUserLogin,
    loginHookHandler
};
