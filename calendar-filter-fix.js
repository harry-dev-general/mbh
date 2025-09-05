// Calendar Filter Fix - Only show PAID bookings with actual amounts
// Apply this logic to management-allocations.html and management-dashboard.html

// CURRENT FILTER (includes duplicates):
const filter = encodeURIComponent(`OR({Status}='PAID', {Status}='PART', {Status}='Confirmed', {Status}='Pending')`);

// IMPROVED FILTER (reduces duplicates):
// Option 1: Only PAID bookings
const filter = encodeURIComponent(`{Status}='PAID'`);

// Option 2: After fetching, filter client-side for amount > 0
bookingsData = bookingsData.filter(booking => {
    const status = booking.fields['Status'];
    const amount = booking.fields['Total Amount'] || 0;
    
    // Only show PAID bookings with actual amounts (exclude $0 unless ice bag)
    if (status === 'PAID') {
        const bookingItems = booking.fields['Booking Items'] || '';
        if (bookingItems === 'icebag') {
            return true; // Ice bags are legitimately $0
        }
        return amount > 0;
    }
    
    // Still show Confirmed and Pending as they're not duplicates
    return status === 'Confirmed' || status === 'Pending';
});
