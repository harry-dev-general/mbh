# Development Environment Setup

**Last Updated**: October 10, 2025

## Overview

This guide covers setting up the development environment for the MBH Staff Portal, particularly after merging changes from the main branch that include security improvements.

## Required Environment Variables

The following environment variables must be set in your development environment:

### 1. Google Maps API Key (Required for Fleet Map)

**Error**: `Failed to load configuration: Error: Google Maps API key not configured on server`

**Solution**: Set the `GOOGLE_MAPS_API_KEY` environment variable.

```bash
# Create .env file in the project root
cp env.example .env

# Edit .env and add your Google Maps API key
GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key_here
```

### 2. Complete Environment Variables

```env
# Supabase Configuration
SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL_HERE
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_HERE

# Airtable Configuration
AIRTABLE_API_KEY=your_airtable_api_key_here

# Twilio Configuration (for SMS notifications)
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_FROM_NUMBER=+your_twilio_phone_number_here

# Google Maps Configuration
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Server Configuration
PORT=3000
NODE_ENV=development
```

## Quick Start

For immediate development setup, create a `.env` file with these values:

```bash
# Create .env file
cat > .env << EOF
# Supabase Configuration (Public keys - safe for development)
SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL_HERE
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_HERE

# Google Maps - REQUIRED FOR FLEET MAP
GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE

# Airtable - REQUIRED FOR ALL DATA
AIRTABLE_API_KEY=YOUR_AIRTABLE_API_KEY_HERE

# Optional for SMS features
TWILIO_ACCOUNT_SID=optional_for_development
TWILIO_AUTH_TOKEN=optional_for_development
TWILIO_FROM_NUMBER=+1234567890

# Server Configuration
PORT=3000
NODE_ENV=development
EOF
```

**Note**: You MUST replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` and `YOUR_AIRTABLE_API_KEY_HERE` with actual values for the app to work.

## Starting the Development Server

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Start the server with environment variables**:
   ```bash
   # Using npm
   npm start

   # Or directly with node
   node server.js
   ```

3. **Verify the server is running**:
   - Check console for: `Server running on port 3000`
   - Visit: http://localhost:3000

## Troubleshooting

### Google Maps Not Loading

If the fleet map shows an error:

1. **Check environment variable is set**:
   ```bash
   echo $GOOGLE_MAPS_API_KEY
   ```

2. **Verify API endpoint**:
   - Visit: http://localhost:3000/api/config
   - Should return JSON with `googleMapsApiKey` field populated

3. **Check browser console** for specific errors

### Syntax Errors After Merge

If you encounter syntax errors after merging from main:

1. **Check for merge conflicts**: Look for `<<<<<<<`, `=======`, `>>>>>>>` markers
2. **Verify function completeness**: Ensure all functions have proper opening/closing braces
3. **Run linting**: Check for syntax errors before committing

## Security Notes

### Why Environment Variables?

As of September 2025, the Google Maps API key was moved from client-side code to server-side environment variables for security:

- **Before**: API key was hardcoded in HTML files (security risk)
- **After**: API key is stored server-side and served via `/api/config` endpoint

This prevents API key exposure in public repositories and client-side code.

### Production vs Development

- **Development**: Can use `.env` file for convenience
- **Production**: Must use proper environment variable management (Railway, Heroku, etc.)

## Common Issues and Solutions

### Issue 1: "Cannot read properties of null"
**Cause**: JavaScript trying to access config before it's loaded  
**Solution**: Ensure all config-dependent code waits for `loadConfig()` promise

### Issue 2: CORS errors on API calls
**Cause**: Direct client-side API calls instead of using proxy  
**Solution**: Use the `airtableFetch()` function from config.js

### Issue 3: Multiple Google Maps script loads
**Cause**: Race condition in script loading  
**Solution**: Already fixed with proper promise-based loading

## Next Steps

1. Set up your `.env` file with all required variables
2. Start the development server
3. Test all functionality:
   - [ ] Fleet map loads correctly
   - [ ] Weekly schedule shows current week
   - [ ] SMS notifications work (requires Twilio config)
   - [ ] All API calls succeed

## Need Help?

- Check existing documentation in `/docs`
- Review recent commits for context
- Contact the development team for API keys
