/**
 * Setup script to create the Reminder Tracking table in Airtable
 * Run this once to create the table structure needed for persistent reminder tracking
 */

const axios = require('axios');

// Configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID || 'applkAFOn2qxtu7tx';

async function createReminderTrackingTable() {
    console.log('🔧 Setting up Reminder Tracking Table...\n');

    if (!AIRTABLE_API_KEY) {
        console.error('❌ Error: AIRTABLE_API_KEY environment variable not set');
        process.exit(1);
    }

    try {
        // Create the table
        const response = await axios.post(
            `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`,
            {
                name: "SMS Reminder Tracking",
                description: "Tracks SMS reminders sent to prevent duplicates across multiple app instances",
                fields: [
                    {
                        name: "Key",
                        type: "singleLineText",
                        description: "Unique identifier for the reminder (e.g., allocation-recXXX)"
                    },
                    {
                        name: "Last Sent",
                        type: "dateTime",
                        options: {
                            dateFormat: {
                                name: "iso"
                            },
                            timeFormat: {
                                name: "24hour"
                            },
                            timeZone: "Australia/Sydney"
                        },
                        description: "When the reminder was last sent"
                    },
                    {
                        name: "Created At",
                        type: "dateTime",
                        options: {
                            dateFormat: {
                                name: "iso"
                            },
                            timeFormat: {
                                name: "24hour"
                            },
                            timeZone: "Australia/Sydney"
                        },
                        description: "When this tracking record was created"
                    },
                    {
                        name: "Updated At",
                        type: "dateTime",
                        options: {
                            dateFormat: {
                                name: "iso"
                            },
                            timeFormat: {
                                name: "24hour"
                            },
                            timeZone: "Australia/Sydney"
                        },
                        description: "When this record was last updated"
                    }
                ]
            },
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Table created successfully!');
        console.log(`\n📋 Table Details:`);
        console.log(`   Name: ${response.data.name}`);
        console.log(`   ID: ${response.data.id}`);
        console.log(`\n🔐 Add this to your Railway environment variables:`);
        console.log(`   REMINDER_TRACKER_TABLE_ID=${response.data.id}`);
        console.log(`\n✨ Done! The SMS reminder system will now prevent duplicates.`);

    } catch (error) {
        if (error.response) {
            console.error('❌ Error creating table:', error.response.data);
            
            if (error.response.status === 422) {
                console.log('\n💡 Tip: A table with this name might already exist.');
                console.log('   You can either:');
                console.log('   1. Use the existing table (find its ID in Airtable)');
                console.log('   2. Rename the existing table and run this script again');
            }
        } else {
            console.error('❌ Error:', error.message);
        }
        process.exit(1);
    }
}

// Run the setup
createReminderTrackingTable();
