/**
 * Test Supabase Authentication
 * This script tests various JWT verification approaches
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://etkugeooigiwahikrmzr.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0a3VnZW9vaWdpd2FoaWtybXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MDI0OTcsImV4cCI6MjA2ODM3ODQ5N30.OPIYLsnPNNF7dP3SDCODIurzaa3X_Q3xEhfPO3rLJxU';

console.log('=== Supabase Auth Test ===');
console.log('SUPABASE_URL:', SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY.substring(0, 50) + '...');
console.log('Environment Variables:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);
console.log('- SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'Set' : 'Not set');

async function testAuth() {
    try {
        // Test 1: Create a client and test anonymous access
        console.log('\n1. Testing anonymous access...');
        const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { data: anonSession, error: anonError } = await anonClient.auth.getSession();
        
        if (anonError) {
            console.error('Anonymous access error:', anonError);
        } else {
            console.log('Anonymous access successful');
        }

        // Test 2: Test signing in with email/password
        console.log('\n2. Testing email/password login...');
        const email = 'harry@priceoffice.com.au';
        const password = 'password';
        
        const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
            email,
            password
        });
        
        if (signInError) {
            console.error('Sign in error:', signInError);
            return;
        }
        
        console.log('Sign in successful!');
        console.log('User:', signInData.user.email);
        console.log('Session exists:', !!signInData.session);
        
        if (signInData.session) {
            const token = signInData.session.access_token;
            console.log('Token length:', token.length);
            console.log('Token preview:', token.substring(0, 50) + '...');
            
            // Test 3: Verify the token using different approaches
            console.log('\n3. Testing JWT verification approaches...');
            
            // Approach A: Create client with auth header
            console.log('\nApproach A: Client with auth header');
            const clientA = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            });
            
            const { data: userA, error: errorA } = await clientA.auth.getUser();
            if (errorA) {
                console.error('Approach A failed:', errorA);
            } else {
                console.log('Approach A success:', userA.user.email);
            }
            
            // Approach B: Pass token to getUser
            console.log('\nApproach B: Pass token to getUser');
            const clientB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            const { data: userB, error: errorB } = await clientB.auth.getUser(token);
            if (errorB) {
                console.error('Approach B failed:', errorB);
            } else {
                console.log('Approach B success:', userB.user.email);
            }
            
            // Test 4: Test the actual server endpoint
            console.log('\n4. Testing server endpoints...');
            const fetch = require('node-fetch');
            const baseUrl = 'http://localhost:8080';
            
            // Test simple endpoint
            try {
                const response = await fetch(`${baseUrl}/api/auth/test-jwt`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                console.log('Simple endpoint test:', response.status, data);
            } catch (error) {
                console.log('Simple endpoint test failed (server may not be running):', error.message);
            }
            
            // Test permissions endpoint
            try {
                const response = await fetch(`${baseUrl}/api/user/permissions`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                console.log('Permissions endpoint test:', response.status, data);
            } catch (error) {
                console.log('Permissions endpoint test failed (server may not be running):', error.message);
            }
            
            // Sign out
            await anonClient.auth.signOut();
            console.log('\nSigned out successfully');
        }
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run the test
testAuth();
