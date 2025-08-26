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

// Security middleware
app.use(helmet({
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
}));

app.use(cors());
app.use(express.json());

// Serve static files from the training directory
app.use(express.static(path.join(__dirname, 'training')));

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

// Environment variables endpoint (for client-side configuration)
app.get('/api/config', (req, res) => {
  res.json({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    // Don't expose the Airtable API key
    API_BASE_URL: ''  // Empty string means use relative URLs
  });
});

// Shift response endpoint - handles magic link clicks from SMS
app.get('/api/shift-response', async (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    return res.status(400).send(`
      <html>
        <head><title>Invalid Link</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>❌ Invalid Link</h1>
          <p>This link is invalid or has missing information.</p>
          <p>Please contact management for assistance.</p>
        </body>
      </html>
    `);
  }
  
  try {
    const result = await shiftResponseHandler.handleShiftResponse(token);
    
    if (result.success) {
      // Successful response - show confirmation page
      const emoji = result.action === 'accepted' ? '✅' : '❌';
      const title = result.action === 'accepted' ? 'Shift Confirmed' : 'Shift Declined';
      
      res.send(`
        <html>
          <head>
            <title>${title}</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
                transition: background 0.3s;
              }
              .portal-link:hover {
                background: #1B4F72;
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
              
              <a href="/training/my-schedule.html" class="portal-link">
                View My Schedule →
              </a>
            </div>
          </body>
        </html>
      `);
    } else {
      // Error response
      res.status(result.statusCode || 400).send(`
        <html>
          <head><title>Error</title></head>
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
        <head><title>Error</title></head>
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
      isBookingAllocation
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
    const employeePhone = employee['Phone'] || employee['Mobile'];
    
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
      isBookingAllocation
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