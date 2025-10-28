# Daily Run Sheet v2 Authentication Fix

## Issue
Deployment crash on October 28, 2025 after implementing Daily Run Sheet v2:
```
ReferenceError: requireAuth is not defined
app.post('/api/update-allocation', requireAuth, async (req, res) => {
```

## Root Cause
Incorrect middleware name used in server.js line 1293. The codebase uses `authenticate` not `requireAuth`.

## Solution
Changed line 1293 from:
```javascript
app.post('/api/update-allocation', requireAuth, async (req, res) => {
```

To:
```javascript
app.post('/api/update-allocation', authenticate, async (req, res) => {
```

## Authentication Pattern in MBH Staff Portal
The authentication middleware is loaded dynamically based on environment:
```javascript
const authMiddleware = process.env.RAILWAY_ENVIRONMENT === 'production' 
    ? require('./api/auth-middleware-production') 
    : require('./api/auth-middleware-v2');
const { authenticate, optionalAuthenticate } = authMiddleware;
```

Always use:
- `authenticate` - For routes requiring authentication
- `optionalAuthenticate` - For routes with optional auth

## Status
✅ Fixed and deployed to production
