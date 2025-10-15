# Railway Environment Variables Setup

## Critical Issue: Invalid API Key Error

The application is currently failing with "JWT verification failed: Invalid API key" because the SUPABASE_ANON_KEY is not set correctly in Railway.

## Required Environment Variables

### 1. Get Your Supabase Keys

1. Go to https://supabase.com/dashboard
2. Select your project: **harry-dev-general's Project**
3. Navigate to **Settings > API**
4. Copy these values:
   - **Project URL**: `https://etkugeooigiwahikrmzr.supabase.co`
   - **anon public key**: (Copy the full key)
   - **service_role key**: (Copy the full key - keep this secret!)

### 2. Set Variables in Railway

1. Go to your Railway dashboard
2. Select your project: **mbh-staff-portal**
3. Click on the **development** environment
4. Go to **Variables** tab
5. Add/Update these variables:

```
SUPABASE_URL=https://etkugeooigiwahikrmzr.supabase.co
SUPABASE_ANON_KEY=[paste the anon key from Supabase]
SUPABASE_SERVICE_KEY=[paste the service_role key from Supabase]
```

### 3. Other Required Variables

Make sure these are also set:
```
AIRTABLE_API_KEY=[your Airtable API key]
AIRTABLE_BASE_ID=applkAFOn2qxtu7tx
TWILIO_ACCOUNT_SID=[your Twilio SID]
TWILIO_AUTH_TOKEN=[your Twilio auth token]
TWILIO_FROM_NUMBER=[your Twilio phone number]
```

### 4. Optional Variables

```
ADMIN_API_KEY=mbh-admin-2025
GOOGLE_MAPS_API_KEY=[if you have one]
```

## Verification

After setting the variables:

1. Railway will automatically redeploy
2. Check the logs for "Auth Middleware V2 Initialized"
3. Visit the site - authentication should now work

## Testing

You can run the environment check locally:
```bash
cd mbh-staff-portal
node scripts/check-env.js
```

This will show which variables are missing.
