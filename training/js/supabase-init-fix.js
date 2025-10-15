/**
 * Fixed Supabase Initialization Module
 * Based on patterns from OnboardingRE that work with Railway
 */

window.SupabaseInit = (function() {
    'use strict';
    
    let supabaseClient = null;
    let initializationPromise = null;
    let config = null;
    
    /**
     * Load configuration from server
     */
    async function loadConfig() {
        if (config) return config;
        
        const response = await fetch('/api/config');
        if (!response.ok) {
            throw new Error('Failed to load configuration');
        }
        
        config = await response.json();
        return config;
    }
    
    /**
     * Create Supabase client with Railway-compatible settings
     */
    async function createSupabaseClient() {
        // Return existing client if already created
        if (supabaseClient) {
            console.log('[SupabaseInit] Returning existing client');
            return supabaseClient;
        }
        
        // Load configuration
        const appConfig = await loadConfig();
        
        if (!appConfig.SUPABASE_URL || !appConfig.SUPABASE_ANON_KEY) {
            throw new Error('Missing Supabase configuration');
        }
        
        console.log('[SupabaseInit] Creating Supabase client...');
        console.log('[SupabaseInit] URL:', appConfig.SUPABASE_URL);
        console.log('[SupabaseInit] APP_URL:', appConfig.APP_URL);
        
        // Create client with specific configuration for Railway
        supabaseClient = window.supabase.createClient(
            appConfig.SUPABASE_URL,
            appConfig.SUPABASE_ANON_KEY,
            {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true,
                    flowType: 'pkce',
                    storage: window.localStorage,
                    storageKey: `sb-${appConfig.SUPABASE_URL.split('//')[1].split('.')[0]}-auth-token`
                },
                global: {
                    headers: {
                        'X-Client-Info': 'mbh-staff-portal'
                    }
                },
                db: {
                    schema: 'public'
                },
                realtime: {
                    params: {
                        eventsPerSecond: 10
                    }
                }
            }
        );
        
        console.log('[SupabaseInit] Client created successfully');
        return supabaseClient;
    }
    
    /**
     * Initialize Supabase with proper error handling
     */
    async function initialize() {
        if (initializationPromise) {
            return initializationPromise;
        }
        
        initializationPromise = (async () => {
            try {
                const client = await createSupabaseClient();
                
                // Test the client immediately
                console.log('[SupabaseInit] Testing client connection...');
                
                // Set up auth state listener first
                const { data: authListener } = client.auth.onAuthStateChange((event, session) => {
                    console.log('[SupabaseInit] Auth state change:', event, !!session);
                });
                
                // Try to get session with a shorter timeout
                const sessionPromise = client.auth.getSession();
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Session check timeout')), 3000)
                );
                
                try {
                    const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]);
                    console.log('[SupabaseInit] Initial session check:', !!session, error);
                    
                    if (error && error.message !== 'Session check timeout') {
                        console.error('[SupabaseInit] Session error:', error);
                    }
                } catch (timeoutError) {
                    console.log('[SupabaseInit] Session check timed out, continuing anyway...');
                    // Don't throw - just continue with the client
                }
                
                return client;
            } catch (error) {
                console.error('[SupabaseInit] Initialization error:', error);
                initializationPromise = null; // Reset so it can be retried
                throw error;
            }
        })();
        
        return initializationPromise;
    }
    
    /**
     * Get session with retry logic
     */
    async function getSessionWithRetry(client, maxRetries = 3) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                console.log(`[SupabaseInit] Getting session, attempt ${i + 1}/${maxRetries}`);
                
                const sessionPromise = client.auth.getSession();
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 2000)
                );
                
                const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]);
                
                if (error && error.message !== 'Timeout') {
                    throw error;
                }
                
                return { session, error: null };
            } catch (error) {
                console.log(`[SupabaseInit] Session attempt ${i + 1} failed:`, error.message);
                
                if (i === maxRetries - 1) {
                    // On last attempt, try refreshing
                    try {
                        console.log('[SupabaseInit] Attempting session refresh...');
                        const { data: { session }, error: refreshError } = await client.auth.refreshSession();
                        if (session) {
                            return { session, error: null };
                        }
                    } catch (refreshError) {
                        console.log('[SupabaseInit] Refresh failed:', refreshError);
                    }
                    
                    return { session: null, error };
                }
                
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        return { session: null, error: new Error('Failed to get session after retries') };
    }
    
    // Public API
    return {
        initialize,
        getClient: async () => {
            await initialize();
            return supabaseClient;
        },
        getSession: async () => {
            const client = await initialize();
            return getSessionWithRetry(client);
        },
        getConfig: loadConfig
    };
})();
