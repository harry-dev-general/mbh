#!/usr/bin/env node

/**
 * Environment Variables Check Script
 * Run this to verify all required environment variables are set
 */

console.log('=== MBH Staff Portal Environment Check ===\n');

const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY',
    'AIRTABLE_API_KEY',
    'AIRTABLE_BASE_ID',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_FROM_NUMBER'
];

const optionalVars = [
    'ADMIN_API_KEY',
    'GOOGLE_MAPS_API_KEY',
    'RAILWAY_ENVIRONMENT',
    'NODE_ENV',
    'PORT'
];

let hasErrors = false;

console.log('Required Environment Variables:');
console.log('------------------------------');
requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
        console.log(`✅ ${varName}: Set (${value.substring(0, 20)}...)`);
    } else {
        console.log(`❌ ${varName}: NOT SET`);
        hasErrors = true;
    }
});

console.log('\nOptional Environment Variables:');
console.log('------------------------------');
optionalVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
        console.log(`✅ ${varName}: ${value}`);
    } else {
        console.log(`⚠️  ${varName}: Not set (using defaults)`);
    }
});

// Special checks
console.log('\nConfiguration Validation:');
console.log('------------------------');

// Check Supabase URL format
if (process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('.supabase.co')) {
    console.log('⚠️  SUPABASE_URL might be incorrect - should include .supabase.co');
}

// Check JWT format
if (process.env.SUPABASE_ANON_KEY) {
    try {
        const parts = process.env.SUPABASE_ANON_KEY.split('.');
        if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            console.log(`✅ SUPABASE_ANON_KEY is valid JWT (role: ${payload.role}, expires: ${new Date(payload.exp * 1000).toISOString()})`);
        } else {
            console.log('❌ SUPABASE_ANON_KEY is not a valid JWT format');
        }
    } catch (e) {
        console.log('❌ SUPABASE_ANON_KEY could not be decoded as JWT');
    }
}

console.log('\nSummary:');
console.log('--------');
if (hasErrors) {
    console.log('❌ Missing required environment variables!');
    console.log('\nTo fix this:');
    console.log('1. Go to your Railway dashboard');
    console.log('2. Navigate to your project > Variables');
    console.log('3. Add the missing environment variables');
    console.log('4. For Supabase keys, go to: https://supabase.com/dashboard > Your Project > Settings > API');
    process.exit(1);
} else {
    console.log('✅ All required environment variables are set');
}
