// Webhook Audit Log
// Logs all incoming Checkfront webhooks for debugging and data integrity verification
// Stores logs in Airtable for persistent audit trail

const axios = require('axios');

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'applkAFOn2qxtu7tx';

// Webhook Audit Log table - needs to be created in Airtable
// Fields: Timestamp, Webhook Type, Booking Code, Status, Payload (long text), Processing Result, Error
const WEBHOOK_LOG_TABLE = 'tblWebhookAuditLog'; // Create this table in Airtable

// In-memory log for when Airtable logging fails
const memoryLog = [];
const MAX_MEMORY_LOG_SIZE = 1000;

/**
 * Log a webhook event
 */
async function logWebhook(webhookData, result) {
    const timestamp = new Date().toISOString();
    const bookingCode = webhookData?.booking?.code || 'Unknown';
    const status = webhookData?.booking?.status || 'Unknown';

    const logEntry = {
        timestamp,
        bookingCode,
        status,
        success: result.success,
        action: result.action || 'processed',
        error: result.error || null,
        payload: JSON.stringify(webhookData).substring(0, 5000) // Truncate for storage
    };

    console.log(`📝 Webhook Log: ${bookingCode} - ${result.success ? '✅ Success' : '❌ Failed'}`);

    // Store in memory first (always succeeds)
    memoryLog.push(logEntry);
    if (memoryLog.length > MAX_MEMORY_LOG_SIZE) {
        memoryLog.shift(); // Remove oldest entry
    }

    // Try to log to Airtable (fire and forget)
    try {
        await logToAirtable(logEntry);
    } catch (error) {
        // Airtable logging failed - already in memory log
        console.warn('⚠️ Could not log webhook to Airtable:', error.message);
    }

    return logEntry;
}

/**
 * Log to Airtable webhook audit table
 */
async function logToAirtable(logEntry) {
    if (!AIRTABLE_API_KEY) {
        return; // Skip if not configured
    }

    try {
        await axios.post(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${WEBHOOK_LOG_TABLE}`,
            {
                fields: {
                    'Timestamp': logEntry.timestamp,
                    'Booking Code': logEntry.bookingCode,
                    'Status': logEntry.status,
                    'Processing Result': logEntry.success ? 'Success' : 'Failed',
                    'Action': logEntry.action,
                    'Error': logEntry.error || '',
                    'Payload': logEntry.payload
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
    } catch (error) {
        // Table might not exist - that's okay, we log to memory
        if (error.response?.status === 404) {
            // Table doesn't exist - only log once
            if (!logToAirtable.tableNotExistWarned) {
                console.log('ℹ️ Webhook audit log table not found in Airtable. Using memory log only.');
                console.log('   Create table "Webhook Audit Log" with fields: Timestamp, Booking Code, Status, Processing Result, Action, Error, Payload');
                logToAirtable.tableNotExistWarned = true;
            }
        }
        throw error;
    }
}

/**
 * Get recent webhook logs from memory
 */
function getRecentLogs(limit = 100) {
    return memoryLog.slice(-limit).reverse();
}

/**
 * Get logs for a specific booking code
 */
function getLogsForBooking(bookingCode) {
    return memoryLog.filter(log => log.bookingCode === bookingCode);
}

/**
 * Get failed webhook logs
 */
function getFailedLogs(limit = 50) {
    return memoryLog
        .filter(log => !log.success)
        .slice(-limit)
        .reverse();
}

/**
 * Get webhook statistics
 */
function getWebhookStats() {
    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const oneHourAgo = new Date(now - 60 * 60 * 1000);

    const last24h = memoryLog.filter(log => new Date(log.timestamp) > oneDayAgo);
    const lastHour = memoryLog.filter(log => new Date(log.timestamp) > oneHourAgo);

    return {
        totalLogged: memoryLog.length,
        maxSize: MAX_MEMORY_LOG_SIZE,
        last24h: {
            total: last24h.length,
            successful: last24h.filter(l => l.success).length,
            failed: last24h.filter(l => !l.success).length
        },
        lastHour: {
            total: lastHour.length,
            successful: lastHour.filter(l => l.success).length,
            failed: lastHour.filter(l => !l.success).length
        },
        oldestLog: memoryLog[0]?.timestamp || null,
        newestLog: memoryLog[memoryLog.length - 1]?.timestamp || null
    };
}

module.exports = {
    logWebhook,
    getRecentLogs,
    getLogsForBooking,
    getFailedLogs,
    getWebhookStats
};



