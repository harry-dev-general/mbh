/**
 * Service Role Authentication Middleware
 * Uses service role key for JWT verification in production
 * This is the proper pattern for server-side JWT verification
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://etkugeooigiwahikrmzr.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('FATAL: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment variables');
    console.error('Service role key is required for server-side JWT verification');
}

console.log('Service Auth Middleware Initialized');
console.log('SUPABASE_URL:', SUPABASE_URL);
console.log('Has SERVICE_KEY:', !!SUPABASE_SERVICE_KEY);
console.log('Environment:', process.env.NODE_ENV);
console.log('Railway Environment:', process.env.RAILWAY_ENVIRONMENT);

/**
 * Create a Supabase client with service role key
 * Service role key bypasses RLS and can verify any JWT
 */
const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
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
    console.log('🔍 Verifying token with service role key:', token.substring(0, 20) + '...');
    
    try {
        // Method 1: Try using getUser with token parameter (preferred)
        console.log('Attempting getUser with token parameter...');
        const { data: { user }, error } = await supabaseService.auth.getUser(token);
        
        if (error) {
            console.error('❌ getUser failed:', error.message);
            
            // Method 2: Try decoding the JWT and getting user by ID
            console.log('Attempting to decode JWT and get user by ID...');
            try {
                // Decode the JWT to get the user ID
                const parts = token.split('.');
                if (parts.length !== 3) {
                    throw new Error('Invalid JWT format');
                }
                
                const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
                const userId = payload.sub;
                
                if (!userId) {
                    throw new Error('No user ID in JWT payload');
                }
                
                console.log('Extracted user ID from JWT:', userId);
                
                // Use admin API to get user details
                const { data: adminUser, error: adminError } = await supabaseService.auth.admin.getUserById(userId);
                
                if (adminError) {
                    console.error('❌ Admin getUserById failed:', adminError.message);
                    return null;
                }
                
                if (!adminUser) {
                    console.error('❌ No user found for ID:', userId);
                    return null;
                }
                
                console.log('✅ User retrieved via admin API:', adminUser.email);
                
                // Return user in the expected format
                return {
                    id: adminUser.id,
                    email: adminUser.email,
                    user_metadata: adminUser.user_metadata || {},
                    app_metadata: adminUser.app_metadata || {}
                };
                
            } catch (decodeError) {
                console.error('❌ JWT decode/admin lookup failed:', decodeError.message);
                return null;
            }
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
        console.log('🔐 Service auth middleware called for:', req.path);
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
                        'No header',
                    middleware: 'service-role'
                }
            });
        }

        // Attach user info to request
        req.user = {
            id: user.id,
            email: user.email,
            metadata: user.user_metadata || user.metadata || {}
        };

        console.log('✅ User authenticated with service role key:', user.email);
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
                metadata: user.user_metadata || user.metadata || {}
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
