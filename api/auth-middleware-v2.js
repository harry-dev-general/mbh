/**
 * Authentication Middleware V2
 * Simplified JWT verification approach based on Supabase documentation
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration - must be set in environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('FATAL: SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment variables');
    console.error('Please set these in Railway dashboard');
}

console.log('Auth Middleware V2 Initialized');
console.log('SUPABASE_URL:', SUPABASE_URL);
console.log('Environment:', process.env.NODE_ENV);
console.log('Railway Environment:', process.env.RAILWAY_ENVIRONMENT);

/**
 * Extract and verify JWT token from request
 * @param {Request} req - Express request object
 * @returns {Promise<Object|null>} - User object or null
 */
async function verifyToken(req) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('Invalid or missing Authorization header');
        return null;
    }

    const token = authHeader.substring(7);
    
    try {
        // Create a new Supabase client for this request
        // This ensures each request has its own client instance
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            },
            global: {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        });
        
        // Verify the JWT and get user
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
            console.error('JWT verification failed:', error.message);
            return null;
        }
        
        if (!user) {
            console.error('No user found for valid JWT');
            return null;
        }
        
        console.log('JWT verified successfully for:', user.email);
        return user;
        
    } catch (error) {
        console.error('Exception during JWT verification:', error);
        return null;
    }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to request
 */
async function authenticate(req, res, next) {
    try {
        const user = await verifyToken(req);
        
        if (!user) {
            return res.status(401).json({ 
                error: 'Unauthorized',
                message: 'Invalid or missing authentication token'
            });
        }

        // Attach user info to request
        req.user = {
            id: user.id,
            email: user.email,
            metadata: user.user_metadata
        };

        next();
    } catch (error) {
        console.error('Authentication middleware error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: 'Authentication failed'
        });
    }
}

/**
 * Optional authentication middleware
 * Attempts to authenticate but doesn't fail if no token
 */
async function optionalAuthenticate(req, res, next) {
    try {
        const user = await verifyToken(req);
        
        if (user) {
            req.user = {
                id: user.id,
                email: user.email,
                metadata: user.user_metadata
            };
        }

        next();
    } catch (error) {
        console.error('Optional authentication error:', error);
        // Continue without authentication
        next();
    }
}

module.exports = {
    authenticate,
    optionalAuthenticate,
    verifyToken  // Export for debugging
};
