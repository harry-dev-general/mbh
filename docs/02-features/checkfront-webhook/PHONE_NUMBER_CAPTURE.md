# Phone Number Capture in Checkfront Webhook

**Date Implemented**: September 26, 2025  
**Version**: 1.0

## Overview

Added phone number capture functionality to the Checkfront webhook handler to store customer phone numbers in the Bookings Dashboard table in Airtable.

## Implementation Details

### Airtable Field

- **Field Name**: "Phone Number"
- **Field Type**: Single line text
- **Table**: Bookings Dashboard (tblRe0cDmK3bG2kPf)

### Code Changes

Updated `/api/checkfront-webhook.js` to extract and store phone numbers:

1. **Phone Number Extraction** (Line 234):
   ```javascript
   const customerPhone = customer.phone || null;
   ```

2. **Added to Airtable Record** (Line 310):
   ```javascript
   const recordData = {
       'Booking Code': bookingCode,
       'Customer Name': customerName,
       'Customer Email': customerEmail,
       'Phone Number': customerPhone,  // New field
       'Status': bookingStatus,
       // ... other fields
   };
   ```

3. **Added to Debug Logging** (Line 326):
   ```javascript
   console.log(`  Phone: ${customerPhone || 'Not provided'}`);
   ```

## Webhook Payload Structure

The phone number is available in the Checkfront webhook payload at:
- `booking.customer.phone`
- Also available at: `booking.fields.customer_phone` and `booking.meta.customer_phone`

Example format: `"+61434827100"`

## Testing

To test the phone number capture:

1. Create a test booking in Checkfront with a phone number
2. Monitor Railway logs for the webhook processing
3. Verify the phone number appears in the console summary
4. Check the Airtable Bookings Dashboard for the populated "Phone Number" field

## Benefits

1. **Customer Contact**: Direct phone contact information for bookings
2. **SMS Communications**: Phone numbers available for future SMS features
3. **Data Completeness**: More complete customer records

## Backward Compatibility

- Existing bookings without phone numbers will continue to work
- The field will be `null` if no phone number is provided
- No breaking changes to existing functionality

## Future Enhancements

1. **Phone Number Validation**: Add validation for Australian phone number formats
2. **SMS Integration**: Use phone numbers for booking confirmations
3. **Customer Matching**: Match customers by phone number for repeat bookings
