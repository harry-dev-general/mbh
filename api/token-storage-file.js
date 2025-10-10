// Temporary Token Storage Module - File-based storage for magic link tokens
// This is a temporary solution until the Airtable table is created
// Uses a JSON file to persist tokens across server restarts

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// File to store tokens
const TOKENS_FILE = path.join(__dirname, '../data/magic-tokens.json');

// Ensure data directory exists
async function ensureDataDir() {
    const dataDir = path.join(__dirname, '../data');
    try {
        await fs.mkdir(dataDir, { recursive: true });
    } catch (error) {
        // Directory might already exist
    }
}

// Load tokens from file
async function loadTokens() {
    try {
        await ensureDataDir();
        const data = await fs.readFile(TOKENS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // File doesn't exist or is corrupted, return empty object
        return {};
    }
}

// Save tokens to file
async function saveTokens(tokens) {
    try {
        await ensureDataDir();
        await fs.writeFile(TOKENS_FILE, JSON.stringify(tokens, null, 2));
    } catch (error) {
        console.error('Failed to save tokens to file:', error);
    }
}

/**
 * Generate and store a magic link token
 * @param {string} allocationId - The shift allocation record ID (or booking ID)
 * @param {string} employeeId - The employee record ID
 * @param {string} action - 'accept' or 'deny'
 * @param {boolean} isBookingAllocation - Whether this is a booking-specific allocation
 * @param {string} role - The role for booking allocations (Onboarding/Deloading)
 * @returns {Promise<string>} - The generated token
 */
async function generateAndStoreToken(allocationId, employeeId, action, isBookingAllocation = false, role = null) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours expiry
    const createdAt = new Date();
    
    try {
        // Load existing tokens
        const tokens = await loadTokens();
        
        // Add new token
        tokens[token] = {
            allocationId,
            employeeId,
            action,
            expiresAt: expiresAt.toISOString(),
            isBookingAllocation,
            role,
            used: false,
            createdAt: createdAt.toISOString()
        };
        
        // Save to file
        await saveTokens(tokens);
        
        console.log(`✅ Token stored in file: ${token.substring(0, 8)}...`);
        return token;
        
    } catch (error) {
        console.error('Failed to store token:', error);
        throw new Error('Failed to generate magic link');
    }
}

/**
 * Validate a magic link token
 * @param {string} token - The token to validate
 * @returns {Promise<object|null>} - Token data if valid, null otherwise
 */
async function validateToken(token) {
    try {
        // Load tokens from file
        const tokens = await loadTokens();
        
        const tokenData = tokens[token];
        if (!tokenData) {
            console.log('Token not found:', token.substring(0, 8) + '...');
            return null;
        }
        
        // Check if expired
        const expiresAt = new Date(tokenData.expiresAt);
        if (new Date() > expiresAt) {
            console.log('Token expired:', token.substring(0, 8) + '...');
            // Clean up expired token
            delete tokens[token];
            await saveTokens(tokens);
            return null;
        }
        
        // Check if already used
        if (tokenData.used) {
            console.log('Token already used:', token.substring(0, 8) + '...');
            return null;
        }
        
        // Return token data with token itself for later update
        return {
            ...tokenData,
            recordId: token // Use token as recordId for compatibility
        };
        
    } catch (error) {
        console.error('Error validating token:', error);
        return null;
    }
}

/**
 * Mark a token as used
 * @param {string} token - The token to mark as used
 * @param {string} recordId - Not used in file-based storage, kept for compatibility
 */
async function markTokenAsUsed(token, recordId) {
    try {
        const tokens = await loadTokens();
        
        if (tokens[token]) {
            tokens[token].used = true;
            tokens[token].usedAt = new Date().toISOString();
            await saveTokens(tokens);
            console.log(`✅ Token marked as used: ${token.substring(0, 8)}...`);
        }
        
    } catch (error) {
        console.error('Failed to mark token as used:', error);
        // Don't throw - token was validated, just couldn't mark as used
    }
}

/**
 * Clean up expired tokens (maintenance function)
 * Should be called periodically to clean up old tokens
 */
async function cleanupExpiredTokens() {
    try {
        const tokens = await loadTokens();
        const now = new Date();
        let deletedCount = 0;
        
        // Remove expired or old used tokens
        for (const [token, data] of Object.entries(tokens)) {
            const expiresAt = new Date(data.expiresAt);
            const createdAt = new Date(data.createdAt);
            const daysSinceCreated = (now - createdAt) / (1000 * 60 * 60 * 24);
            
            // Delete if expired or used and older than 7 days
            if (now > expiresAt || (data.used && daysSinceCreated > 7)) {
                delete tokens[token];
                deletedCount++;
            }
        }
        
        if (deletedCount > 0) {
            await saveTokens(tokens);
            console.log(`🧹 Cleaned up ${deletedCount} expired/old tokens`);
        }
        
    } catch (error) {
        console.error('Error cleaning up tokens:', error);
    }
}

// Run cleanup on startup and every hour
cleanupExpiredTokens();
setInterval(cleanupExpiredTokens, 60 * 60 * 1000); // Every hour

module.exports = {
    generateAndStoreToken,
    validateToken,
    markTokenAsUsed,
    cleanupExpiredTokens
};
