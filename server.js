require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Check critical environment variables on startup
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('=== CONFIGURATION ERROR ===');
    console.error('Missing required environment variables:', missingVars.join(', '));
    console.error('Please set these in Railway dashboard > Variables');
    console.error('Get values from Supabase Dashboard > Settings > API');
    console.error('========================');
}

// Check recommended environment variables for Railway deployment
if (!process.env.APP_URL && process.env.NODE_ENV === 'production') {
    console.warn('=== CONFIGURATION WARNING ===');
    console.warn('APP_URL environment variable is not set');
    console.warn('This may cause issues with URL handling on Railway');
    console.warn('Set APP_URL to your full deployment URL, e.g., https://mbh-development.up.railway.app');
    console.warn('=============================');
}

// Import notification handlers
const notifications = require('./api/notifications');
const shiftResponseHandler = require('./api/shift-response-handler');
const announcements = require('./api/announcements');
const reminderScheduler = require('./api/reminder-scheduler');
const bookingReminderScheduler = require('./api/booking-reminder-scheduler-fixed');

// Import vessel maintenance routes
const vesselRoutes = require('./api/routes/vessel-maintenance');

// Import daily run sheet module
const dailyRunSheet = require('./api/daily-run-sheet');
// Import dashboard overview module
const dashboardOverview = require('./api/dashboard-overview');

// Import role management and auth middleware
const roleManager = require('./api/role-manager');
// Use production-specific auth middleware
const authMiddleware = process.env.RAILWAY_ENVIRONMENT === 'production' 
    ? require('./api/auth-middleware-production') 
    : require('./api/auth-middleware-v2');
const { authenticate, optionalAuthenticate } = authMiddleware;
const authHooks = require('./api/auth-hooks');

// Import webhook logger for debugging
const webhookLogger = require('./api/webhook-logger');

// Import Checkfront webhook handler
const checkfrontWebhook = require('./api/checkfront-webhook');

// Import add-ons management
const addonsManagement = require('./api/addons-management');

// Import checklist API
const checklistApi = require('./api/checklist-api');

// Security middleware with exceptions for shift confirmation and checklist pages
app.use((req, res, next) => {
  // Skip helmet CSP for pages that need special script handling
  if (req.path === '/training/shift-confirmation.html' || 
      req.path === '/api/shift-response' ||
      req.path === '/' ||
      req.path === '/training/index.html' ||
      req.path === '/training/index-fixed.html' ||
      req.path === '/training/supabase-direct-test.html' ||
      req.path === '/training/index-bypass.html' ||
      req.path === '/training/auth-no-check.html' ||
      req.path === '/training/pre-departure-checklist.html' ||
      req.path === '/training/post-departure-checklist.html' ||
      req.path === '/training/pre-departure-checklist-ssr.html' ||
      req.path === '/training/post-departure-checklist-ssr.html' ||
      req.path === '/training/js-test.html' ||
      req.path.startsWith('/training/') && req.path.endsWith('-test.html')) {
    return next();
  }
  
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://unpkg.com", "https://maps.googleapis.com"],
        scriptSrcAttr: ["'unsafe-inline'"], // Allow inline event handlers
        styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
        imgSrc: ["'self'", "data:", "https:", "https://maps.gstatic.com", "https://maps.googleapis.com"],
        connectSrc: ["'self'", "https://etkugeooigiwahikrmzr.supabase.co", "https://api.airtable.com", "https://maps.googleapis.com", "wss://etkugeooigiwahikrmzr.supabase.co", "https://nominatim.openstreetmap.org"],
        fontSrc: ["'self'", "data:", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
        frameSrc: ["'self'", "https://www.google.com"]
      }
    }
  })(req, res, next);
});

// Configure CORS to allow Supabase connections
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'apikey']
}));
app.use(express.json());

// Specific route for shift confirmation page (before static middleware)
app.get('/training/shift-confirmation.html', (req, res) => {
  console.log('Serving shift-confirmation.html with query params:', req.query);
  const filePath = path.join(__dirname, 'training', 'shift-confirmation.html');
  console.log('File path:', filePath);
  
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error serving shift-confirmation.html:', err);
      res.status(404).send(`
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>File Not Found</title>
          </head>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>❌ Page Not Found</h1>
            <p>The confirmation page could not be loaded.</p>
            <p>Please contact management for assistance.</p>
          </body>
        </html>
      `);
    } else {
      console.log('Successfully served shift-confirmation.html');
    }
  });
});

// Add request logging to debug issues
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Middleware to prevent service worker caching of task scheduler pages
app.use((req, res, next) => {
  const excludedPaths = [
    '/training/task-scheduler.html',
    '/training/task-scheduler-debug.html', 
    '/training/unregister-sw.html',
    '/training/sw-force-update.html',
    '/task-scheduler.html',
    '/task-scheduler-debug.html',
    '/unregister-sw.html',
    '/sw-force-update.html'
  ];
  
  console.log('Middleware checking path:', req.path);
  
  if (excludedPaths.includes(req.path)) {
    console.log('Path matched excluded paths, setting no-cache headers');
    // Set headers to prevent any caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Service-Worker-Allowed', 'none'); // Prevent service worker from handling
  }
  next();
});

