// Script to create Shift Allocations table in Airtable
// Run this in Airtable's scripting block or adapt for API

const BASE_ID = 'applkAFOn2qxtu7tx'; // MBH Bookings Operation

// Table structure for Shift Allocations
const shiftAllocationsTable = {
    name: "Shift Allocations",
    description: "Hourly staff allocations for general work and specific bookings",
    fields: [
        {
            name: "Shift ID",
            type: "formula",
            options: {
                formula: 'CONCATENATE(DATETIME_FORMAT({Shift Date}, "YYYY-MM-DD"), "-", {Employee}, "-", {Start Time})'
            }
        },
        {
            name: "Employee",
            type: "multipleRecordLinks",
            options: {
                linkedTableId: "tbltAE4NlNePvnkpY" // Employee Details table
            }
        },
        {
            name: "Shift Date",
            type: "date",
            options: {
                dateFormat: {
                    name: "iso",
                    format: "YYYY-MM-DD"
                }
            }
        },
        {
            name: "Start Time",
            type: "singleLineText", // Store as "09:00" format
        },
        {
            name: "End Time",
            type: "singleLineText", // Store as "17:00" format
        },
        {
            name: "Shift Type",
            type: "singleSelect",
            options: {
                choices: [
                    { name: "General Operations", color: "blueBright" },
                    { name: "Booking Specific", color: "greenBright" },
                    { name: "Maintenance", color: "orangeBright" },
                    { name: "Training", color: "purpleBright" },
                    { name: "Admin", color: "grayBright" }
                ]
            }
        },
        {
            name: "Booking",
            type: "multipleRecordLinks",
            options: {
                linkedTableId: "tblRe0cDmK3bG2kPf" // Bookings Dashboard table
            }
        },
        {
            name: "Role",
            type: "singleSelect",
            options: {
                choices: [
                    { name: "Onboarding", color: "greenBright" },
                    { name: "Deloading", color: "orangeBright" },
                    { name: "Support Staff", color: "blueBright" },
                    { name: "Dock Operations", color: "cyanBright" },
                    { name: "Customer Service", color: "pinkBright" }
                ]
            }
        },
        {
            name: "Status",
            type: "singleSelect",
            options: {
                choices: [
                    { name: "Scheduled", color: "blueBright" },
                    { name: "Confirmed", color: "greenBright" },
                    { name: "In Progress", color: "yellowBright" },
                    { name: "Completed", color: "grayBright" },
                    { name: "Cancelled", color: "redBright" }
                ]
            }
        },
        {
            name: "Notes",
            type: "multilineText"
        },
        {
            name: "Created By",
            type: "createdBy"
        },
        {
            name: "Created Time",
            type: "createdTime"
        },
        {
            name: "Last Modified",
            type: "lastModifiedTime"
        }
    ]
};

console.log("Shift Allocations Table Structure:", shiftAllocationsTable);
