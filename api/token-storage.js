// Token Storage Module - Persistent storage for magic link tokens
// Uses Airtable to store tokens instead of in-memory storage
// This ensures tokens survive server restarts and work across multiple instances

const axios = require('axios');
const crypto = require('crypto');

// Try to use file-based storage as fallback
let fileStorage;
try {
    fileStorage = require('./token-storage-file');
} catch (error) {
    console.log('File-based token storage not available');
}

// Airtable configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = 'applkAFOn2qxtu7tx';

// Magic Link Tokens table
// This table needs to be created in Airtable with the following fields:
// - Token (Single line text, Primary key)
// - Allocation ID (Single line text)
// - Employee ID (Single line text)
// - Action (Single line text)
// - Expires At (Date time)
// - Is Booking Allocation (Checkbox)
// - Role (Single line text)
// - Used (Checkbox)
// - Created At (Date time)
const TOKENS_TABLE_ID = process.env.TOKENS_TABLE_ID || 'tblTokens'; // Replace with actual table ID after creation

// Flag to track if we should use file storage
let useFileStorage = false;

// If Airtable is not configured properly, default to file storage
if (!AIRTABLE_API_KEY || TOKENS_TABLE_ID === 'tblTokens') {
    console.log('⚠️ Airtable token storage not configured, using file storage');
    useFileStorage = true;
}

/**
 * Create the Tokens table schema
 * This is the structure needed in Airtable
 */
const TOKENS_TABLE_SCHEMA = {
    name: 'Magic Link Tokens',
    description: 'Stores temporary tokens for shift response magic links',
    fields: [
        {
            name: 'Token',
            type: 'singleLineText',
            description: 'The unique token string'
        },
        {
            name: 'Allocation ID',
            type: 'singleLineText',
            description: 'The shift allocation or booking record ID'
        },
        {
            name: 'Employee ID',
            type: 'singleLineText',
            description: 'The employee record ID'
        },
        {
            name: 'Action',
            type: 'singleSelect',
            options: {
                choices: [
                    { name: 'accept' },
                    { name: 'deny' }
                ]
            }
        },
        {
            name: 'Expires At',
            type: 'dateTime',
            options: {
                dateFormat: { name: 'iso' },
                timeFormat: { name: '24hour' },
                timeZone: 'Australia/Sydney'
            }
        },
        {
            name: 'Is Booking Allocation',
            type: 'checkbox'
        },
        {
            name: 'Role',
            type: 'singleLineText',
            description: 'For booking allocations: Onboarding or Deloading'
        },
        {
            name: 'Used',
            type: 'checkbox'
        },
        {
            name: 'Created At',
            type: 'dateTime',
            options: {
                dateFormat: { name: 'iso' },
                timeFormat: { name: '24hour' },
                timeZone: 'Australia/Sydney'
            }
        }
    ]
};

/**
 * Generate and store a magic link token
 * @param {string} allocationId - The shift allocation record ID (or booking ID)
 * @param {string} employeeId - The employee record ID
 * @param {string} action - 'accept' or 'deny'
 * @param {boolean} isBookingAllocation - Whether this is a booking-specific allocation
 * @param {string} role - The role for booking allocations (Onboarding/Deloading)
 * @returns {Promise<string>} - The generated token
 */
