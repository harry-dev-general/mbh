# Supabase API Keys Update Guide

## Current Situation
After rotating the JWT signing key, you have two sets of API keys available:

### 1. Legacy API Keys (Currently in use)
- **anon public**: The old JWT-based key (still the exposed one)
- **service_role**: The old service key
- **Status**: Still showing activity ("Last request was 3 hours ago")

### 2. New API Keys (Should switch to these)
- **Publishable key**: `sb_publishable_...` format
- **Secret keys**: New format secret keys

## Railway Environment Variable Update

You have two options:

### Option 1: Continue with Legacy Keys (Temporary)
If the Legacy API Keys tab shows NEW keys (different from the exposed ones):
```
SUPABASE_URL=https://etkugeooigiwahikrmzr.supabase.co
SUPABASE_ANON_KEY=<copy from Legacy API Keys > anon public>
SUPABASE_SERVICE_KEY=<copy from Legacy API Keys > service_role after clicking Reveal>
```

### Option 2: Switch to New API Keys System (Recommended)
Use the modern API keys from the "API Keys" tab:
```
SUPABASE_URL=https://etkugeooigiwahikrmzr.supabase.co
SUPABASE_ANON_KEY=sb_publishable_YIKA2xZ2I2ItkaJgxipoZg_3_5HkyTx
SUPABASE_SERVICE_KEY=<click Reveal on the Secret key to copy>
```

## Important Notes

1. **The Publishable key** (`sb_publishable_...`) can be used in place of the anon key
2. **The Secret key** from the new system replaces the service_role key
3. Both systems work, but the new API Keys system is more secure and flexible

## Verification Steps

After updating Railway:
1. Check that your app deploys successfully
2. Monitor the "Last request" timestamp in Supabase:
   - Legacy API Keys should stop showing new activity
   - Or API Keys tab should show activity (if using new keys)
3. Test authentication in your application

## Next Steps

Once confirmed working with new keys:
1. The exposed anon key in git history becomes useless
2. You can disable Legacy API Keys entirely
3. Consider revoking the old JWT signing key after 24-48 hours
