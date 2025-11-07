# Environment Variables Setup

**Important**: The following environment variables must be set for the vessel maintenance, SMS features, and map functionality to work.

## Required Environment Variables

### Airtable API
```bash
AIRTABLE_API_KEY=your_airtable_api_key_here
```

### Twilio (for SMS in Airtable scripts)
```bash
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+your_twilio_phone_number
```

### Google Maps (for fleet tracking and vessel locations)
```bash
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**Note**: See [`GOOGLE_MAPS_API_KEY_SETUP.md`](./GOOGLE_MAPS_API_KEY_SETUP.md) for detailed setup instructions.

## Where to Set These

### For Local Development
Create a `.env` file in the project root:
```
AIRTABLE_API_KEY=patXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### For Production (Railway)
Set these in your Railway project settings under "Variables".

### In Airtable Scripts
For the SMS script, you'll need to manually update the credentials in the Airtable automation script editor:
```javascript
// Replace these with your actual values
let twilioSid = 'YOUR_TWILIO_ACCOUNT_SID';
let twilioToken = 'YOUR_TWILIO_AUTH_TOKEN';
let fromNumber = 'YOUR_TWILIO_PHONE_NUMBER';
```

## Security Note
- Never commit credentials to git
- Always use environment variables in production code
- Rotate API keys regularly