// Serve static files from the training directory
app.use(express.static(path.join(__dirname, 'training')));

// Add vessel maintenance routes
app.use('/api/vessels', vesselRoutes);

// Simple admin authentication middleware
const adminAuth = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'] || req.query.adminKey;
  const expectedKey = process.env.ADMIN_API_KEY || 'mbh-admin-2025';
  
  if (adminKey !== expectedKey) {
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized - Invalid admin key' 
    });
  }
  next();
};

// Config endpoint for frontend configuration
app.get('/api/config', (req, res) => {
    // Ensure environment variables are set
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        console.error('ERROR: SUPABASE_URL and SUPABASE_ANON_KEY must be set in Railway environment variables');
        return res.status(500).json({
            error: 'Server configuration error',
            message: 'Supabase configuration is missing. Please contact support.'
        });
    }
    
    res.json({
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
        API_BASE_URL: '', // Empty string means use relative URLs
        APP_URL: process.env.APP_URL || '' // Add APP_URL for proper URL handling
    });
});

// Daily Run Sheet API endpoints
app.get('/api/daily-run-sheet', async (req, res) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        const bookings = await dailyRunSheet.getDailyBookings(date);
        
        // Get unique vessels from bookings
        const vesselIds = [...new Set(bookings
            .map(b => b.fields['Boat']?.[0])
            .filter(Boolean)
        )];
        
        // Get status for all vessels
        const vesselStatuses = await dailyRunSheet.getAllVesselStatuses();
        
        // Filter to only vessels that have bookings today
        const activeVessels = vesselStatuses.filter(v => 
            vesselIds.includes(v.id)
        );
        
        // Get employee details for name mapping
        const employeeMap = await dailyRunSheet.getEmployeeDetails();
        
        // Extract and aggregate add-ons
        const addOnsSummary = dailyRunSheet.extractAddOns(bookings);
        
        // Process bookings for timeline
        const processedBookings = bookings.map(b => ({
            id: b.id,
            bookingCode: b.fields['Booking Code'],
            customerName: b.fields['Customer Name'],
            vesselId: b.fields['Boat']?.[0],
            vesselName: activeVessels.find(v => v.id === b.fields['Boat']?.[0])?.name || 'Unassigned',
            startTime: b.fields['Start Time'],
            finishTime: b.fields['Finish Time'],
            duration: b.fields['Duration'] || 4,
            addOns: b.fields['Add-ons'],
            onboardingStaff: b.fields['Onboarding Employee'],
            deloadingStaff: b.fields['Deloading Employee'],
            onboardingStaffName: b.fields['Onboarding Employee']?.[0] 
                ? employeeMap[b.fields['Onboarding Employee'][0]] || 'Unassigned'
                : 'Unassigned',
            deloadingStaffName: b.fields['Deloading Employee']?.[0]
                ? employeeMap[b.fields['Deloading Employee'][0]] || 'Unassigned'
                : 'Unassigned',
            onboardingTime: b.fields['Onboarding Time'],
            deloadingTime: b.fields['Deloading Time'],
            status: b.fields['Status'],
            totalAmount: b.fields['Total Amount'],
            preDepartureChecklist: b.fields['Pre Departure Checklist'],
            postDepartureChecklist: b.fields['Post Departure Checklist']
        }));
        
        // Calculate stats based on actual booking times
        // Use Sydney timezone for accurate time calculations
        const now = new Date();
        const sydneyTime = new Date(now.toLocaleString("en-US", {timeZone: "Australia/Sydney"}));
        const currentTime = sydneyTime.getHours() * 60 + sydneyTime.getMinutes(); // Convert to minutes for easier comparison
        
        // Helper function to parse time string to minutes
        const parseTime = (timeStr) => {
            if (!timeStr) return null;
            const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
            if (!match) return null;
            let [_, hours, minutes, period] = match;
            hours = parseInt(hours);
            minutes = parseInt(minutes);
            if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
            if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
            return hours * 60 + minutes;
        };
        
        let onWaterCount = 0;
        let preparingCount = 0;
        let returningCount = 0;
        
        // Check each booking's status based on current time
        console.log(`Current Sydney time: ${sydneyTime.toLocaleTimeString('en-AU')} (${currentTime} mins)`);
        
        bookings.forEach(booking => {
            const onboardingTime = parseTime(booking.fields['Onboarding Time']);
            const startTime = parseTime(booking.fields['Start Time']);
            const finishTime = parseTime(booking.fields['Finish Time']);
            const deloadingTime = parseTime(booking.fields['Deloading Time']);
            
            if (startTime !== null && finishTime !== null) {
                // Calculate returning soon time (30 mins before finish)
                const returningSoonTime = finishTime - 30;
                
                // Debug logging
                console.log(`Booking ${booking.fields['Customer Name']}: onboard=${booking.fields['Onboarding Time']}, start=${booking.fields['Start Time']} (${startTime}min), finish=${booking.fields['Finish Time']} (${finishTime}min)`);
                
                if (onboardingTime !== null && currentTime >= onboardingTime && currentTime < startTime) {
                    // Currently preparing (between onboarding time and start time)
                    preparingCount++;
                    console.log(`  -> Status: PREPARING (staff preparing boat)`);
                } else if (currentTime >= startTime && currentTime < returningSoonTime) {
                    // Currently on water (between start time and 30 mins before finish)
                    onWaterCount++;
                    console.log(`  -> Status: ON WATER`);
                } else if (currentTime >= returningSoonTime && currentTime < finishTime) {
                    // Returning soon (30 mins before finish time)
                    returningCount++;
                    console.log(`  -> Status: RETURNING SOON`);
                } else {
                    console.log(`  -> Status: NOT ACTIVE`);
                }
            }
        });
        
        const stats = {
            totalBookings: bookings.length,
            onWater: onWaterCount,
            preparing: preparingCount,
            returning: returningCount
        };
        
        console.log(`Stats calculated: Total=${stats.totalBookings}, OnWater=${stats.onWater}, Preparing=${stats.preparing}, Returning=${stats.returning}`);
        
        res.json({
            success: true,
            date,
            bookings: processedBookings,
            vessels: vesselStatuses,
            addOnsSummary,
            stats
        });
    } catch (error) {
        console.error('Error in daily run sheet:', error);
        console.error('Error details:', error.response?.data || error.stack);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Dashboard Overview API endpoint
app.get('/api/dashboard-overview', async (req, res) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        const overview = await dashboardOverview.getDashboardOverview(date);
        
        res.json({
            success: true,
            date,
            ...overview
        });
    } catch (error) {
        console.error('Error in dashboard overview:', error);
        console.error('Error details:', error.response?.data || error.stack);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Update vessel status (manual override for management)
app.post('/api/vessel-status', async (req, res) => {
    try {
        const { vesselId, status, notes } = req.body;
        
        // For now, just return success
        // In production, this would update Airtable
        res.json({ 
            success: true, 
            vesselId, 
            status,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Get real-time vessel locations
app.get('/api/vessel-locations', async (req, res) => {
    try {
        const vessels = await dailyRunSheet.getAllVesselStatuses();
        
        // Filter to only vessels with locations
        const locationsData = vessels
            .filter(v => v.location)
            .map(v => ({
                vesselId: v.id,
                vesselName: v.name,
                location: v.location,
                status: v.status,
                lastUpdate: v.lastUpdate
            }));
        
        res.json({
            success: true,
            locations: locationsData,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Add webhook logger routes (for debugging)
app.use('/api', webhookLogger);

// Add Checkfront webhook handler
app.use('/api/checkfront', checkfrontWebhook);

// Add Square webhook handler
const squareWebhook = require('./api/square-webhook');
app.use('/api', squareWebhook);

// Add add-ons management routes
app.use('/api/addons', addonsManagement);

// Add checklist API routes
app.use('/api/checklist', checklistApi);

// Server-side rendered checklist pages
const checklistRenderer = require('./api/checklist-renderer');
app.get('/training/pre-departure-checklist-ssr.html', (req, res) => {
    checklistRenderer.handleChecklistPage(req, res, 'pre-departure');
});
app.get('/training/post-departure-checklist-ssr.html', (req, res) => {
    checklistRenderer.handleChecklistPage(req, res, 'post-departure');
});
app.post('/api/checklist/submit-rendered', checklistRenderer.handleChecklistSubmission);

// Announcements API endpoints
app.get('/api/announcements', async (req, res) => {
  try {
    const includeExpired = req.query.includeExpired === 'true';
    const result = await announcements.getAnnouncements(includeExpired);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/announcements', async (req, res) => {
  try {
    const result = await announcements.createAnnouncement(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.patch('/api/announcements/:id', async (req, res) => {
  try {
    const result = await announcements.updateAnnouncement(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/announcements/:id', async (req, res) => {
  try {
    const result = await announcements.deleteAnnouncement(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check endpoint for troubleshooting
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseAnon: !!process.env.SUPABASE_ANON_KEY,
      hasSupabaseService: !!process.env.SUPABASE_SERVICE_KEY,
      hasAirtableKey: !!process.env.AIRTABLE_API_KEY,
      hasTwilioSid: !!process.env.TWILIO_ACCOUNT_SID,
      nodeEnv: process.env.NODE_ENV,
      railwayEnv: process.env.RAILWAY_ENVIRONMENT
    }
  });
});

// Task scheduler test endpoint
app.get('/api/task-scheduler-test', async (req, res) => {
  try {
    // Test Airtable connection
    const testUrl = 'https://api.airtable.com/v0/appPyOlmuQyAM6cJQ/tblKNgpHZ8sWHYuEt?maxRecords=1';
    const response = await axios({
      method: 'GET',
      url: testUrl,
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`
      }
    });
    
    res.json({
      status: 'ok',
      message: 'Task scheduler test successful',
      airtable: {
        connected: true,
        recordCount: response.data.records.length
      },
      env: {
        hasAirtableKey: !!process.env.AIRTABLE_API_KEY
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Task scheduler test failed',
      error: error.message,
      env: {
        hasAirtableKey: !!process.env.AIRTABLE_API_KEY
      }
    });
  }
});

// API proxy endpoint for Airtable requests
app.post('/api/airtable/*', async (req, res) => {
  try {
    // Extract the Airtable endpoint from the request path
    const airtablePath = req.path.replace('/api/airtable/', '');
    const airtableUrl = `https://api.airtable.com/v0/${airtablePath}`;
    
    // Forward the request to Airtable with the API key from environment variables
    const response = await axios({
      method: req.method,
      url: airtableUrl,
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      data: req.body,
      params: req.query
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Airtable API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || { message: 'Internal server error' }
    });
  }
});

app.get('/api/airtable/*', async (req, res) => {
  try {
    const airtablePath = req.path.replace('/api/airtable/', '');
    const airtableUrl = `https://api.airtable.com/v0/${airtablePath}`;
    
    const response = await axios({
      method: 'GET',
      url: airtableUrl,
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`
      },
      params: req.query
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Airtable API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || { message: 'Internal server error' }
    });
  }
});

// PATCH endpoint for Airtable updates
app.patch('/api/airtable/*', async (req, res) => {
  try {
    const airtablePath = req.path.replace('/api/airtable/', '');
    const airtableUrl = `https://api.airtable.com/v0/${airtablePath}`;
    
    const response = await axios({
      method: 'PATCH',
      url: airtableUrl,
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      data: req.body
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Airtable API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || { message: 'Internal server error' }
    });
  }
});

// DELETE endpoint for Airtable
app.delete('/api/airtable/*', async (req, res) => {
  try {
    const airtablePath = req.path.replace('/api/airtable/', '');
    const airtableUrl = `https://api.airtable.com/v0/${airtablePath}`;
    
    const response = await axios({
      method: 'DELETE',
      url: airtableUrl,
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Airtable API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || { message: 'Internal server error' }
    });
  }
});

// Note: The /api/config endpoint has been moved earlier in the file
// to consolidate all frontend configuration in one place

// Role Management API endpoints
// Get current user role and permissions
app.get('/api/user/role', authenticate, roleManager.getCurrentUserRole);

// Sync roles from Airtable (admin only)
app.post('/api/admin/sync-roles', adminAuth, async (req, res) => {
  try {
    const results = await roleManager.syncAllEmployeeRoles();
    res.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error syncing roles:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Sync single user role (admin only)
app.post('/api/admin/sync-user-role', adminAuth, async (req, res) => {
  try {
    const { airtableEmployeeId, email } = req.body;
    
    if (!airtableEmployeeId || !email) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: airtableEmployeeId and email'
      });
    }
    
    const result = await roleManager.syncEmployeeRole(airtableEmployeeId, email);
    res.json({
      success: result.success,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error syncing user role:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Check user permissions (for client-side feature flags)
app.get('/api/user/permissions', authenticate, async (req, res) => {
  try {
    const userEmail = req.user.email;
    console.log('✅ Permission check for user:', userEmail);
    console.log('User object:', req.user);
    
    const role = await roleManager.getUserRole(userEmail);
    console.log('✅ User role from DB:', role);
    
    const permissions = {
      canViewAllStaff: await roleManager.hasRole(userEmail, ['admin', 'manager']),
      canManageAllocations: await roleManager.hasRole(userEmail, ['admin', 'manager']),
      canViewReports: await roleManager.hasRole(userEmail, ['admin', 'manager']),
      canManageSettings: await roleManager.hasRole(userEmail, ['admin']),
      canAccessManagementDashboard: await roleManager.hasRole(userEmail, ['admin', 'manager'])
    };
    
    console.log('User permissions:', permissions);
    
    res.json({
      success: true,
      email: userEmail,
      role: role || 'staff',
      permissions
    });
  } catch (error) {
    console.error('Error checking permissions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Simple test endpoint to verify server is responding
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    railwayEnv: process.env.RAILWAY_ENVIRONMENT
  });
});

// Simple JWT test endpoint - no middleware
app.get('/api/auth/test-jwt', async (req, res) => {
  console.log('=== Simple JWT Test ===');
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    const SUPABASE_URL = process.env.SUPABASE_URL || 'https://etkugeooigiwahikrmzr.supabase.co';
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0a3VnZW9vaWdpd2FoaWtybXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MDI0OTcsImV4cCI6MjA2ODM3ODQ5N30.OPIYLsnPNNF7dP3SDCODIurzaa3X_Q3xEhfPO3rLJxU';
    
    // Create client with auth header
    const authSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });
    
    const { data: { user }, error } = await authSupabase.auth.getUser();
    
    if (error) {
      return res.status(401).json({ 
        error: 'JWT verification failed', 
        details: error.message,
        code: error.code,
        status: error.status
      });
    }
    
    return res.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({ 
      error: 'Server error', 
      message: error.message 
    });
  }
});

// Production JWT debug endpoint
app.post('/api/auth/debug-jwt-production', async (req, res) => {
  console.log('🔍 JWT Debug Production');
  
  const authHeader = req.headers.authorization;
  
  const result = {
    timestamp: new Date().toISOString(),
    hasAuthHeader: !!authHeader,
    environment: {
      RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
      NODE_ENV: process.env.NODE_ENV,
      SUPABASE_URL: process.env.SUPABASE_URL,
      hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
      authMiddleware: process.env.RAILWAY_ENVIRONMENT === 'production' ? 'production' : 'v2'
    }
  };

  if (!authHeader) {
    result.error = 'No authorization header';
    return res.json(result);
  }

  try {
    // Use the same auth middleware that the server is using
    const user = await authMiddleware.verifyToken(req);
    
    result.verifyResult = user ? 'SUCCESS' : 'FAILED';
    result.user = user ? { id: user.id, email: user.email } : null;
    
    // Additional debugging
    if (!user) {
      // Try to decode the JWT to see what's in it
      const token = authHeader.substring(7);
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          result.tokenPayload = {
            sub: payload.sub,
            email: payload.email,
            exp: new Date(payload.exp * 1000).toISOString(),
            isExpired: Date.now() > payload.exp * 1000
          };
        }
      } catch (e) {
        result.tokenDecodeError = e.message;
      }
    }
    
    console.log('Production debug result:', result);
    
    res.json(result);
  } catch (error) {
    result.error = error.message;
    result.stack = error.stack;
    res.json(result);
  }
});

// Keep the old V2 endpoint for comparison
app.post('/api/auth/debug-jwt-v2', async (req, res) => {
  console.log('🔍 JWT Debug V2 - Using auth-middleware-v2 verifyToken');
  
  const authHeader = req.headers.authorization;
  const authMiddlewareV2 = require('./api/auth-middleware-v2');
  
  const result = {
    timestamp: new Date().toISOString(),
    hasAuthHeader: !!authHeader,
    environment: {
      SUPABASE_URL: process.env.SUPABASE_URL,
      hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY
    }
  };

  if (!authHeader) {
    result.error = 'No authorization header';
    return res.json(result);
  }

  try {
    // Use the exact same verifyToken function from auth-middleware-v2
    const user = await authMiddlewareV2.verifyToken(req);
    
    result.verifyResult = user ? 'SUCCESS' : 'FAILED';
    result.user = user ? { id: user.id, email: user.email } : null;
    
    console.log('Verify result:', result);
    
    res.json(result);
  } catch (error) {
    result.error = error.message;
    result.stack = error.stack;
    res.json(result);
  }
});

// JWT Debug endpoint - helps diagnose authentication issues
app.post('/api/auth/debug-jwt', async (req, res) => {
  console.log('=== JWT Debug Endpoint Called ===');
  
  const authHeader = req.headers.authorization;
  const result = {
    timestamp: new Date().toISOString(),
    headers: {
      authorization: authHeader ? 'Present' : 'Missing',
      contentType: req.headers['content-type'],
      origin: req.headers.origin,
      referer: req.headers.referer
    },
    environment: {
      SUPABASE_URL: process.env.SUPABASE_URL || 'Using default',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'Set' : 'Using default',
      NODE_ENV: process.env.NODE_ENV,
      RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT
    }
  };

  if (!authHeader) {
    result.error = 'No Authorization header found';
    return res.status(400).json(result);
  }

  if (!authHeader.startsWith('Bearer ')) {
    result.error = 'Authorization header does not start with "Bearer "';
    result.authHeaderValue = authHeader;
    return res.status(400).json(result);
  }

  const token = authHeader.substring(7);
  result.token = {
    length: token.length,
    preview: token.substring(0, 50) + '...'
  };

  // Try to decode the JWT without verification first
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      result.jwtStructure = 'Invalid - expected 3 parts, got ' + parts.length;
    } else {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      result.jwtPayload = {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
        iat: new Date(payload.iat * 1000).toISOString(),
        exp: new Date(payload.exp * 1000).toISOString(),
        isExpired: Date.now() > payload.exp * 1000
      };
    }
  } catch (decodeError) {
    result.jwtDecodeError = decodeError.message;
  }

  // Try to verify with Supabase
  try {
    const { createClient } = require('@supabase/supabase-js');
    const SUPABASE_URL = process.env.SUPABASE_URL || 'https://etkugeooigiwahikrmzr.supabase.co';
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0a3VnZW9vaWdpd2FoaWtybXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MDI0OTcsImV4cCI6MjA2ODM3ODQ5N30.OPIYLsnPNNF7dP3SDCODIurzaa3X_Q3xEhfPO3rLJxU';
    
    const authSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });
    
    const { data: { user }, error } = await authSupabase.auth.getUser();
    
    if (error) {
      result.supabaseError = {
        message: error.message,
        status: error.status,
        code: error.code,
        details: error
      };
    } else if (user) {
      result.supabaseUser = {
        id: user.id,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      };
      result.verificationStatus = 'SUCCESS';
    } else {
      result.verificationStatus = 'NO_USER';
    }
  } catch (verifyError) {
    result.verificationError = {
      message: verifyError.message,
      stack: verifyError.stack
    };
  }

  const statusCode = result.verificationStatus === 'SUCCESS' ? 200 : 401;
  res.status(statusCode).json(result);
});

// Login hook - sync user profile and role on login
app.post('/api/auth/login-hook', authHooks.loginHookHandler);

// Shift response endpoint - handles magic link clicks from SMS
app.get('/api/shift-response', async (req, res) => {
  console.log('Shift response endpoint called with query:', req.query);
  const { token } = req.query;
  
  if (!token) {
    console.log('No token provided in shift response');
    return res.status(400).send(`
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invalid Link</title>
        </head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>❌ Invalid Link</h1>
          <p>This link is invalid or has missing information.</p>
          <p>Please contact management for assistance.</p>
        </body>
      </html>
    `);
  }
  
  try {
    console.log('Processing shift response for token:', token);
    const result = await shiftResponseHandler.handleShiftResponse(token);
    console.log('Shift response result:', result);
    
    if (result.success) {
      // Build URL parameters for the confirmation page
      const confirmationParams = new URLSearchParams({
        status: 'success',
        action: result.action,
        date: result.shiftDetails?.date || '',
        time: result.shiftDetails?.time || '',
        type: result.shiftDetails?.type || '',
        customer: result.shiftDetails?.customer || ''
      });
      
      // Redirect to the standalone confirmation page (no auth required)
      const baseUrl = process.env.BASE_URL || 
                      (process.env.RAILWAY_ENVIRONMENT === 'development' 
                        ? 'https://mbh-development.up.railway.app' 
                        : 'https://mbh-production-f0d1.up.railway.app');
      const confirmationUrl = `${baseUrl}/training/shift-confirmation.html?${confirmationParams}`;
      console.log('Redirecting to confirmation page:', confirmationUrl);
      return res.redirect(302, confirmationUrl);
      
      // OLD CODE - keeping for reference
      /*
      const emoji = result.action === 'accepted' ? '✅' : '❌';
      const title = result.action === 'accepted' ? 'Shift Confirmed' : 'Shift Declined';
      
      res.send(`
        <html>
          <head>
            <title>${title}</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script>
              // Function to redirect properly
              function redirectToPortal() {
                // Use a simple redirect that works regardless of auth state
                // The dashboard has better auth handling than my-schedule
                const dashboardUrl = '${process.env.BASE_URL || 'https://mbh-production-f0d1.up.railway.app'}/training/dashboard.html';
                
                // Use replace to prevent back button issues
                window.location.replace(dashboardUrl);
              }
              
              // Show countdown and redirect
              let countdown = 3;
              const updateMessage = () => {
                const element = document.getElementById('redirect-message');
                if (element) {
                  if (countdown > 0) {
                    element.innerHTML = \`Redirecting to dashboard in \${countdown} seconds...\`;
                    countdown--;
                    setTimeout(updateMessage, 1000);
                  } else {
                    element.innerHTML = 'Redirecting to dashboard...';
                  }
                }
              };
              
              // Start countdown immediately
              document.addEventListener('DOMContentLoaded', updateMessage);
              
              // Redirect after 3 seconds to ensure page loads
              setTimeout(redirectToPortal, 3000);
            </script>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                text-align: center;
                padding: 50px 20px;
                background: #f0f4f8;
              }
              .container {
                max-width: 500px;
                margin: 0 auto;
                background: white;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              h1 { 
                color: ${result.action === 'accepted' ? '#27ae60' : '#e74c3c'};
                font-size: 2.5em;
                margin-bottom: 20px;
              }
              .details {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 5px;
                margin: 20px 0;
                text-align: left;
              }
              .detail-row {
                display: flex;
                justify-content: space-between;
                padding: 5px 0;
              }
              .portal-link {
                display: inline-block;
                margin-top: 20px;
                padding: 12px 30px;
                background: #2E86AB;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                border: none;
                font-size: 16px;
                cursor: pointer;
                transition: background 0.3s;
              }
              .portal-link:hover {
                background: #1B4F72;
              }
              .redirect-notice {
                font-size: 0.9rem;
                color: #999;
                margin-top: 15px;
                font-style: italic;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>${emoji} ${title}</h1>
              <p>${result.message}</p>
              
              ${result.shiftDetails ? `
                <div class="details">
                  <div class="detail-row">
                    <strong>Date:</strong>
                    <span>${result.shiftDetails.date}</span>
                  </div>
                  <div class="detail-row">
                    <strong>Time:</strong>
                    <span>${result.shiftDetails.time}</span>
                  </div>
                  <div class="detail-row">
                    <strong>Type:</strong>
                    <span>${result.shiftDetails.type}</span>
                  </div>
                </div>
              ` : ''}
              
              <a href="${process.env.BASE_URL || 'https://mbh-production-f0d1.up.railway.app'}/training/dashboard.html" class="portal-link">
                Go to Dashboard →
              </a>
              
              <p class="redirect-notice">
                <span id="redirect-message">Redirecting in 3 seconds...</span>
              </p>
            </div>
          </body>
        </html>
      `);
      */
    } else {
      // Error response
      console.log('Shift response failed:', result.error);
      res.status(result.statusCode || 400).send(`
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Error</title>
          </head>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>⚠️ Error Processing Response</h1>
            <p>${result.error}</p>
            <p>Please contact management directly.</p>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('Error handling shift response:', error);
    res.status(500).send(`
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Error</title>
        </head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>⚠️ System Error</h1>
          <p>An unexpected error occurred. Please contact management.</p>
        </body>
      </html>
    `);
  }
});

// API endpoint to trigger shift notifications (called from allocation form)
app.post('/api/send-shift-notification', async (req, res) => {
  try {
  const {
    employeeId,
    allocationId,
    shiftType,
    shiftDate,
    startTime,
    endTime,
    customerName,
    role,
    isBookingAllocation,
    notes,
    isUpdate,
    originalNotes
  } = req.body;
    
    // Fetch employee details from Airtable
    const employeeResponse = await axios.get(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID || 'applkAFOn2qxtu7tx'}/tbltAE4NlNePvnkpY/${employeeId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`
        }
      }
    );
    
    const employee = employeeResponse.data.fields;
    const employeePhone = employee['Phone'] || employee['Mobile'] || employee['Mobile Number'];
    
    if (!employeePhone) {
      return res.status(400).json({
        success: false,
        error: 'Employee has no phone number on file'
      });
    }
    
    // Send the notification
    const result = await notifications.sendShiftNotification({
      employeePhone,
      employeeName: employee['Name'] || employee['First Name'],
      allocationId,
      employeeId,
      shiftType,
      shiftDate,
      startTime,
      endTime,
      customerName,
      role,
      isBookingAllocation,
      notes,
      isUpdate,
      originalNotes
    });
    
    res.json(result);
    
  } catch (error) {
    console.error('Error sending shift notification:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API endpoint to get shift status
app.get('/api/shift-status/:allocationId', async (req, res) => {
  try {
    const status = await shiftResponseHandler.getShiftStatus(req.params.allocationId);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Quick allocation status update (for mobile quick actions)
app.post('/api/allocations/update-status', async (req, res) => {
  const updateStatusHandler = require('./api/allocations/update-status');
  updateStatusHandler(req, res);
});

// Update booking allocation (staff assignment and times)
app.post('/api/update-allocation', authenticate, async (req, res) => {
  const updateAllocationHandler = require('./api/update-allocation');
  updateAllocationHandler(req, res);
});

// Default route - serve the index page which handles authentication
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'training', 'index.html'));
});

// Legacy redirects - now handled by index.html
app.get('/index.html', (req, res) => {
  res.redirect('/');
});

app.get('/training/index.html', (req, res) => {
  res.redirect('/');
});

// Route for training resources (previously index.html)
app.get('/training-resources.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'training', 'training-resources.html'));
});

app.get('/training/training-resources.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'training', 'training-resources.html'));
});

// Explicit routes for dashboard
app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'training', 'dashboard.html'));
});

app.get('/training/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'training', 'dashboard.html'));
});

// Explicit routes for task scheduler pages to bypass service worker
app.get('/training/task-scheduler.html', (req, res) => {
  console.log('Task scheduler route hit:', req.path);
  const filePath = path.join(__dirname, 'training', 'task-scheduler.html');
  console.log('Attempting to serve file:', filePath);
  
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error serving task-scheduler.html:', err);
      res.status(500).send('Error loading task scheduler');
    } else {
      console.log('Successfully served task-scheduler.html');
    }
  });
});

app.get('/training/task-scheduler-debug.html', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, 'training', 'task-scheduler-debug.html'));
});

app.get('/training/unregister-sw.html', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, 'training', 'unregister-sw.html'));
});

app.get('/training/sw-force-update.html', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, 'training', 'sw-force-update.html'));
});

// Also handle routes without /training/ prefix (served by static middleware)
app.get('/task-scheduler.html', (req, res) => {
  console.log('Root task scheduler route hit:', req.path);
  const filePath = path.join(__dirname, 'training', 'task-scheduler.html');
  
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error serving task-scheduler.html from root:', err);
      res.status(500).send('Error loading task scheduler');
    } else {
      console.log('Successfully served task-scheduler.html from root');
    }
  });
});

