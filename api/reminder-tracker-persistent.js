/**
 * Persistent Reminder Tracker using Airtable
 * Prevents duplicate SMS reminders across multiple app instances
 */

const axios = require('axios');

// Airtable configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID || 'applkAFOn2qxtu7tx';

// Create a new table for reminder tracking or use existing one
const REMINDER_TRACKER_TABLE_ID = process.env.REMINDER_TRACKER_TABLE_ID || 'tblReminderTracker';

class PersistentReminderTracker {
    constructor() {
        this.cache = new Map(); // Local cache for performance
        this.cacheExpiry = 5 * 60 * 1000; // 5 minute cache
    }

    /**
     * Get last reminder timestamp for a key
     */
    async get(key) {
        // Check cache first
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.fetchedAt < this.cacheExpiry) {
            return cached.timestamp;
        }

        try {
            // Fetch from Airtable
            const response = await axios.get(
                `https://api.airtable.com/v0/${BASE_ID}/${REMINDER_TRACKER_TABLE_ID}`,
                {
                    params: {
                        filterByFormula: `{Key} = '${key}'`,
                        maxRecords: 1
                    },
                    headers: {
                        'Authorization': `Bearer ${AIRTABLE_API_KEY}`
                    }
                }
            );

            if (response.data.records.length > 0) {
                const record = response.data.records[0];
                const timestamp = new Date(record.fields['Last Sent']).getTime();
                
                // Update cache
                this.cache.set(key, {
                    timestamp,
                    fetchedAt: Date.now(),
                    recordId: record.id
                });
                
                return timestamp;
            }

            return null;
        } catch (error) {
            console.error(`Error fetching reminder tracking for ${key}:`, error.message);
            // Fall back to cache if available
            return cached ? cached.timestamp : null;
        }
    }

    /**
     * Set last reminder timestamp for a key
     */
    async set(key, timestamp) {
        try {
            // Check if record exists
            const existing = this.cache.get(key);
            
            if (existing && existing.recordId) {
                // Update existing record
                await axios.patch(
                    `https://api.airtable.com/v0/${BASE_ID}/${REMINDER_TRACKER_TABLE_ID}/${existing.recordId}`,
                    {
                        fields: {
                            'Last Sent': new Date(timestamp).toISOString(),
                            'Updated At': new Date().toISOString()
                        }
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
            } else {
                // Create new record
                const response = await axios.post(
                    `https://api.airtable.com/v0/${BASE_ID}/${REMINDER_TRACKER_TABLE_ID}`,
                    {
                        records: [{
                            fields: {
                                'Key': key,
                                'Last Sent': new Date(timestamp).toISOString(),
                                'Created At': new Date().toISOString(),
                                'Updated At': new Date().toISOString()
                            }
                        }]
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (response.data.records.length > 0) {
                    // Update cache with new record ID
                    this.cache.set(key, {
                        timestamp,
                        fetchedAt: Date.now(),
                        recordId: response.data.records[0].id
                    });
                }
            }
        } catch (error) {
            console.error(`Error setting reminder tracking for ${key}:`, error.message);
            // Still update cache even if Airtable fails
            this.cache.set(key, {
                timestamp,
                fetchedAt: Date.now(),
                recordId: existing?.recordId
            });
        }
    }

    /**
     * Delete old reminder tracking entries
     */
    async cleanup(maxAge) {
        try {
            const cutoffDate = new Date(Date.now() - maxAge).toISOString();
            
            // Fetch old records
            const response = await axios.get(
                `https://api.airtable.com/v0/${BASE_ID}/${REMINDER_TRACKER_TABLE_ID}`,
                {
                    params: {
                        filterByFormula: `IS_BEFORE({Last Sent}, '${cutoffDate}')`
                    },
                    headers: {
                        'Authorization': `Bearer ${AIRTABLE_API_KEY}`
                    }
                }
            );

            if (response.data.records.length > 0) {
                // Delete in batches of 10
                const recordIds = response.data.records.map(r => r.id);
                for (let i = 0; i < recordIds.length; i += 10) {
                    const batch = recordIds.slice(i, i + 10);
                    await axios.delete(
                        `https://api.airtable.com/v0/${BASE_ID}/${REMINDER_TRACKER_TABLE_ID}`,
                        {
                            params: {
                                'records[]': batch
                            },
                            headers: {
                                'Authorization': `Bearer ${AIRTABLE_API_KEY}`
                            }
                        }
                    );
                }

                // Clear from cache
                for (const record of response.data.records) {
                    this.cache.delete(record.fields['Key']);
                }
            }
        } catch (error) {
            console.error('Error cleaning up reminder tracking:', error.message);
        }
    }

    /**
     * Get all entries (for debugging/monitoring)
     */
    async getAll() {
        try {
            const response = await axios.get(
                `https://api.airtable.com/v0/${BASE_ID}/${REMINDER_TRACKER_TABLE_ID}`,
                {
                    headers: {
                        'Authorization': `Bearer ${AIRTABLE_API_KEY}`
                    }
                }
            );

            return response.data.records.map(record => ({
                key: record.fields['Key'],
                lastSent: record.fields['Last Sent'],
                createdAt: record.fields['Created At'],
                updatedAt: record.fields['Updated At']
            }));
        } catch (error) {
            console.error('Error fetching all reminder tracking:', error.message);
            return [];
        }
    }
}

module.exports = PersistentReminderTracker;
