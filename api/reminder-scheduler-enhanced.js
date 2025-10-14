// Enhanced Reminder Status Update Function with Retry Logic and Typecast
// This module provides a more robust approach to updating Airtable records

const axios = require('axios');

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

/**
 * Sleep for specified milliseconds
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Enhanced update function with typecast parameter and retry logic
 * @param {string} baseId - Airtable base ID
 * @param {string} tableId - Airtable table ID
 * @param {string} recordId - Record ID to update
 * @param {object} fields - Fields to update
 * @param {string} apiKey - Airtable API key
 * @param {number} retryCount - Current retry attempt (internal use)
 */
async function updateReminderStatusEnhanced(baseId, tableId, recordId, fields, apiKey, retryCount = 0) {
    try {
        const response = await axios.patch(
            `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`,
            { 
                fields,
                typecast: true  // This helps Airtable coerce values to correct types
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log(`✅ Successfully updated reminder status for record ${recordId}`);
        return response.data;
        
    } catch (error) {
        const isRetryable = error.response && 
            (error.response.status === 422 || // Unprocessable Entity
             error.response.status === 429 || // Rate Limited
             error.response.status >= 500);   // Server Errors
        
        if (isRetryable && retryCount < MAX_RETRIES) {
            const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount); // Exponential backoff
            console.warn(`⚠️ Retryable error (${error.response?.status}), attempt ${retryCount + 1}/${MAX_RETRIES}. Retrying in ${delay}ms...`);
            
            if (error.response?.data) {
                console.error('Airtable error details:', JSON.stringify(error.response.data, null, 2));
            }
            
            await sleep(delay);
            return updateReminderStatusEnhanced(baseId, tableId, recordId, fields, apiKey, retryCount + 1);
        }
        
        // Log detailed error information
        console.error(`❌ Failed to update reminder status for record ${recordId}:`);
        console.error(`   Status: ${error.response?.status || 'No response'}`);
        console.error(`   Message: ${error.message}`);
        
        if (error.response?.data) {
            console.error('   Airtable error response:', JSON.stringify(error.response.data, null, 2));
            
            // Special handling for 422 errors
            if (error.response.status === 422) {
                console.error('   422 Error Tips:');
                console.error('   - Verify all field names match exactly (case-sensitive)');
                console.error('   - Ensure checkbox fields use boolean true/false');
                console.error('   - Check that the fields exist in Airtable');
                console.error('   - Verify API key has write permissions');
            }
        }
        
        throw error; // Re-throw to prevent sending SMS if update fails
    }
}

/**
 * Verify field exists in Airtable table before updating
 * This helps prevent 422 errors from missing fields
 */
async function verifyFieldsExist(baseId, tableId, fieldNames, apiKey) {
    try {
        // Get table schema
        const response = await axios.get(
            `https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            }
        );
        
        const table = response.data.tables.find(t => t.id === tableId);
        if (!table) {
            throw new Error(`Table ${tableId} not found`);
        }
        
        const tableFields = table.fields.map(f => f.name);
        const missingFields = fieldNames.filter(name => !tableFields.includes(name));
        
        if (missingFields.length > 0) {
            console.error(`❌ Missing fields in Airtable: ${missingFields.join(', ')}`);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error verifying fields:', error.message);
        // Don't fail if we can't verify - proceed with update attempt
        return true;
    }
}

module.exports = {
    updateReminderStatusEnhanced,
    verifyFieldsExist
};
