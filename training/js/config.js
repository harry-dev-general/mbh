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
            throw new Error('Failed to load configuration');
        }
        appConfig = await response.json();
        return appConfig;
    } catch (error) {
        console.error('Error loading configuration:', error);
        // Fallback to hardcoded values for local development
        appConfig = {
            SUPABASE_URL: 'https://etkugeooigiwahikrmzr.supabase.co',
            SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0a3VnZW9vaWdpd2FoaWtybXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MDI0OTcsImV4cCI6MjA2ODM3ODQ5N30.OPIYLsnPNNF7dP3SDCODIurzaa3X_Q3xEhfPO3rLJxU',
            API_BASE_URL: ''
        };
        return appConfig;
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