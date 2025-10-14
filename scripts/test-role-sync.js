#!/usr/bin/env node

/**
 * Test Script for Role Synchronization
 * Run this script to test the role sync functionality
 * 
 * Usage: node scripts/test-role-sync.js [email]
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const roleManager = require('../api/role-manager');

async function testRoleSync() {
    console.log('🧪 Testing Role Synchronization...\n');
    
    const testEmail = process.argv[2];
    
    if (testEmail) {
        // Test single user sync
        console.log(`Testing role sync for: ${testEmail}`);
        
        try {
            // First, get current role
            const currentRole = await roleManager.getUserRole(testEmail);
            console.log(`Current role: ${currentRole || 'Not found'}`);
            
            // Get user permissions
            const hasManagement = await roleManager.hasRole(testEmail, ['admin', 'manager']);
            console.log(`Has management access: ${hasManagement}`);
            
            console.log('\n✅ Single user test completed');
        } catch (error) {
            console.error('❌ Error testing single user:', error.message);
        }
        
    } else {
        // Test bulk sync
        console.log('Testing bulk role synchronization...\n');
        
        try {
            const results = await roleManager.syncAllEmployeeRoles();
            
            console.log('📊 Sync Results:');
            console.log(`Total employees: ${results.total}`);
            console.log(`Successfully synced: ${results.synced}`);
            console.log(`Failed: ${results.failed}`);
            
            if (results.details && results.details.length > 0) {
                console.log('\n📋 Details:');
                results.details.forEach(detail => {
                    if (detail.success) {
                        console.log(`✅ ${detail.email}: ${detail.staffType} → ${detail.role}`);
                    } else {
                        console.log(`❌ ${detail.email}: ${detail.error}`);
                    }
                });
            }
            
            console.log('\n✅ Bulk sync test completed');
        } catch (error) {
            console.error('❌ Error during bulk sync:', error.message);
        }
    }
    
    // Test role mapping
    console.log('\n🔍 Testing role mapping:');
    console.log('Full Time → ' + roleManager.mapStaffTypeToRole('Full Time'));
    console.log('Casual → ' + roleManager.mapStaffTypeToRole('Casual'));
    console.log('Other → ' + roleManager.mapStaffTypeToRole('Other'));
}

// Run the test
testRoleSync().then(() => {
    console.log('\n✨ Test completed');
    process.exit(0);
}).catch(error => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
});
