# Supabase Key Rotation Guide for MBH Staff Portal

## Current Situation
Your Supabase Anon Key was exposed in the codebase and needs to be rotated. The exposed key is a JWT token that's derived from your Legacy JWT Secret.

## Key Types Explained

### 1. **Anon Key** (Exposed)
- A public JWT token safe for frontend use
- Currently exposed: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- Derived from Legacy JWT Secret
- Used in: Frontend HTML files, client-side JavaScript

### 2. **Service Key** (Not Exposed)
- A secret key with admin privileges
- Used only on server-side
- Stored as `SUPABASE_SERVICE_KEY` environment variable

### 3. **Secret Keys** (API Keys Section)
- Additional service keys you can create
- Same privileges as Service Key
- Not needed for rotation unless Service Key was compromised

## Recommended Rotation Process

### Use JWT Signing Keys (Recommended) ✅

1. **Navigate to Supabase Dashboard**
   - Go to your project
   - Settings → Authentication → JWT Keys
   - Select "JWT Signing Keys" tab (not Legacy JWT Secret)

2. **Create New Signing Key**
   - Click "Add new signing key"
   - This enables zero-downtime key rotation
   - Both old and new JWTs will work during transition

3. **Generate New API Keys**
   - After creating signing key, click "Go to API Keys"
   - Copy the new Anon key (still starts with `eyJ...`)
   - Service key can optionally be regenerated too

4. **Update Railway Environment Variables**
   ```
   SUPABASE_ANON_KEY=<new anon key from step 3>
   # Optionally:
   SUPABASE_SERVICE_KEY=<new service key if you regenerated it>
   ```

### Why NOT Use Legacy JWT Secret Change ❌

- Requires all users to re-authenticate
- Causes downtime
- Not reversible
- More disruptive to operations

## After Rotation

1. **Test Authentication**
   - Clear browser cache
   - Try logging in with existing account
   - Verify all features work

2. **Monitor**
   - Check Railway logs for any auth errors
   - Existing sessions should continue working
   - New logins will use new key

3. **Clean Git History**
   - Run the provided `REMOVE_SECRETS_FROM_GIT_HISTORY.sh` script
   - Force push to remove old keys from history
   - Have team re-clone repository

## Timeline

1. **Immediate**: Create JWT Signing Key
2. **Within 24 hours**: Update Railway with new keys
3. **Within 48 hours**: Clean git history
4. **After 7 days**: Optionally disable old signing key

## Questions?

- JWT Signing Keys allow gradual migration
- Old key continues working during transition
- No user disruption
- Can roll back if issues arise
