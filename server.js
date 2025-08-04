require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://etkugeooigiwahikrmzr.supabase.co", "https://api.airtable.com"],
      fontSrc: ["'self'", "data:"]
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

// Default route - serve the dashboard
app.get('/', (req, res) => {
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