// Test page route
app.get('/training/task-scheduler-test.html', (req, res) => {
  console.log('Test page route hit:', req.path);
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(__dirname, 'training', 'task-scheduler-test.html'));
});

// Admin endpoint to manually trigger reminder check
app.post('/api/admin/trigger-reminders', adminAuth, async (req, res) => {
  try {
    console.log('Manual reminder check triggered by admin');
    await reminderScheduler.checkAndSendReminders();
    res.json({ 
      success: true, 
      message: 'Reminder check completed',
      trackerSize: reminderScheduler.reminderTracker.size
    });
  } catch (error) {
    console.error('Error in manual reminder trigger:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Admin endpoint to view reminder status
app.get('/api/admin/reminder-status', adminAuth, async (req, res) => {
  try {
    const status = {
      schedulerActive: true,
      storageType: 'Airtable fields',
      trackingFields: {
        shiftAllocations: {
          table: 'Shift Allocations',
          fields: ['Reminder Sent', 'Reminder Sent Date']
        },
        bookings: {
          table: 'Bookings Dashboard',
          fields: [
            'Onboarding Reminder Sent', 
            'Onboarding Reminder Sent Date',
            'Deloading Reminder Sent',
            'Deloading Reminder Sent Date'
          ]
        }
      },
      bookingTimeReminders: {
        active: true,
        checkInterval: '1 minute',
        recipients: 'Assigned staff + Full-Time staff'
      },
      message: 'Reminder tracking is now handled directly through Airtable fields to prevent duplicates across multiple instances.'
    };
    res.json(status);
  } catch (error) {
    console.error('Error fetching reminder status:', error);
    res.status(500).json({ 
      error: 'Failed to fetch reminder status',
      message: error.message 
    });
  }
});

// Admin endpoint to check booking reminder status
app.get('/api/admin/booking-reminder-status', adminAuth, (req, res) => {
  res.json({
    active: true,
    checkInterval: '1 minute',
    reminderTypes: ['Onboarding Time', 'Deloading Time'],
    recipients: 'Assigned staff + All Full-Time staff',
    features: [
      'SMS at exact Onboarding/Deloading times',
      'Includes vessel details and add-ons',
      'Direct links to checklists',
      'Duplicate prevention within 20 hours'
    ],
    timestamp: new Date().toISOString()
  });
});

// Admin endpoint to manually trigger booking reminder check
app.post('/api/admin/trigger-booking-reminders', adminAuth, async (req, res) => {
  try {
    const forceImmediate = req.body?.force === true || req.query?.force === 'true';
    await bookingReminderScheduler.processBookingReminders(forceImmediate);
    res.json({ 
      success: true, 
      message: forceImmediate 
        ? 'Booking reminders force-sent immediately' 
        : 'Booking reminder check triggered successfully',
      timestamp: new Date().toISOString(),
      forceImmediate
    });
  } catch (error) {
    console.error('Error triggering booking reminders:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to trigger booking reminder check',
      details: error.message 
    });
  }
});

// Catch-all route for HTML5 client-side routing
app.get('*', (req, res, next) => {
  // If it's not an API route and the file doesn't exist, serve dashboard
  if (!req.path.startsWith('/api/') && !req.path.includes('.')) {
    res.sendFile(path.join(__dirname, 'training', 'dashboard.html'));
  } else {
    // Pass to next handler if it's an API route or has a file extension
    next();
  }
});

// Create HTTP server for both Express and WebSocket
const http = require('http');
const server = http.createServer(app);

// Initialize WebSocket handler
const CalendarWebSocketHandler = require('./api/websocket-handler');
const wsHandler = new CalendarWebSocketHandler(server);

// Make WebSocket handler available to other modules
app.set('wsHandler', wsHandler);

// Railway requires binding to 0.0.0.0
const HOST = '0.0.0.0';
server.listen(PORT, HOST, () => {
  console.log(`MBH Staff Portal running on ${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`WebSocket server ready at ws://${HOST}:${PORT}/ws`);
  
  // Start the reminder schedulers
  reminderScheduler.startReminderScheduler();
  bookingReminderScheduler.startBookingReminderScheduler();
});

// Graceful shutdown handling
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
  console.log('\n🛑 Shutting down gracefully...');
  
  // Stop the reminder schedulers
  if (reminderScheduler && reminderScheduler.stopReminderScheduler) {
    reminderScheduler.stopReminderScheduler();
  }
  if (bookingReminderScheduler && bookingReminderScheduler.stopBookingReminderScheduler) {
    bookingReminderScheduler.stopBookingReminderScheduler();
  }
  
  // Close the HTTP server
  server.close(() => {
    console.log('HTTP server closed');
    
    // Close WebSocket connections
    if (wsHandler && wsHandler.wss) {
      wsHandler.wss.clients.forEach(client => {
        client.close();
      });
      wsHandler.wss.close(() => {
        console.log('WebSocket server closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}