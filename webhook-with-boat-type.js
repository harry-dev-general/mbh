// Enhanced Webhook Script with Boat Type Field
// Add this section to your existing webhook automation script

// After getting bookingItems (around line 22)
let bookingItems = inputConfig['bookingItems'] || inputConfig['items'] || '';

// NEW: Determine booked boat type from SKU
let bookedBoatType = null;
if (bookingItems) {
    const itemsLower = bookingItems.toLowerCase();
    if (itemsLower.includes('12personbbqboat')) {
        bookedBoatType = '12 Person BBQ Boat';
    } else if (itemsLower.includes('8personbbqboat')) {
        bookedBoatType = '8 Person BBQ Boat';
    } else if (itemsLower.includes('4personpolycraft')) {
        bookedBoatType = '4 Person Polycraft';
    }
}

// When preparing fields to create/update (around line 140)
// Add the boat type to the fields object
let fields = {
    'Customer Name': customerName,
    'Customer Email': customerEmail,
    'Booking Code': bookingCode,
    'Booking Date': formatDateAEST(startDateTime),
    'End Date': formatDateAEST(endDateTime),
    'Created Date': formatDateAEST(createdDateTime),
    'Start Time': formatTimeAEST(startDateTime),
    'Finish Time': formatTimeAEST(endDateTime),
    'Status': bookingStatus,
    'Total Amount': totalAmount,
    'Booking Items': bookingItems,
    'Duration': bookingDurationFormatted,
    // NEW FIELD - uncomment when added to Airtable:
    // 'Booked Boat Type': bookedBoatType
};

// Log the boat type for debugging
console.log(`📚 Booking items: ${bookingItems}`);
console.log(`🚤 Detected boat type: ${bookedBoatType || 'None'}`);

// Output for use in subsequent automation steps
output.set('bookedBoatType', bookedBoatType);

// Rest of the script continues as normal...
