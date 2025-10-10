# Railway vs Local Development Environment

**Last Updated**: October 10, 2025

## Overview

This guide explains the differences between Railway (production) and local development environments, particularly regarding environment variable handling.

## Key Differences

### Production (Railway)

- **Environment Variables**: Managed through Railway dashboard
- **Auto-deployment**: Pushes to main branch trigger automatic deployments
- **Google Maps API Key**: Set in Railway environment variables
- **No .env file needed**: Railway injects variables directly

### Local Development

- **Environment Variables**: Requires `.env` file in project root
- **Manual start**: Run `npm start` locally
- **Google Maps API Key**: Must be set in `.env` file
- **Configuration**: Read from `.env` file

## Why Google Maps Works in Production but Not Development

The error you're seeing:
```
Failed to load configuration: Error: Google Maps API key not configured on server
```

This happens because:

1. **Production**: Railway automatically injects the `GOOGLE_MAPS_API_KEY` environment variable
2. **Development**: The local server doesn't have access to Railway's environment variables

## Solutions

### Option 1: Local Development with .env (Recommended)

Create a `.env` file in your project root:

```bash
# Essential for local development
GOOGLE_MAPS_API_KEY=your_actual_key_here
AIRTABLE_API_KEY=your_actual_key_here

# Optional for local testing
TWILIO_ACCOUNT_SID=optional
TWILIO_AUTH_TOKEN=optional
TWILIO_FROM_NUMBER=+1234567890
```

### Option 2: Development Without Google Maps

If you don't need the fleet map during development:

1. The error won't break other functionality
2. Focus on the features you're developing
3. Test Google Maps features in production

### Option 3: Use Railway Development Environment

Railway supports multiple environments. You could:

1. Create a "development" environment in Railway
2. Deploy the development branch there
3. Test with full environment variables

## Best Practices

### For Production Features

1. **Never commit API keys** to the repository
2. **Use environment variables** for all sensitive data
3. **Test in Railway** before merging to main

### For Local Development

1. **Create `.env`** from `env.example`
2. **Get API keys** from team lead or service dashboards
3. **Use minimal keys** - only what you need for your feature

## Common Issues and Solutions

### Issue: "Cannot read properties of undefined"

**Cause**: JavaScript trying to access config before loaded  
**Solution**: Ensure async config loading:

```javascript
// Wrong
const apiKey = config.googleMapsApiKey; // config might be undefined

// Right
const config = await loadConfig();
const apiKey = config.googleMapsApiKey;
```

### Issue: Features work locally but not in Railway

**Cause**: Missing environment variables in Railway  
**Solution**: Check Railway dashboard → Settings → Variables

### Issue: Features work in Railway but not locally

**Cause**: Missing `.env` file or variables  
**Solution**: Create/update `.env` file with required variables

## Environment Variable Reference

### Required for Core Features

```bash
# Database
SUPABASE_URL=https://etkugeooigiwahikrmzr.supabase.co
SUPABASE_ANON_KEY=eyJhbG...

# Data Source
AIRTABLE_API_KEY=patYi...

# Maps (Fleet tracking)
GOOGLE_MAPS_API_KEY=AIza...
```

### Required for SMS Features

```bash
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+61...
```

### Server Configuration

```bash
PORT=3000  # Local (Railway uses 8080)
NODE_ENV=development  # or production
```

## Checking Your Environment

### Local Development

```bash
# Check if .env exists
ls -la .env

# Check loaded variables (be careful not to expose secrets)
node -e "require('dotenv').config(); console.log('Maps API:', process.env.GOOGLE_MAPS_API_KEY ? 'Set' : 'Not set')"
```

### Railway Production

1. Go to Railway dashboard
2. Select your project
3. Go to Variables tab
4. Verify all required variables are set

## Summary

- **Production works** because Railway provides environment variables
- **Local development needs** a `.env` file with the same variables
- **Don't commit** sensitive data to the repository
- **Test critical features** in the appropriate environment

The Google Maps error in development is expected if you haven't set up local environment variables. Either set them up locally or test map features in the Railway environment.
