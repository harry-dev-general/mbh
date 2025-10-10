# MBH Staff Portal - Railway Deployment Guide

## Overview
This guide walks through deploying the MBH Staff Portal to Railway, including security improvements and environment variable configuration.

## Prerequisites
- Railway account
- Git repository (GitHub recommended)
- Access to Supabase and Airtable credentials

## Security Updates Required
Currently, the Airtable API key is hardcoded in client-side JavaScript. Before deployment, you should update all HTML files to use the proxy server for Airtable requests.

### Update Pattern
In each HTML file, replace direct Airtable API calls with the proxy:

**Before:**
```javascript
const AIRTABLE_API_KEY = 'patYiJdXfvcSenMU4...';
const response = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`,
    {
        headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`
        }
    }
);
```

**After:**
```javascript
// Include the config script in HTML head
<script src="/js/config.js"></script>

// In your JavaScript code
const response = await MBHConfig.airtableFetch(
    `${BASE_ID}/${TABLE_ID}`,
    {
        method: 'GET',
        // No need for Authorization header
    }
);
```

## Environment Variables
Set these in Railway's environment variables:

```bash
# Supabase Configuration
SUPABASE_URL=https://etkugeooigiwahikrmzr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0a3VnZW9vaWdpd2FoaWtybXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MDI0OTcsImV4cCI6MjA2ODM3ODQ5N30.OPIYLsnPNNF7dP3SDCODIurzaa3X_Q3xEhf

# Airtable Configuration
AIRTABLE_API_KEY=patYiJdXfvcSenMU4.f16c95bde5176be23391051e0c5bdc6405991805c434696d55b851bf208a2f14

# Server Configuration
PORT=3000
NODE_ENV=production
```

## Deployment Steps

### 1. Prepare the Repository
```bash
cd mbh-staff-portal
npm install
git add .
git commit -m "Add Railway deployment configuration"
git push origin main
```

### 2. Deploy to Railway

#### Option A: Using Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize new project
railway init

# Deploy
railway up
```

#### Option B: Using Railway Dashboard
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will auto-detect the Node.js app
6. Add environment variables in the Variables tab
7. Deploy

### 3. Configure Domain (Optional)
1. In Railway project settings, go to "Settings"
2. Under "Domains", click "Generate Domain" for a railway.app subdomain
3. Or add a custom domain

## Post-Deployment Tasks

### 1. Update Supabase Redirect URLs
Add your Railway domain to Supabase allowed redirect URLs:
1. Go to Supabase Dashboard
2. Authentication → URL Configuration
3. Add your Railway URL (e.g., `https://your-app.railway.app`)

### 2. Test All Features
- [ ] Authentication (login/signup)
- [ ] Employee lookup
- [ ] Availability submission
- [ ] Pre-departure checklist
- [ ] Post-departure checklist
- [ ] Dashboard access

### 3. Security Checklist
- [ ] Verify Airtable API key is not exposed in client code
- [ ] Check browser console for any API key leaks
- [ ] Test API proxy endpoints
- [ ] Ensure HTTPS is enabled (Railway provides this automatically)

## File Structure for Deployment
```
mbh-staff-portal/
├── package.json          # Node.js dependencies
├── server.js            # Express server
├── env.example          # Environment variable template
├── training/            # Static HTML/JS files
│   ├── js/
│   │   └── config.js   # Configuration loader
│   └── *.html          # Application pages
└── DEPLOYMENT_GUIDE.md  # This file
```

## Monitoring & Logs
- View logs in Railway dashboard under "Deployments"
- Use `railway logs` CLI command for real-time logs
- Set up error tracking (e.g., Sentry) for production

## Troubleshooting

### Issue: "Cannot find module" errors
**Solution:** Ensure all dependencies are in package.json and run `npm install`

### Issue: API calls failing
**Solution:** Check environment variables are set correctly in Railway

### Issue: Authentication not working
**Solution:** Verify Supabase URL and anon key are correct

### Issue: Static files not loading
**Solution:** Check the file paths in server.js match your directory structure

## Next Steps
1. Consider implementing server-side rendering with Next.js
2. Add database caching layer with Supabase
3. Implement proper logging and monitoring
4. Set up CI/CD pipeline
5. Add API rate limiting and security headers