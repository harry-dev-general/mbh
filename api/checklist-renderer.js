/**
 * Server-side renderer for checklist pages
 * Generates HTML with inline data to bypass client-side initialization issues
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service key for server-side operations
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

// Airtable configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const BOOKINGS_BASE_ID = 'applkAFOn2qxtu7tx';
const BOOKINGS_TABLE_ID = 'tblcBoyuVsbB1dt1I';
const EMPLOYEE_TABLE_ID = 'tbltAE4NlNePvnkpY';
const CHECKLIST_TABLE_ID = 'tblB34qRbdGWdKXQh';

/**
 * Fetch booking details from Airtable
 */
async function fetchBooking(bookingId) {
    const response = await fetch(
        `https://api.airtable.com/v0/${BOOKINGS_BASE_ID}/${BOOKINGS_TABLE_ID}/${bookingId}`,
        {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            }
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch booking: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

/**
 * Render pre-departure checklist HTML
 */
function renderPreDepartureChecklist(booking, employee) {
    const bookingData = booking.fields;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pre-Departure Checklist - MBH Staff Portal</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        /* Inline styles to ensure page works without external CSS */
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f7fa;
            color: #333;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: linear-gradient(135deg, #0066cc 0%, #004499 100%);
            color: white;
            padding: 20px;
            border-radius: 10px 10px 0 0;
            text-align: center;
        }
        
        .content {
            background: white;
            padding: 30px;
            border-radius: 0 0 10px 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .booking-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .booking-info h3 {
            margin-top: 0;
            color: #0066cc;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
        }
        
        .checklist-section {
            margin: 25px 0;
        }
        
        .checklist-section h3 {
            color: #0066cc;
            margin-bottom: 15px;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 10px;
        }
        
        .checklist-item {
            padding: 12px;
            margin: 8px 0;
            background: #f8f9fa;
            border-radius: 6px;
            display: flex;
            align-items: center;
            transition: all 0.3s ease;
        }
        
        .checklist-item:hover {
            background: #e9ecef;
        }
        
        .checklist-item input[type="checkbox"] {
            width: 20px;
            height: 20px;
            margin-right: 12px;
            cursor: pointer;
        }
        
        .checklist-item label {
            cursor: pointer;
            flex: 1;
        }
        
        .submit-section {
            margin-top: 30px;
            text-align: center;
        }
        
        .submit-btn {
            background: #28a745;
            color: white;
            border: none;
            padding: 15px 40px;
            font-size: 18px;
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.3s ease;
        }
        
        .submit-btn:hover {
            background: #218838;
        }
        
        .submit-btn:disabled {
            background: #6c757d;
            cursor: not-allowed;
        }
        
        .error-message {
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        
        .success-message {
            background: #d4edda;
            color: #155724;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><i class="fas fa-clipboard-check"></i> Pre-Departure Checklist</h1>
            <p>Manly Boat Hire - Staff Portal</p>
        </div>
        
        <div class="content">
            <div class="booking-info">
                <h3>Booking Details</h3>
                <div class="info-row">
                    <span><strong>Customer:</strong></span>
                    <span>${bookingData['Customer Name'] || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span><strong>Date:</strong></span>
                    <span>${bookingData['Booking Date'] || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span><strong>Vessel:</strong></span>
                    <span>${bookingData['Vessel'] || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span><strong>Departure Time:</strong></span>
                    <span>${bookingData['Departure Time'] || 'N/A'}</span>
                </div>
            </div>
            
            <form id="checklistForm" onsubmit="handleSubmit(event)">
                <input type="hidden" id="bookingId" value="${booking.id}">
                <input type="hidden" id="checklistType" value="Pre-Departure">
                
                <div class="checklist-section">
                    <h3>Safety Equipment</h3>
                    <div class="checklist-item">
                        <input type="checkbox" id="lifejackets" name="lifejackets" required>
                        <label for="lifejackets">Life jackets checked and onboard</label>
                    </div>
                    <div class="checklist-item">
                        <input type="checkbox" id="flares" name="flares" required>
                        <label for="flares">Flares checked and in date</label>
                    </div>
                    <div class="checklist-item">
                        <input type="checkbox" id="firstaid" name="firstaid" required>
                        <label for="firstaid">First aid kit checked</label>
                    </div>
                    <div class="checklist-item">
                        <input type="checkbox" id="fireextinguisher" name="fireextinguisher" required>
                        <label for="fireextinguisher">Fire extinguisher checked</label>
                    </div>
                </div>
                
                <div class="checklist-section">
                    <h3>Vessel Condition</h3>
                    <div class="checklist-item">
                        <input type="checkbox" id="hull" name="hull" required>
                        <label for="hull">Hull condition checked</label>
                    </div>
                    <div class="checklist-item">
                        <input type="checkbox" id="engine" name="engine" required>
                        <label for="engine">Engine started and running smoothly</label>
                    </div>
                    <div class="checklist-item">
                        <input type="checkbox" id="fuel" name="fuel" required>
                        <label for="fuel">Fuel level checked</label>
                    </div>
                    <div class="checklist-item">
                        <input type="checkbox" id="battery" name="battery" required>
                        <label for="battery">Battery condition checked</label>
                    </div>
                </div>
                
                <div class="checklist-section">
                    <h3>Customer Briefing</h3>
                    <div class="checklist-item">
                        <input type="checkbox" id="safety_brief" name="safety_brief" required>
                        <label for="safety_brief">Safety briefing completed</label>
                    </div>
                    <div class="checklist-item">
                        <input type="checkbox" id="operation_demo" name="operation_demo" required>
                        <label for="operation_demo">Vessel operation demonstrated</label>
                    </div>
                    <div class="checklist-item">
                        <input type="checkbox" id="boundaries" name="boundaries" required>
                        <label for="boundaries">Operating boundaries explained</label>
                    </div>
                    <div class="checklist-item">
                        <input type="checkbox" id="return_time" name="return_time" required>
                        <label for="return_time">Return time confirmed</label>
                    </div>
                </div>
                
                <div class="submit-section">
                    <button type="submit" class="submit-btn" id="submitBtn">
                        <i class="fas fa-check-circle"></i> Submit Checklist
                    </button>
                </div>
            </form>
            
            <div id="successMessage" class="success-message" style="display: none;">
                <h3><i class="fas fa-check-circle"></i> Checklist Submitted Successfully!</h3>
                <p>The pre-departure checklist has been recorded.</p>
            </div>
        </div>
    </div>
    
    <script>
        // Inline JavaScript to handle form submission
        async function handleSubmit(event) {
            event.preventDefault();
            
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            
            try {
                // Collect form data
                const formData = new FormData(event.target);
                const checklistData = {};
                
                // Get all checkboxes
                const checkboxes = event.target.querySelectorAll('input[type="checkbox"]');
                checkboxes.forEach(checkbox => {
                    checklistData[checkbox.name] = checkbox.checked;
                });
                
                // Submit to server
                const response = await fetch('/api/checklist/submit-rendered', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        bookingId: document.getElementById('bookingId').value,
                        checklistType: document.getElementById('checklistType').value,
                        data: checklistData,
                        submittedBy: '${employee ? employee.fields.Name : 'Staff Member'}'
                    })
                });
                
                if (!response.ok) {
                    throw new Error('Failed to submit checklist');
                }
                
                // Show success message
                document.getElementById('checklistForm').style.display = 'none';
                document.getElementById('successMessage').style.display = 'block';
                
            } catch (error) {
                console.error('Error submitting checklist:', error);
                alert('Failed to submit checklist. Please try again.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Submit Checklist';
            }
        }
    </script>
</body>
</html>
    `;
}

/**
 * Render post-departure checklist HTML
 */
function renderPostDepartureChecklist(booking, employee) {
    const bookingData = booking.fields;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Post-Departure Checklist - MBH Staff Portal</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        /* Same styles as pre-departure */
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f7fa;
            color: #333;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: linear-gradient(135deg, #0066cc 0%, #004499 100%);
            color: white;
            padding: 20px;
            border-radius: 10px 10px 0 0;
            text-align: center;
        }
        
        .content {
            background: white;
            padding: 30px;
            border-radius: 0 0 10px 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .booking-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .booking-info h3 {
            margin-top: 0;
            color: #0066cc;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
        }
        
        .checklist-section {
            margin: 25px 0;
        }
        
        .checklist-section h3 {
            color: #0066cc;
            margin-bottom: 15px;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 10px;
        }
        
        .checklist-item {
            padding: 12px;
            margin: 8px 0;
            background: #f8f9fa;
            border-radius: 6px;
            display: flex;
            align-items: center;
            transition: all 0.3s ease;
        }
        
        .checklist-item:hover {
            background: #e9ecef;
        }
        
        .checklist-item input[type="checkbox"] {
            width: 20px;
            height: 20px;
            margin-right: 12px;
            cursor: pointer;
        }
        
        .checklist-item label {
            cursor: pointer;
            flex: 1;
        }
        
        .notes-section {
            margin: 25px 0;
        }
        
        .notes-section textarea {
            width: 100%;
            min-height: 100px;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-family: inherit;
            resize: vertical;
        }
        
        .submit-section {
            margin-top: 30px;
            text-align: center;
        }
        
        .submit-btn {
            background: #28a745;
            color: white;
            border: none;
            padding: 15px 40px;
            font-size: 18px;
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.3s ease;
        }
        
        .submit-btn:hover {
            background: #218838;
        }
        
        .submit-btn:disabled {
            background: #6c757d;
            cursor: not-allowed;
        }
        
        .success-message {
            background: #d4edda;
            color: #155724;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><i class="fas fa-clipboard-check"></i> Post-Departure Checklist</h1>
            <p>Manly Boat Hire - Staff Portal</p>
        </div>
        
        <div class="content">
            <div class="booking-info">
                <h3>Booking Details</h3>
                <div class="info-row">
                    <span><strong>Customer:</strong></span>
                    <span>${bookingData['Customer Name'] || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span><strong>Date:</strong></span>
                    <span>${bookingData['Booking Date'] || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span><strong>Vessel:</strong></span>
                    <span>${bookingData['Vessel'] || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span><strong>Return Time:</strong></span>
                    <span>${bookingData['Return Time'] || 'N/A'}</span>
                </div>
            </div>
            
            <form id="checklistForm" onsubmit="handleSubmit(event)">
                <input type="hidden" id="bookingId" value="${booking.id}">
                <input type="hidden" id="checklistType" value="Post-Departure">
                
                <div class="checklist-section">
                    <h3>Vessel Return Condition</h3>
                    <div class="checklist-item">
                        <input type="checkbox" id="vessel_cleaned" name="vessel_cleaned" required>
                        <label for="vessel_cleaned">Vessel cleaned and tidy</label>
                    </div>
                    <div class="checklist-item">
                        <input type="checkbox" id="equipment_returned" name="equipment_returned" required>
                        <label for="equipment_returned">All equipment returned</label>
                    </div>
                    <div class="checklist-item">
                        <input type="checkbox" id="no_damage" name="no_damage" required>
                        <label for="no_damage">No damage to vessel</label>
                    </div>
                    <div class="checklist-item">
                        <input type="checkbox" id="fuel_topped" name="fuel_topped" required>
                        <label for="fuel_topped">Fuel topped up (if required)</label>
                    </div>
                </div>
                
                <div class="checklist-section">
                    <h3>Safety Equipment Check</h3>
                    <div class="checklist-item">
                        <input type="checkbox" id="lifejackets_returned" name="lifejackets_returned" required>
                        <label for="lifejackets_returned">All life jackets returned</label>
                    </div>
                    <div class="checklist-item">
                        <input type="checkbox" id="safety_equipment_complete" name="safety_equipment_complete" required>
                        <label for="safety_equipment_complete">All safety equipment accounted for</label>
                    </div>
                </div>
                
                <div class="checklist-section">
                    <h3>Customer Feedback</h3>
                    <div class="checklist-item">
                        <input type="checkbox" id="customer_satisfied" name="customer_satisfied" required>
                        <label for="customer_satisfied">Customer satisfied with experience</label>
                    </div>
                    <div class="checklist-item">
                        <input type="checkbox" id="no_incidents" name="no_incidents" required>
                        <label for="no_incidents">No incidents reported</label>
                    </div>
                </div>
                
                <div class="notes-section">
                    <h3>Additional Notes</h3>
                    <textarea id="notes" name="notes" placeholder="Any additional comments or observations..."></textarea>
                </div>
                
                <div class="submit-section">
                    <button type="submit" class="submit-btn" id="submitBtn">
                        <i class="fas fa-check-circle"></i> Submit Checklist
                    </button>
                </div>
            </form>
            
            <div id="successMessage" class="success-message" style="display: none;">
                <h3><i class="fas fa-check-circle"></i> Checklist Submitted Successfully!</h3>
                <p>The post-departure checklist has been recorded.</p>
            </div>
        </div>
    </div>
    
    <script>
        // Inline JavaScript to handle form submission
        async function handleSubmit(event) {
            event.preventDefault();
            
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            
            try {
                // Collect form data
                const formData = new FormData(event.target);
                const checklistData = {};
                
                // Get all checkboxes
                const checkboxes = event.target.querySelectorAll('input[type="checkbox"]');
                checkboxes.forEach(checkbox => {
                    checklistData[checkbox.name] = checkbox.checked;
                });
                
                // Add notes
                checklistData.notes = document.getElementById('notes').value;
                
                // Submit to server
                const response = await fetch('/api/checklist/submit-rendered', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        bookingId: document.getElementById('bookingId').value,
                        checklistType: document.getElementById('checklistType').value,
                        data: checklistData,
                        submittedBy: '${employee ? employee.fields.Name : 'Staff Member'}'
                    })
                });
                
                if (!response.ok) {
                    throw new Error('Failed to submit checklist');
                }
                
                // Show success message
                document.getElementById('checklistForm').style.display = 'none';
                document.getElementById('successMessage').style.display = 'block';
                
            } catch (error) {
                console.error('Error submitting checklist:', error);
                alert('Failed to submit checklist. Please try again.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Submit Checklist';
            }
        }
    </script>
</body>
</html>
    `;
}

/**
 * Handle checklist page requests
 */
async function handleChecklistPage(req, res, checklistType) {
    try {
        const { bookingId } = req.query;
        
        if (!bookingId) {
            return res.status(400).send('Missing booking ID');
        }
        
        // Fetch booking details
        const booking = await fetchBooking(bookingId);
        
        if (!booking || booking.fields.Status !== 'PAID') {
            return res.status(404).send('Booking not found or not in PAID status');
        }
        
        // For SMS access, we don't have employee context
        // In a real implementation, you might want to track this differently
        const employee = null;
        
        // Render appropriate checklist
        let html;
        if (checklistType === 'pre-departure') {
            html = renderPreDepartureChecklist(booking, employee);
        } else {
            html = renderPostDepartureChecklist(booking, employee);
        }
        
        // Send rendered HTML
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
        
    } catch (error) {
        console.error('Error rendering checklist:', error);
        res.status(500).send(`
            <html>
                <body style="font-family: Arial; padding: 20px;">
                    <h2>Error Loading Checklist</h2>
                    <p>We encountered an error loading the checklist. Please try again or contact support.</p>
                    <p style="color: #666; font-size: 14px;">Error: ${error.message}</p>
                </body>
            </html>
        `);
    }
}

/**
 * Handle checklist submission from rendered pages
 */
async function handleChecklistSubmission(req, res) {
    try {
        const { bookingId, checklistType, data, submittedBy } = req.body;
        
        // Create checklist record in Airtable
        const response = await fetch(
            `https://api.airtable.com/v0/${BOOKINGS_BASE_ID}/${CHECKLIST_TABLE_ID}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fields: {
                        'Booking': [bookingId],
                        'Checklist Type': checklistType,
                        'Submitted By': submittedBy,
                        'Submission Date': new Date().toISOString(),
                        'Checklist Data': JSON.stringify(data),
                        'Status': 'Completed'
                    }
                })
            }
        );
        
        if (!response.ok) {
            throw new Error('Failed to save checklist');
        }
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Error submitting checklist:', error);
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    handleChecklistPage,
    handleChecklistSubmission
};
