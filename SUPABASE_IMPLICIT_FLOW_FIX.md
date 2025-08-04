# ✅ CRITICAL: Change Supabase Email Templates to Implicit Flow

Based on the OnboardingRE project fix, the issue is that the current email templates are using `token_hash` which requires PKCE flow. We need to change them to use implicit flow.

## Required Changes in Supabase Dashboard

### 1. Go to Email Templates
Navigate to your Supabase Dashboard → Authentication → Email Templates

### 2. Update "Confirm signup" Template

**CHANGE FROM (Current - Not Working):**
```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your user:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
```

**CHANGE TO (Implicit Flow - Working):**
```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your user:</p>
<p><a href="{{ .SiteURL }}/training/auth-callback.html#access_token={{ .Token }}&token_type=bearer&type=signup">Confirm your email</a></p>
```

### 3. Update "Magic Link" Template (if using)

**CHANGE TO:**
```html
<h2>Magic Link</h2>
<p>Follow this link to login:</p>
<p><a href="{{ .SiteURL }}/training/auth-callback.html#access_token={{ .Token }}&token_type=bearer&type=magiclink">Log In</a></p>
```

### 4. Update "Reset Password" Template

**CHANGE TO:**
```html
<h2>Reset Password</h2>
<p>Follow this link to reset your password:</p>
<p><a href="{{ .SiteURL }}/training/auth-callback.html#access_token={{ .Token }}&token_type=bearer&type=recovery">Reset Password</a></p>
```

## Key Differences:

1. **Use `#` (hash) instead of `?` (query params)**
2. **Use `{{ .Token }}` instead of `{{ .TokenHash }}`**
3. **Use `access_token={{ .Token }}&token_type=bearer` format**
4. **Include the full path `/training/auth-callback.html`**

## Why This Works:

- The implicit flow passes tokens in the URL hash (#)
- JavaScript can access hash parameters on the client side
- No need for complex token_hash verification
- This is the exact solution that worked for OnboardingRE

## Important Notes:

- This is the EXACT same fix used in the OnboardingRE project
- The auth-callback.html is already set up to handle this format
- Make sure to save each template after updating

## After Updating:

1. Save all email templates
2. Try signing up with a new email
3. The confirmation link will now use the format:
   ```
   https://mbh-production-f0d1.up.railway.app/training/auth-callback.html#access_token=...&token_type=bearer&type=signup
   ```
4. This should work immediately!