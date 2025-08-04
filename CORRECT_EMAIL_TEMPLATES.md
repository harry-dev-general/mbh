# ✅ CORRECT Supabase Email Templates

## Important: Use {{ .ConfirmationURL }} Directly!

The `{{ .ConfirmationURL }}` variable already contains the complete URL with all necessary parameters. Don't try to construct your own URL.

### 1. Confirm Signup Template

Replace with this EXACT template:

```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your user:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
```

### 2. Magic Link Template

Replace with this EXACT template:

```html
<h2>Magic Link</h2>

<p>Follow this link to login:</p>
<p><a href="{{ .ConfirmationURL }}">Log In</a></p>
```

### 3. Reset Password Template

Replace with this EXACT template:

```html
<h2>Reset Password</h2>

<p>Follow this link to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
```

### 4. Change Email Address Template

Replace with this EXACT template:

```html
<h2>Confirm Change of Email</h2>

<p>Follow this link to confirm the update of your email from {{ .Email }} to {{ .NewEmail }}:</p>
<p><a href="{{ .ConfirmationURL }}">Change Email</a></p>
```

## ⚠️ Common Mistakes to Avoid:

1. **DON'T** try to build your own URL like `{{ .SiteURL }}/auth/callback...`
2. **DON'T** mix `{{ .TokenHash }}` with manual URL construction
3. **DO** use `{{ .ConfirmationURL }}` exactly as shown above

## 🔧 What Supabase Does:

Supabase automatically constructs the `{{ .ConfirmationURL }}` to include:
- Your Site URL
- The correct callback path
- All necessary authentication parameters
- Proper URL encoding

## 🧪 Testing:

After updating the templates:
1. Save each template in Supabase Dashboard
2. Try signing up with a new email
3. The link should now work correctly without the "about:blank" issue

## 📝 Note on Redirect URLs:

Make sure your Supabase project has these URLs configured:
- Site URL: `https://mbh-production-f0d1.up.railway.app`
- Additional Redirect URLs: Include `https://mbh-production-f0d1.up.railway.app/training/auth-callback.html`