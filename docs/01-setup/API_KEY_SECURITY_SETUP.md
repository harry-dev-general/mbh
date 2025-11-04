# API Key Security Setup Guide

**Created**: November 2025  
**Purpose**: Document secure API key management for MBH Staff Portal

## Overview

This guide documents the secure setup of API keys following the November 2025 security audit that discovered exposed credentials in the codebase.

## Required Environment Variables

### Supabase Configuration

```env
# Project URL (remains constant)
SUPABASE_URL=https://etkugeooigiwahikrmzr.supabase.co

# Modern API Keys (Recommended after key rotation)
SUPABASE_ANON_KEY=sb_publishable_YIKA2xZ2I2ItkaJgxipoZg_3_5HkyTx  # Or new JWT-based anon key
SUPABASE_SERVICE_KEY=<secret key from Supabase dashboard>

# Legacy keys format (being phased out)
# SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Airtable Configuration

```env
AIRTABLE_API_KEY=<new personal access token>  # Format: patXXXXXX.hash
AIRTABLE_BASE_ID=applkAFOn2qxtu7tx
```

### Other Services

```env
# Twilio (for SMS)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+your_number

# Square (for payments)
SQUARE_ACCESS_TOKEN=your_access_token
SQUARE_APPLICATION_ID=your_app_id
SQUARE_WEBHOOK_SIGNATURE_KEY=your_webhook_key
SQUARE_ENVIRONMENT=sandbox  # or production

# Google Maps
GOOGLE_MAPS_API_KEY=your_maps_key

# Admin
ADMIN_API_KEY=<generate secure random string>  # Never use default values
```

## Security Architecture

### Server-Side Configuration

The application uses a secure `/api/config` endpoint to serve necessary public keys to the frontend:

```javascript
// server.js - /api/config endpoint
app.get('/api/config', authMiddlewareV2, async (req, res) => {
    // Validates environment variables
    // Returns only public keys (never service/secret keys)
    // Requires authentication
});
```

### Frontend Configuration Loading

All frontend HTML pages now load configuration dynamically:

```javascript
// Pattern used across all HTML files
let AIRTABLE_API_KEY = null;
let SUPABASE_URL = null;
let SUPABASE_ANON_KEY = null;

async function loadConfig() {
    const response = await fetch('/api/config');
    const config = await response.json();
    // Initialize services with loaded config
}
```

## Railway Deployment

### Setting Environment Variables

1. Navigate to Railway project dashboard
2. Go to Variables tab
3. Add each required variable
4. Railway auto-deploys on variable changes

### Verification

Check deployment health:
- `/api/health` endpoint should return 200
- Authentication should work
- No hardcoded keys in browser console

## Key Rotation Process

### When to Rotate Keys

- Immediately if exposed in git history
- Periodically as security practice
- After team member leaves
- If suspicious activity detected

### Supabase Key Rotation

1. **JWT Signing Keys Method** (Recommended):
   - Zero downtime
   - Go to Settings → Authentication → JWT Keys
   - Create new signing key
   - Rotate keys
   - Update Railway with new API keys

2. **Legacy JWT Secret** (Not recommended):
   - Causes user logout
   - More disruptive

### Airtable Key Rotation

1. Go to https://airtable.com/account
2. Generate new personal access token
3. Update Railway immediately
4. Delete old token

## Security Checklist

- [ ] No API keys in source code
- [ ] All keys in Railway environment variables
- [ ] `.env` file in `.gitignore`
- [ ] Regular key rotation schedule
- [ ] Monitoring for exposed keys
- [ ] Git history cleaned of secrets

## Common Issues

### "Invalid API Key" Error
- Verify environment variables in Railway
- Check for typos in variable names
- Ensure no trailing spaces in values

### Frontend Can't Load Config
- Check authentication middleware
- Verify `/api/config` endpoint
- Clear browser cache

## Related Documentation

- [ENVIRONMENT_VARIABLES_SETUP.md](./ENVIRONMENT_VARIABLES_SETUP.md)
- [RAILWAY_ENV_VARS_SETUP.md](./RAILWAY_ENV_VARS_SETUP.md)
- [../05-troubleshooting/SECURITY_AUDIT_NOV_2025.md](../05-troubleshooting/SECURITY_AUDIT_NOV_2025.md)
