# ✅ FINAL Email Template Fix (Based on OnboardingRE Learnings)

## The Issue

The current email templates are using `{{ .ConfirmationURL }}` which generates URLs with `token_hash`, but this requires special handling with `verifyOtp`.

## Two Working Solutions

### Option 1: Keep Using ConfirmationURL (Current Approach)

If your email templates use `{{ .ConfirmationURL }}`, the callback has been updated to handle it properly with `verifyOtp`.

**Email Template:**
```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your user:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
```

This generates URLs like:
```
https://mbh-production-f0d1.up.railway.app/training/auth-callback.html?token_hash=5da94c06fc9c...&type=signup
```

### Option 2: Use Custom URL with Token (OnboardingRE Solution)

Based on the OnboardingRE project's SUPABASE_EMAIL_FIX.md, you can customize the URL:

**Confirm Signup Template:**
```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your user:</p>
<p><a href="{{ .SiteURL }}/training/auth-callback.html#access_token={{ .Token }}&token_type=bearer&type=signup">Confirm your email</a></p>
```

**Magic Link Template:**
```html
<h2>Magic Link</h2>
<p>Follow this link to login:</p>
<p><a href="{{ .SiteURL }}/training/auth-callback.html#access_token={{ .Token }}&token_type=bearer&type=magiclink">Log In</a></p>
```

## Which Option to Choose?

1. **Option 1 (ConfirmationURL)** - Simpler, uses Supabase's default format
2. **Option 2 (Custom URL with Token)** - More control, matches implicit flow

## The auth-callback.html Fix

The callback has been updated to handle BOTH formats:

1. **token_hash in query params** - Uses `verifyOtp` with correct type mapping
2. **access_token in hash** - Uses implicit flow
3. **Automatic session detection** - Falls back to checking if session exists

## Testing

After updating:
1. Clear browser cookies/cache
2. Try signing up with a new email
3. Click the confirmation link
4. You should see "Email verified successfully!"

## Important Notes

- The `type` parameter is crucial for `verifyOtp` to work
- For signup confirmations, the type should be 'email' not 'signup' when calling verifyOtp
- The callback now includes console.log statements for debugging