// Automatic Checkfront-Airtable Reconciliation Scheduler
// Runs daily to catch any bookings missed by webhooks
// This is a critical data integrity safeguard

const axios = require('axios');
const checkfrontApi = require('./checkfront-api');

// Configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'applkAFOn2qxtu7tx';
const BOOKINGS_TABLE_ID = 'tblRe0cDmK3bG2kPf';

// Twilio for notifications
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;
const ADMIN_SMS_RECIPIENT = process.env.ADMIN_SMS_RECIPIENT || process.env.SMS_RECIPIENT || '+61414960734';

// Scheduler state
let reconciliationInterval = null;
let lastReconciliationRun = null;
let lastReconciliationResult = null;

/**
 * Send admin notification SMS
 */
async function sendAdminAlert(message) {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
        console.log('⚠️ Admin SMS not sent - Twilio credentials not configured');
        return false;
    }

    try {
        const authString = `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`;
        const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;

        await axios.post(
            `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
            new URLSearchParams({
                'From': TWILIO_FROM_NUMBER,
                'To': ADMIN_SMS_RECIPIENT,
                'Body': message
            }),
            {
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        console.log('✅ Admin alert SMS sent');
        return true;
    } catch (error) {
        console.error('❌ Admin SMS send error:', error.message);
        return false;
    }
}

/**
 * Get Airtable bookings for a date range
 */
async function getAirtableBookings(startDate, endDate) {
    const allRecords = [];
    let offset = null;

    do {
        const params = {
            filterByFormula: `AND(
                OR(IS_SAME({Booking Date}, '${startDate}'), IS_AFTER({Booking Date}, '${startDate}')),
                OR(IS_SAME({Booking Date}, '${endDate}'), IS_BEFORE({Booking Date}, '${endDate}'))
            )`,
            pageSize: 100,
            fields: ['Booking Code', 'Status']
        };

        if (offset) {
            params.offset = offset;
        }

        try {
            const response = await axios.get(
                `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${BOOKINGS_TABLE_ID}`,
                {
                    headers: {
                        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    params
                }
            );

            allRecords.push(...response.data.records);
            offset = response.data.offset;
        } catch (error) {
            console.error('Airtable fetch error:', error.message);
            throw error;
        }
    } while (offset);

    return allRecords;
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

/**
 * Run the reconciliation check
 * Compares bookings from the last N days
 */
async function runReconciliation(daysBack = 14) {
    console.log('\n🔄 Running scheduled Checkfront-Airtable reconciliation...');

    // Check if Checkfront API is configured
    if (!checkfrontApi.isConfigured()) {
        console.log('⚠️ Checkfront API not configured - skipping reconciliation');
        return {
            success: false,
            error: 'Checkfront API not configured'
        };
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);

    console.log(`📅 Checking bookings from ${startDateStr} to ${endDateStr}...`);

    try {
        // Fetch from both systems
        const [checkfrontBookings, airtableRecords] = await Promise.all([
            checkfrontApi.getBookings(startDateStr, endDateStr),
            getAirtableBookings(startDateStr, endDateStr)
        ]);

        // Create lookup sets
        const airtableCodes = new Set(
            airtableRecords
                .map(r => r.fields['Booking Code'])
                .filter(Boolean)
        );

        // Find missing bookings (in Checkfront but not Airtable)
        // Only consider PAID and PART status as important
        const missingBookings = checkfrontBookings.filter(booking => {
            const status = booking.status || booking.status_id;
            const isPaidOrPart = status === 'PAID' || status === 'PART';
            return isPaidOrPart && !airtableCodes.has(booking.code);
        });

        // Log results
        console.log(`📊 Checkfront: ${checkfrontBookings.length} bookings`);
        console.log(`📊 Airtable: ${airtableRecords.length} bookings`);
        console.log(`⚠️ Missing in Airtable: ${missingBookings.length} PAID/PART bookings`);

        lastReconciliationRun = new Date();
        lastReconciliationResult = {
            checkfrontCount: checkfrontBookings.length,
            airtableCount: airtableRecords.length,
            missingCount: missingBookings.length,
            missingBookings: missingBookings.map(b => ({
                code: b.code,
                status: b.status || b.status_id,
                customer: b.customer_name,
                total: b.total
            }))
        };

        // If there are missing bookings, send an alert and attempt auto-sync
        if (missingBookings.length > 0) {
            console.log('\n🚨 Missing bookings detected:');
            missingBookings.forEach(b => {
                console.log(`   - ${b.code}: ${b.customer_name} ($${b.total})`);
            });

            // Send admin SMS alert
            const alertMessage = `⚠️ MBH Booking Alert\n\n${missingBookings.length} booking(s) missing from Airtable:\n` +
                missingBookings.slice(0, 3).map(b => `• ${b.code}`).join('\n') +
                (missingBookings.length > 3 ? `\n...and ${missingBookings.length - 3} more` : '') +
                `\n\nVisit reconciliation tool to sync.`;

            await sendAdminAlert(alertMessage);

            // Attempt auto-sync for missing bookings
            const syncResults = await autoSyncMissingBookings(missingBookings);
            lastReconciliationResult.syncResults = syncResults;
        }

        return {
            success: true,
            ...lastReconciliationResult
        };

    } catch (error) {
        console.error('❌ Reconciliation error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Auto-sync missing bookings to Airtable
 */
async function autoSyncMissingBookings(missingBookings) {
    console.log(`\n📥 Auto-syncing ${missingBookings.length} missing bookings...`);

    const results = {
        synced: [],
        failed: []
    };

    for (const booking of missingBookings) {
        try {
            // Prepare Airtable record from Checkfront data
            const recordData = {
                'Booking Code': booking.code,
                'Customer Name': booking.customer_name || 'Unknown',
                'Customer Email': booking.customer_email || '',
                'Status': booking.status || booking.status_id || 'PAID',
                'Total Amount': parseFloat(booking.total) || 0,
                'Booking Date': booking.start_date 
                    ? new Date(booking.start_date * 1000).toISOString().split('T')[0]
                    : new Date().toISOString().split('T')[0],
                'Created Date': booking.created_date
                    ? new Date(booking.created_date * 1000).toISOString().split('T')[0]
                    : new Date().toISOString().split('T')[0]
            };

            // Add start/end times if available
            if (booking.start_date) {
                const startDt = new Date(booking.start_date * 1000);
                recordData['Start Time'] = startDt.toLocaleTimeString('en-AU', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                    timeZone: 'Australia/Sydney'
                });
            }

            if (booking.finish_date || booking.end_date) {
                const endDt = new Date((booking.finish_date || booking.end_date) * 1000);
                recordData['Finish Time'] = endDt.toLocaleTimeString('en-AU', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                    timeZone: 'Australia/Sydney'
                });
            }

            // Create record in Airtable
            const response = await axios.post(
                `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${BOOKINGS_TABLE_ID}`,
                { fields: recordData },
                {
                    headers: {
                        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log(`   ✅ Synced: ${booking.code}`);
            results.synced.push({
                code: booking.code,
                airtableId: response.data.id
            });

        } catch (error) {
            console.error(`   ❌ Failed to sync ${booking.code}:`, error.message);
            results.failed.push({
                code: booking.code,
                error: error.message
            });
        }
    }

    console.log(`\n📊 Sync complete: ${results.synced.length} synced, ${results.failed.length} failed`);
    return results;
}

/**
 * Start the reconciliation scheduler
 * Runs at startup and then every 6 hours
 */
function startReconciliationScheduler() {
    console.log('🚀 Starting Checkfront-Airtable reconciliation scheduler...');
    console.log('   - Running every 6 hours');
    console.log('   - Checking last 14 days of bookings');
    console.log('   - Auto-syncing missing PAID/PART bookings');

    // Run immediately on startup (after a short delay to let other services initialize)
    setTimeout(() => {
        runReconciliation(14).catch(err => {
            console.error('Initial reconciliation failed:', err.message);
        });
    }, 30000); // 30 second delay on startup

    // Then run every 6 hours
    reconciliationInterval = setInterval(() => {
        runReconciliation(14).catch(err => {
            console.error('Scheduled reconciliation failed:', err.message);
        });
    }, 6 * 60 * 60 * 1000); // 6 hours

    console.log('✅ Reconciliation scheduler started');
}

/**
 * Stop the reconciliation scheduler
 */
function stopReconciliationScheduler() {
    if (reconciliationInterval) {
        clearInterval(reconciliationInterval);
        reconciliationInterval = null;
        console.log('🛑 Reconciliation scheduler stopped');
    }
}

/**
 * Get the status of the reconciliation scheduler
 */
function getReconciliationStatus() {
    return {
        active: !!reconciliationInterval,
        lastRun: lastReconciliationRun,
        lastResult: lastReconciliationResult,
        config: {
            checkInterval: '6 hours',
            daysToCheck: 14,
            autoSync: true,
            adminSmsEnabled: !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM_NUMBER)
        }
    };
}

module.exports = {
    startReconciliationScheduler,
    stopReconciliationScheduler,
    runReconciliation,
    getReconciliationStatus
};



