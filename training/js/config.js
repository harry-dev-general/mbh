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
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { error: 'Unknown error', message: response.statusText };
            }
            console.error('Config API error:', errorData);
            
            // Throw specific error for server configuration issues
            if (errorData.error === 'Server configuration error') {
                throw new Error('Server configuration error: Supabase keys are not properly configured in Railway environment variables.');
            }
            throw new Error('Failed to load configuration: ' + (errorData.message || response.statusText));
        }
        appConfig = await response.json();
        console.log('Configuration loaded successfully');
        return appConfig;
    } catch (error) {
        console.error('Error loading configuration:', error);
        // Re-throw the error so calling code can handle it
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

// Helper to get the proper app URL
async function getAppUrl() {
    const config = await loadConfig();
    // Use APP_URL from server if available, otherwise use current origin
    return config.APP_URL || window.location.origin;
}

// Export for use in other scripts
window.MBHConfig = {
    loadConfig,
    initializeSupabase,
    airtableFetch,
    getAppUrl
};