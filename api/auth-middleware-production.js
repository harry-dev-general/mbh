/**
 * Production Authentication Middleware
 * Fixed version based on development environment solution
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration - must match frontend exactly
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://etkugeooigiwahikrmzr.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('FATAL: SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment variables');
}

console.log('Production Auth Middleware Initialized');
console.log('SUPABASE_URL:', SUPABASE_URL);
console.log('Has ANON_KEY:', !!SUPABASE_ANON_KEY);
console.log('Environment:', process.env.NODE_ENV);
console.log('Railway Environment:', process.env.RAILWAY_ENVIRONMENT);

/**
 * Create a single reusable Supabase client
 * This matches the pattern from the development fix
 */
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
    }
});

/**
 * Extract and verify JWT token from request
 * @param {Request} req - Express request object
 * @returns {Promise<Object|null>} - User object or null
 */
async function verifyToken(req) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('❌ Invalid or missing Authorization header');
        return null;
    }

    const token = authHeader.substring(7);
    console.log('🔍 Verifying token:', token.substring(0, 20) + '...');
    
    try {
        // Use the admin client with the token in the Authorization header
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        
        if (error) {
            console.error('❌ JWT verification failed:', error.message);
            console.error('Error code:', error.code);
            console.error('Error status:', error.status);
            
            // Additional debugging for production
            if (error.message.includes('JWT')) {
                console.error('JWT Error Details:', {
                    message: error.message,
                    status: error.status,
                    code: error.code
                });
            }
            
            return null;
        }
        
        if (!user) {
            console.error('❌ No user found for valid JWT');
            return null;
        }
        
        console.log('✅ JWT verified successfully for:', user.email);
        return user;
        
    } catch (error) {
        console.error('❌ Exception during JWT verification:', error);
        console.error('Stack trace:', error.stack);
        return null;
    }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to request
 */
async function authenticate(req, res, next) {
    try {
        console.log('🔐 Auth middleware called for:', req.path);
        console.log('Headers:', {
            authorization: req.headers.authorization ? 'Present' : 'Missing',
            origin: req.headers.origin,
            referer: req.headers.referer
        });
        
        const user = await verifyToken(req);
        
        if (!user) {
            console.log('❌ Authentication failed for:', req.path);
            return res.status(401).json({ 
                error: 'Unauthorized',
                message: 'Invalid or missing authentication token',
                debug: {
                    hasHeader: !!req.headers.authorization,
                    headerFormat: req.headers.authorization ? 
                        (req.headers.authorization.startsWith('Bearer ') ? 'Valid Bearer format' : 'Invalid format') : 
                        'No header'
                }
            });
        }

        // Attach user info to request
        req.user = {
            id: user.id,
            email: user.email,
            metadata: user.user_metadata
        };

        console.log('✅ User authenticated:', user.email);
        next();
    } catch (error) {
        console.error('❌ Authentication middleware error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: 'Authentication service temporarily unavailable'
        });
    }
}

/**
 * Optional authentication middleware
 * Attempts to verify JWT but continues if not present
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
            console.log('✅ Optional auth - User authenticated:', user.email);
        } else {
            console.log('ℹ️ Optional auth - No authentication provided');
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
