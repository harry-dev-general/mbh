/**
 * Authentication Middleware
 * Validates Supabase JWT tokens and attaches user info to requests
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration with fallback to default values
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://etkugeooigiwahikrmzr.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0a3VnZW9vaWdpd2FoaWtybXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MDI0OTcsImV4cCI6MjA2ODM3ODQ5N30.OPIYLsnPNNF7dP3SDCODIurzaa3X_Q3xEhfPO3rLJxU';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Extract and verify JWT token from request
 * @param {Request} req - Express request object
 * @returns {Promise<Object|null>} - Decoded token payload or null
 */
async function verifyToken(req) {
    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    try {
        // Create a new Supabase client with the Authorization header
        // This is the proper way to verify tokens server-side
        const authSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: {
                headers: {
                    Authorization: authHeader
                }
            }
        });
        
        // Now get the user - this will verify the JWT
        const { data: { user }, error } = await authSupabase.auth.getUser();
        
        if (error || !user) {
            console.error('Token verification failed:', error);
            return null;
        }

        console.log('Successfully verified token for user:', user.email);
        return user;
    } catch (error) {
        console.error('Error verifying token:', error);
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
