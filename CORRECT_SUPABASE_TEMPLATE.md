# ✅ CORRECT Supabase Email Template Solution

## The Problem
The `{{ .Token }}` variable gives us a 6-digit OTP code (like "153820"), NOT a JWT access token. This is why the implicit flow approach isn't working.

## The Solution: Use the Default ConfirmationURL

Based on further investigation of the OnboardingRE project, the simplest solution is to use Supabase's default `{{ .ConfirmationURL }}` which handles everything correctly.

### Update Your Email Templates:

#### 1. Confirm Signup Template
```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your user:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
```

#### 2. Magic Link Template  
```html
<h2>Magic Link</h2>

<p>Follow this link to login:</p>
<p><a href="{{ .ConfirmationURL }}">Log In</a></p>
```

#### 3. Reset Password Template
```html
<h2>Reset Password</h2>

<p>Follow this link to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
```

## Why This Works

- `{{ .ConfirmationURL }}` is automatically constructed by Supabase with all the correct parameters
- It will generate URLs with `token_hash` which our callback already handles
- This is the default Supabase approach and is most reliable

## Alternative: Code Flow (from OnboardingRE)

If the above doesn't work, try this format:
```html
<p><a href="{{ .SiteURL }}/training/auth-callback.html?code={{ .Token }}&type=signup">Confirm your email</a></p>
```

## The auth-callback.html is Already Set Up

The callback has been updated to handle:
1. `token_hash` in query params (from ConfirmationURL)
2. `code` in query params 
3. `access_token` in hash (implicit flow)

## Next Steps

1. Update your email templates to use `{{ .ConfirmationURL }}`
2. Save the changes
3. Try signing up with a new email
4. The confirmation should work!

## Important Note

The previous attempt using `#access_token={{ .Token }}` failed because `{{ .Token }}` is the OTP code, not a JWT token. This is why we saw `access_token=153820` in the URL.