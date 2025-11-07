#!/usr/bin/env node

/**
 * Generate a secure Admin API key for the MBH Staff Portal
 */

const crypto = require('crypto');

// Generate a secure random string
function generateSecureKey(length = 32) {
    return crypto.randomBytes(length).toString('base64url');
}

// Generate the new key
const newAdminKey = generateSecureKey(32);

console.log('===========================================');
console.log('NEW ADMIN API KEY GENERATED');
console.log('===========================================');
console.log();
console.log('New Admin API Key:');
console.log(newAdminKey);
console.log();
console.log('Steps to update:');
console.log();
console.log('1. Add to Railway environment variables:');
console.log('   Variable Name: ADMIN_API_KEY');
console.log('   Value: ' + newAdminKey);
console.log();
console.log('2. Update any monitoring scripts or tools that use the admin endpoints');
console.log();
console.log('3. Test the new key:');
console.log('   curl -H "X-Admin-Key: ' + newAdminKey + '" \\');
console.log('        https://mbh-production-f0d1.up.railway.app/api/admin/reminder-status');
console.log();
console.log('===========================================');
console.log('IMPORTANT: Keep this key secure and do not commit it to git!');
console.log('===========================================');
