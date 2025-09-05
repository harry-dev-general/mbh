// Fix $0 PAID Bookings
// Run this in Airtable to identify PAID bookings with $0 that need amount updates

const bookingsTable = base.getTable('Bookings Dashboard');

// Get all PAID bookings with $0
const query = await bookingsTable.selectRecordsAsync({
    fields: ['Booking Code', 'Customer Name', 'Status', 'Total Amount', 'Booking Items', 'Booking Date', 'Duration'],
    filterByFormula: `AND({Status}='PAID', {Total Amount}=0)`
});

console.log('🔍 PAID Bookings with $0 Amount:\n');

// Group by booking type
const boatBookings = [];
const iceBagBookings = [];
const otherBookings = [];

for (const record of query.records) {
    const bookingItems = record.getCellValueAsString('Booking Items');
    const booking = {
        code: record.getCellValueAsString('Booking Code'),
        customer: record.getCellValueAsString('Customer Name'),
        date: record.getCellValueAsString('Booking Date'),
        items: bookingItems,
        duration: record.getCellValueAsString('Duration')
    };
    
    if (bookingItems === 'icebag') {
        iceBagBookings.push(booking);
    } else if (bookingItems.includes('boat') || bookingItems.includes('personbbq')) {
        boatBookings.push(booking);
    } else {
        otherBookings.push(booking);
    }
}

// Display boat bookings that should have amounts
if (boatBookings.length > 0) {
    console.log('🚤 BOAT BOOKINGS NEEDING AMOUNT UPDATE:');
    console.log('(These should have actual rental amounts)\n');
    
    for (const booking of boatBookings) {
        console.log(`${booking.code} - ${booking.customer}`);
        console.log(`  Date: ${booking.date}`);
        console.log(`  Item: ${booking.items}`);
        console.log(`  Duration: ${booking.duration}`);
        
        // Suggest amount based on booking type
        let suggestedAmount = 0;
        if (booking.items.includes('fullday')) {
            suggestedAmount = booking.items.includes('12person') ? 770 : 330;
        } else if (booking.duration.includes('4 hours')) {
            suggestedAmount = booking.items.includes('12person') ? 550 : 250;
        }
        
        if (suggestedAmount > 0) {
            console.log(`  💡 Suggested amount: $${suggestedAmount}`);
        }
        console.log('');
    }
}

// Display ice bag bookings (legitimately $0)
if (iceBagBookings.length > 0) {
    console.log('\n🧊 ICE BAG BOOKINGS (Correctly $0):');
    for (const booking of iceBagBookings) {
        console.log(`${booking.code} - ${booking.customer} (${booking.date})`);
    }
}

// Display other bookings
if (otherBookings.length > 0) {
    console.log('\n❓ OTHER BOOKINGS:');
    for (const booking of otherBookings) {
        console.log(`${booking.code} - ${booking.customer}`);
        console.log(`  Item: ${booking.items}`);
    }
}

console.log(`\n📊 SUMMARY:`);
console.log(`  Boat bookings needing amounts: ${boatBookings.length}`);
console.log(`  Ice bag bookings (correct): ${iceBagBookings.length}`);
console.log(`  Other bookings: ${otherBookings.length}`);
console.log(`  Total $0 PAID bookings: ${query.records.length}`);
