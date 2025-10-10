require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Import notification handlers
const notifications = require('./api/notifications');
const shiftResponseHandler = require('./api/shift-response-handler');
const announcements = require('./api/announcements');

// Import vessel maintenance routes
const vesselRoutes = require('./api/routes/vessel-maintenance');

// Import daily run sheet module
const dailyRunSheet = require('./api/daily-run-sheet');
// Import dashboard overview module
const dashboardOverview = require('./api/dashboard-overview');

// Import webhook logger for debugging
const webhookLogger = require('./api/webhook-logger');

// Import Checkfront webhook handler
const checkfrontWebhook = require('./api/checkfront-webhook');

// Import add-ons management
const addonsManagement = require('./api/addons-management');

// Security middleware with exceptions for shift confirmation
app.use((req, res, next) => {
  // Skip helmet CSP for shift confirmation page to avoid loading issues
  if (req.path === '/training/shift-confirmation.html' || req.path === '/api/shift-response') {
    return next();
  }
  
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://unpkg.com", "https://maps.googleapis.com"],
        scriptSrcAttr: ["'unsafe-inline'"], // Allow inline event handlers
        styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https:", "https://maps.gstatic.com", "https://maps.googleapis.com"],
        connectSrc: ["'self'", "https://etkugeooigiwahikrmzr.supabase.co", "https://api.airtable.com", "https://maps.googleapis.com"],
        fontSrc: ["'self'", "data:", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
        frameSrc: ["'self'", "https://www.google.com"]
      }
    }
  })(req, res, next);
});

app.use(cors());
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

// Serve static files from the training directory
app.use(express.static(path.join(__dirname, 'training')));

// Add vessel maintenance routes
app.use('/api/vessels', vesselRoutes);

// Config endpoint for frontend configuration
app.get('/api/config', (req, res) => {
    res.json({
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
        SUPABASE_URL: process.env.SUPABASE_URL || 'https://etkugeooigiwahikrmzr.supabase.co',
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0a3VnZW9vaWdpd2FoaWtybXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MDI0OTcsImV4cCI6MjA2ODM3ODQ5N30.OPIYLsnPNNF7dP3SDCODIurzaa3X_Q3xEhfPO3rLJxU',
        API_BASE_URL: '' // Empty string means use relative URLs
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

// Note: The /api/config endpoint has been moved earlier in the file
// to consolidate all frontend configuration in one place

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

// Default route - serve the dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'training', 'dashboard.html'));
});

// Redirect from index.html to dashboard (for legacy links)
app.get('/index.html', (req, res) => {
  res.redirect('/dashboard.html');
});

app.get('/training/index.html', (req, res) => {
  res.redirect('/training/dashboard.html');
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

// Catch-all route for HTML5 client-side routing
app.get('*', (req, res) => {
  // If it's not an API route and the file doesn't exist, serve dashboard
  if (!req.path.startsWith('/api/') && !req.path.includes('.')) {
    res.sendFile(path.join(__dirname, 'training', 'dashboard.html'));
  }
});

app.listen(PORT, () => {
  console.log(`MBH Staff Portal running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});