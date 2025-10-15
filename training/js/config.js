// Configuration loader for MBH Staff Portal
// This file handles loading environment variables from the server

let appConfig = null;

// Load configuration from server
async function loadConfig() {
    if (appConfig) {
        return appConfig;
    }
    
    try {
        const response = await fetch('/api/config');
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Config API error:', errorData);
            
            // Show user-friendly error
            if (errorData.error === 'Server configuration error') {
                alert('Server configuration error: Supabase keys are not properly configured. Please contact support.');
                throw new Error(errorData.message);
            }
            throw new Error('Failed to load configuration');
        }
        appConfig = await response.json();
        return appConfig;
    } catch (error) {
        console.error('Error loading configuration:', error);
        // Don't provide fallback - force proper configuration
        alert('Failed to load application configuration. Please ensure the server is properly configured.');
        throw error;
    }
}

// Initialize Supabase client
async function initializeSupabase() {
    const config = await loadConfig();
    return window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
}

// Proxy function for Airtable API calls
async function airtableFetch(path, options = {}) {
    const config = await loadConfig();
    
    // Use the proxy endpoint instead of direct Airtable API
    const proxyPath = `/api/airtable/${path.replace('https://api.airtable.com/v0/', '')}`;
    
    const response = await fetch(proxyPath, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
            // Remove the Authorization header as it will be added server-side
            'Authorization': undefined
        }
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'API request failed');
    }
    
    return response.json();
}

// Export for use in other scripts
window.MBHConfig = {
    loadConfig,
    initializeSupabase,
    airtableFetch
};