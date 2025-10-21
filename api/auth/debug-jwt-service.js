/**
 * Debug endpoint for testing JWT verification with service role key
 * This helps diagnose authentication issues in production
 */

const { verifyToken } = require('../auth-middleware-service');

async function debugJWTService(req, res) {
  console.log('🔍 JWT Debug Service Role Key');
  
  const authHeader = req.headers.authorization;
  
  const result = {
    timestamp: new Date().toISOString(),
    hasAuthHeader: !!authHeader,
    environment: {
      RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
      NODE_ENV: process.env.NODE_ENV,
      SUPABASE_URL: process.env.SUPABASE_URL,
      hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
      authMiddleware: 'service-role'
    }
  };

  if (!authHeader) {
    result.error = 'No authorization header';
    return res.json(result);
  }

  if (!process.env.SUPABASE_SERVICE_KEY) {
    result.error = 'Service role key not configured';
    result.message = 'SUPABASE_SERVICE_KEY environment variable is required for production JWT verification';
    return res.status(500).json(result);
  }

  try {
    // Use the service role middleware to verify token
    const user = await verifyToken(req);
    
    result.verifyResult = user ? 'SUCCESS' : 'FAILED';
    result.user = user ? { id: user.id, email: user.email } : null;
    
    // Additional debugging if verification failed
    if (!user) {
      // Try to decode the JWT to see what's in it
      const token = authHeader.substring(7);
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          result.tokenPayload = {
            sub: payload.sub,
            email: payload.email,
            exp: new Date(payload.exp * 1000).toISOString(),
            isExpired: Date.now() > payload.exp * 1000,
            aud: payload.aud,
            iss: payload.iss,
            role: payload.role
          };
          
          // Check token issuer
          if (payload.iss !== process.env.SUPABASE_URL) {
            result.warning = `Token issuer mismatch. Expected: ${process.env.SUPABASE_URL}, Got: ${payload.iss}`;
          }
        }
      } catch (e) {
        result.tokenDecodeError = e.message;
      }
    }
    
    console.log('Service role debug result:', result);
    
    res.json(result);
  } catch (error) {
    result.error = error.message;
    result.stack = error.stack;
    res.status(500).json(result);
  }
}

module.exports = debugJWTService;