async function generateAndStoreToken(allocationId, employeeId, action, isBookingAllocation = false, role = null) {
    // Check if we should use file storage (either forced or as fallback)
    if (useFileStorage && fileStorage) {
        return await fileStorage.generateAndStoreToken(allocationId, employeeId, action, isBookingAllocation, role);
    }
    
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours expiry
    const createdAt = new Date();
    
    try {
        // Store token in Airtable
        const response = await axios.post(
            `https://api.airtable.com/v0/${BASE_ID}/${TOKENS_TABLE_ID}`,
            {
                fields: {
                    'Token': token,
                    'Allocation ID': allocationId,
                    'Employee ID': employeeId,
                    'Action': action,
                    'Expires At': expiresAt.toISOString(),
                    'Is Booking Allocation': isBookingAllocation,
                    'Role': role || '',
                    'Used': false,
                    'Created At': createdAt.toISOString()
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log(`✅ Token stored in Airtable: ${token.substring(0, 8)}...`);
        return token;
        
    } catch (error) {
        // If Airtable fails and we have file storage, fall back to it
        if (error.response?.status === 404 && fileStorage) {
            console.log('⚠️ Airtable table not found, falling back to file storage');
            useFileStorage = true;
            return await fileStorage.generateAndStoreToken(allocationId, employeeId, action, isBookingAllocation, role);
        }
        
        console.error('Failed to store token in Airtable:', error.response?.data || error.message);
        throw new Error('Failed to generate magic link');
    }
}

/**
 * Validate a magic link token
 * @param {string} token - The token to validate
 * @returns {Promise<object|null>} - Token data if valid, null otherwise
 */
async function validateToken(token) {
    // Check if we should use file storage
    if (useFileStorage && fileStorage) {
        return await fileStorage.validateToken(token);
    }
    
    try {
        // Search for the token in Airtable
        const searchFormula = `AND({Token} = '${token}', NOT({Used}))`;
        const response = await axios.get(
            `https://api.airtable.com/v0/${BASE_ID}/${TOKENS_TABLE_ID}`,
            {
                params: {
                    filterByFormula: searchFormula,
                    maxRecords: 1
                },
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`
                }
            }
        );
        
        if (!response.data.records || response.data.records.length === 0) {
            console.log('Token not found or already used:', token.substring(0, 8) + '...');
            return null;
        }
        
        const record = response.data.records[0];
        const tokenData = record.fields;
        
        // Check if expired
        const expiresAt = new Date(tokenData['Expires At']);
        if (new Date() > expiresAt) {
            console.log('Token expired:', token.substring(0, 8) + '...');
            return null;
        }
        
        // Return token data with record ID for later update
        return {
            recordId: record.id,
            allocationId: tokenData['Allocation ID'],
            employeeId: tokenData['Employee ID'],
            action: tokenData['Action'],
            isBookingAllocation: tokenData['Is Booking Allocation'] || false,
            role: tokenData['Role'] || null,
            expiresAt: expiresAt
        };
        
    } catch (error) {
        // If Airtable fails and we have file storage, fall back to it
        if (error.response?.status === 404 && fileStorage) {
            console.log('⚠️ Airtable table not found, falling back to file storage for validation');
            useFileStorage = true;
            return await fileStorage.validateToken(token);
        }
        
        console.error('Error validating token:', error.response?.data || error.message);
        return null;
    }
}

/**
 * Mark a token as used
 * @param {string} token - The token to mark as used
 * @param {string} recordId - The Airtable record ID of the token
 */
async function markTokenAsUsed(token, recordId) {
    // Check if we should use file storage
    if (useFileStorage && fileStorage) {
        return await fileStorage.markTokenAsUsed(token, recordId);
    }
    
    try {
        await axios.patch(
            `https://api.airtable.com/v0/${BASE_ID}/${TOKENS_TABLE_ID}/${recordId}`,
            {
                fields: {
                    'Used': true
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log(`✅ Token marked as used: ${token.substring(0, 8)}...`);
        
    } catch (error) {
        // If Airtable fails and we have file storage, fall back to it
        if (error.response?.status === 404 && fileStorage) {
            console.log('⚠️ Using file storage to mark token as used');
            useFileStorage = true;
            return await fileStorage.markTokenAsUsed(token, recordId);
        }
        
        console.error('Failed to mark token as used:', error);
        // Don't throw - token was validated, just couldn't mark as used
    }
}

/**
 * Clean up expired tokens (maintenance function)
 * Should be called periodically to clean up old tokens
 */
async function cleanupExpiredTokens() {
    // Check if we should use file storage
    if (useFileStorage && fileStorage) {
        return await fileStorage.cleanupExpiredTokens();
    }
    
    try {
        // Find expired tokens
        const now = new Date().toISOString();
        const searchFormula = `IS_BEFORE({Expires At}, '${now}')`;
        
        const response = await axios.get(
            `https://api.airtable.com/v0/${BASE_ID}/${TOKENS_TABLE_ID}`,
            {
                params: {
                    filterByFormula: searchFormula,
                    fields: ['Token']
                },
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`
                }
            }
        );
        
        if (response.data.records && response.data.records.length > 0) {
            // Delete expired tokens in batches of 10
            const recordIds = response.data.records.map(r => r.id);
            
            for (let i = 0; i < recordIds.length; i += 10) {
                const batch = recordIds.slice(i, i + 10);
                
                await axios.delete(
                    `https://api.airtable.com/v0/${BASE_ID}/${TOKENS_TABLE_ID}`,
                    {
                        params: {
                            records: batch
                        },
                        headers: {
                            'Authorization': `Bearer ${AIRTABLE_API_KEY}`
                        }
                    }
                );
            }
            
            console.log(`🧹 Cleaned up ${recordIds.length} expired tokens`);
        }
        
    } catch (error) {
        // If Airtable fails and we have file storage, fall back to it
        if (error.response?.status === 404 && fileStorage) {
            console.log('⚠️ Using file storage for cleanup');
            useFileStorage = true;
            return await fileStorage.cleanupExpiredTokens();
        }
        
        console.error('Error cleaning up tokens:', error);
    }
}

module.exports = {
    generateAndStoreToken,
    validateToken,
    markTokenAsUsed,
    cleanupExpiredTokens,
    TOKENS_TABLE_SCHEMA
};
