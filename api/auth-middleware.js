/**
 * Authentication Middleware
 * Validates Supabase JWT tokens and attaches user info to requests
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Validate required environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('ERROR: SUPABASE_URL and SUPABASE_ANON_KEY environment variables must be set');
    console.error('Authentication middleware cannot initialize without these variables');
    throw new Error('Missing required Supabase environment variables');
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Extract and verify JWT token from request
 * @param {Request} req - Express request object
 * @returns {Promise<Object|null>} - Decoded token payload or null
 */
async function verifyToken(req) {
    console.log('=== JWT Verification Debug ===');
    console.log('Request URL:', req.url);
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));
    
    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        console.log('No Authorization header found');
        return null;
    }
    
    if (!authHeader.startsWith('Bearer ')) {
        console.log('Authorization header does not start with "Bearer "');
        console.log('Auth header value:', authHeader);
        return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('Token length:', token.length);
    console.log('Token preview:', token.substring(0, 50) + '...');
    console.log('SUPABASE_URL:', SUPABASE_URL);
    console.log('SUPABASE_ANON_KEY preview:', SUPABASE_ANON_KEY.substring(0, 50) + '...');

    try {
        // Try multiple verification approaches
        console.log('Attempting JWT verification...');
        
        // Approach 1: Create client with auth header (SvelteKit pattern)
        console.log('Approach 1: Creating Supabase client with auth header...');
        const authSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: {
                headers: {
                    Authorization: authHeader
                }
            }
        });
        
        // First try without passing token (SvelteKit pattern)
        console.log('Trying getUser() without token parameter...');
        let result = await authSupabase.auth.getUser();
        
        if (result.error) {
            console.log('Approach 1 failed:', result.error.message);
            
            // Approach 2: Try passing token directly (Edge Functions pattern)
            console.log('Approach 2: Trying getUser() with token parameter...');
            result = await authSupabase.auth.getUser(token);
            
            if (result.error) {
                console.log('Approach 2 failed:', result.error.message);
                
                // Approach 3: Use default client with token
                console.log('Approach 3: Using default client with token...');
                result = await supabase.auth.getUser(token);
                
                if (result.error) {
                    console.error('All approaches failed. Final error:', result.error);
                    console.error('Error details:', JSON.stringify(result.error, null, 2));
                    return null;
                }
            }
        }
        
        const { data: { user } } = result;
        
        if (!user) {
            console.error('Token verification succeeded but no user returned');
            return null;
        }

        console.log('Successfully verified token for user:', user.email);
        console.log('User ID:', user.id);
        console.log('User metadata:', JSON.stringify(user.user_metadata, null, 2));
        return user;
    } catch (error) {
        console.error('Exception during token verification:', error);
        console.error('Error stack:', error.stack);
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
                error: 'Unauthorized: Invalid or missing authentication token' 
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
        console.error('Authentication error:', error);
        res.status(500).json({ 
            error: 'Internal server error during authentication' 
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
    optionalAuthenticate
};
