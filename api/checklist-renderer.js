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
const BOOKINGS_TABLE_ID = 'tblRe0cDmK3bG2kPf'; // Bookings Dashboard table (correct ID)
const EMPLOYEE_TABLE_ID = 'tbltAE4NlNePvnkpY';
// Separate table IDs for each checklist type
const PRE_DEPARTURE_CHECKLIST_TABLE_ID = 'tbl9igu5g1bPG4Ahu';
const POST_DEPARTURE_CHECKLIST_TABLE_ID = 'tblYkbSQGP6zveYNi';

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
                    <span>${bookingData['Boat'] && bookingData['Boat'].length > 0 ? bookingData['Boat'][0] : 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span><strong>Departure Time:</strong></span>
                    <span>${bookingData['Departure Time'] || 'N/A'}</span>
                </div>
            </div>
            
            <form id="checklistForm" onsubmit="handleSubmit(event)">
                <input type="hidden" id="bookingId" value="${booking.id}">
                <input type="hidden" id="checklistType" value="Pre-Departure">
                
                <!-- Staff Identification -->
                <div class="checklist-section" style="background: #fff3cd; border: 1px solid #ffeaa7; margin-bottom: 20px;">
                    <h3 style="color: #856404; margin-bottom: 15px;">
                        <i class="fas fa-user"></i> Staff Information (Required)
                    </h3>
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label for="staffName">Your Name</label>
                        <input type="text" id="staffName" name="staffName" required 
                               style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;"
                               placeholder="Enter your full name">
                    </div>
                    <div class="form-group">
                        <label for="staffPhone">Your Phone Number</label>
                        <input type="tel" id="staffPhone" name="staffPhone" required 
                               style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;"
                               placeholder="Enter your mobile number">
                    </div>
                </div>
                
                <div class="checklist-section">
                    <h3><i class="fas fa-life-ring"></i> Safety Equipment</h3>
                    
                    <div class="form-group">
                        <label for="lifeJackets">Life Jackets Count</label>
                        <input type="number" id="lifeJackets" name="lifeJackets" min="0" max="50" required
                               style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                    </div>

                    <div class="checklist-item">
                        <input type="checkbox" id="safetyEquipment" name="safetyEquipment">
                        <label for="safetyEquipment">Safety Equipment Check (flares, first aid, etc.)</label>
                    </div>
                    
                    <div class="checklist-item">
                        <input type="checkbox" id="fireExtinguisher" name="fireExtinguisher">
                        <label for="fireExtinguisher">Fire Extinguisher Check</label>
                    </div>
                </div>
                
                <!-- Fuel & Resources -->
                <div class="checklist-section">
                    <h3><i class="fas fa-gas-pump"></i> Fuel & Resources</h3>
                    
                    <div class="form-group">
                        <label>Fuel Level Check</label>
                        <select id="fuelLevel" name="fuelLevel" class="form-control" required 
                                style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                            <option value="">Select Level</option>
                            <option value="Empty">Empty</option>
                            <option value="Quarter">Quarter</option>
                            <option value="Half">Half</option>
                            <option value="Three-Quarter">3/4</option>
                            <option value="Full">Full</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Gas Bottle Check</label>
                        <select id="gasLevel" name="gasLevel" class="form-control" required
                                style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                            <option value="">Select Level</option>
                            <option value="Empty">Empty</option>
                            <option value="Quarter">Quarter</option>
                            <option value="Half">Half</option>
                            <option value="Three-Quarter">3/4</option>
                            <option value="Full">Full</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Water Tank Level</label>
                        <select id="waterLevel" name="waterLevel" class="form-control" required
                                style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                            <option value="">Select Level</option>
                            <option value="Empty">Empty</option>
                            <option value="Quarter">Quarter</option>
                            <option value="Half">Half</option>
                            <option value="Three-Quarter">3/4</option>
                            <option value="Full">Full</option>
                        </select>
                    </div>

                    <div class="checklist-item">
                        <input type="checkbox" id="fuelRefilled" name="fuelRefilled">
                        <label for="fuelRefilled">Fuel Refilled (if needed)</label>
                    </div>

                    <div class="checklist-item">
                        <input type="checkbox" id="gasReplaced" name="gasReplaced">
                        <label for="gasReplaced">Gas Bottle Replaced (if needed)</label>
                    </div>

                    <div class="checklist-item">
                        <input type="checkbox" id="waterRefilled" name="waterRefilled">
                        <label for="waterRefilled">Water Tank Refilled (if needed)</label>
                    </div>
                </div>
                
                <!-- Cleanliness -->
                <div class="checklist-section">
                    <h3><i class="fas fa-broom"></i> Cleanliness</h3>
                    
                    <div class="checklist-item">
                        <input type="checkbox" id="bbqCleaned" name="bbqCleaned">
                        <label for="bbqCleaned">BBQ Cleaned</label>
                    </div>

                    <div class="checklist-item">
                        <input type="checkbox" id="toiletCleaned" name="toiletCleaned">
                        <label for="toiletCleaned">Toilet Cleaned</label>
                    </div>

                    <div class="checklist-item">
                        <input type="checkbox" id="deckWashed" name="deckWashed">
                        <label for="deckWashed">Deck Washed</label>
                    </div>
                </div>
                
                <!-- Vessel Condition -->
                <div class="checklist-section">
                    <h3><i class="fas fa-ship"></i> Vessel Condition</h3>
                    
                    <div class="form-group">
                        <label>Overall Vessel Condition</label>
                        <select id="overallCondition" name="overallCondition" class="form-control" required
                                style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                            <option value="">Select Condition</option>
                            <option value="Ready">Ready for Use</option>
                            <option value="Issues Found">Issues Found</option>
                        </select>
                    </div>

                    <div class="checklist-item">
                        <input type="checkbox" id="anchorSecured" name="anchorSecured">
                        <label for="anchorSecured">Anchor Secured</label>
                    </div>

                    <div class="checklist-item">
                        <input type="checkbox" id="lightsWorking" name="lightsWorking">
                        <label for="lightsWorking">All Lights Working</label>
                    </div>

                    <div class="checklist-item">
                        <input type="checkbox" id="engine" name="engine" required>
                        <label for="engine">Engine started and running smoothly</label>
                    </div>

                    <div class="checklist-item">
                        <input type="checkbox" id="battery" name="battery" required>
                        <label for="battery">Battery condition checked</label>
                    </div>
                    
                    <div class="form-group">
                        <label for="notes">Notes (Optional)</label>
                        <textarea id="notes" name="notes" rows="4" 
                                  style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;"
                                  placeholder="Any issues or observations..."></textarea>
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
                const checklistData = {
                    // Staff Information
                    staffName: document.getElementById('staffName')?.value,
                    staffPhone: document.getElementById('staffPhone')?.value,
                    
                    // Resource levels
                    fuelLevel: document.getElementById('fuelLevel')?.value,
                    gasLevel: document.getElementById('gasLevel')?.value,
                    waterLevel: document.getElementById('waterLevel')?.value,
                    
                    // Cleanliness
                    bbqCleaned: document.getElementById('bbqCleaned')?.checked,
                    toiletCleaned: document.getElementById('toiletCleaned')?.checked,
                    deckWashed: document.getElementById('deckWashed')?.checked,
                    
                    // Safety equipment
                    lifeJackets: document.getElementById('lifeJackets')?.value,
                    safetyEquipment: document.getElementById('safetyEquipment')?.checked,
                    fireExtinguisher: document.getElementById('fireExtinguisher')?.checked,
                    
                    // Refill tracking
                    fuelRefilled: document.getElementById('fuelRefilled')?.checked,
                    gasReplaced: document.getElementById('gasReplaced')?.checked,
                    waterRefilled: document.getElementById('waterRefilled')?.checked,
                    
                    // Vessel condition
                    overallCondition: document.getElementById('overallCondition')?.value,
                    anchorSecured: document.getElementById('anchorSecured')?.checked,
                    lightsWorking: document.getElementById('lightsWorking')?.checked,
                    engine: document.getElementById('engine')?.checked,
                    battery: document.getElementById('battery')?.checked,
                    
                    // Notes
                    notes: document.getElementById('notes')?.value,
                    
                    // Customer briefing (existing checkboxes)
                    safety_brief: document.getElementById('safety_brief')?.checked,
                    operation_demo: document.getElementById('operation_demo')?.checked,
                    boundaries: document.getElementById('boundaries')?.checked,
                    return_time: document.getElementById('return_time')?.checked
                };
                
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
                    <span>${bookingData['Boat'] && bookingData['Boat'].length > 0 ? bookingData['Boat'][0] : 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span><strong>Return Time:</strong></span>
                    <span>${bookingData['Return Time'] || 'N/A'}</span>
                </div>
            </div>
            
            <form id="checklistForm" onsubmit="handleSubmit(event)">
                <input type="hidden" id="bookingId" value="${booking.id}">
                <input type="hidden" id="checklistType" value="Post-Departure">
                
                <!-- Staff Identification -->
                <div class="checklist-section" style="background: #fff3cd; border: 1px solid #ffeaa7; margin-bottom: 20px;">
                    <h3 style="color: #856404; margin-bottom: 15px;">
                        <i class="fas fa-user"></i> Staff Information (Required)
                    </h3>
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label for="staffName">Your Name</label>
                        <input type="text" id="staffName" name="staffName" required 
                               style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;"
                               placeholder="Enter your full name">
                    </div>
                    <div class="form-group">
                        <label for="staffPhone">Your Phone Number</label>
                        <input type="tel" id="staffPhone" name="staffPhone" required 
                               style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;"
                               placeholder="Enter your mobile number">
                    </div>
                </div>
                
                <!-- Resource Levels After Use -->
                <div class="checklist-section">
                    <h3><i class="fas fa-gas-pump"></i> Resource Levels After Use</h3>
                    
                    <div class="form-group">
                        <label>Fuel Level After Use</label>
                        <select id="fuelLevelAfter" name="fuelLevelAfter" class="form-control" required
                                style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                            <option value="">Select Level</option>
                            <option value="Empty">Empty</option>
                            <option value="Quarter">Quarter</option>
                            <option value="Half">Half</option>
                            <option value="Three-Quarter">3/4</option>
                            <option value="Full">Full</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Gas Bottle Level After Use</label>
                        <select id="gasLevelAfter" name="gasLevelAfter" class="form-control" required
                                style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                            <option value="">Select Level</option>
                            <option value="Empty">Empty</option>
                            <option value="Quarter">Quarter</option>
                            <option value="Half">Half</option>
                            <option value="Three-Quarter">3/4</option>
                            <option value="Full">Full</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Water Tank Level After Use</label>
                        <select id="waterLevelAfter" name="waterLevelAfter" class="form-control" required
                                style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                            <option value="">Select Level</option>
                            <option value="Empty">Empty</option>
                            <option value="Quarter">Quarter</option>
                            <option value="Half">Half</option>
                            <option value="Three-Quarter">3/4</option>
                            <option value="Full">Full</option>
                        </select>
                    </div>
                </div>

                <!-- GPS Location -->
                <div class="checklist-section" style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; margin: 25px 0;">
                    <h3 style="color: #0066cc; margin-bottom: 15px;">
                        <i class="fas fa-map-marker-alt"></i> Vessel Location
                    </h3>
                    <p style="color: #666; margin-bottom: 1rem;">Record where you've moored the vessel</p>
                    
                    <button type="button" id="captureLocationBtn" onclick="captureLocation()" 
                            style="background: #28a745; color: white; border: none; padding: 12px 24px; 
                                   border-radius: 6px; font-size: 16px; cursor: pointer;">
                        <i class="fas fa-location-arrow"></i> Capture Current Location
                    </button>
                    
                    <div id="locationStatus" style="display: none; margin-top: 1rem; padding: 1rem; 
                                                    border-radius: 5px; font-size: 0.9rem;"></div>
                    
                    <!-- Hidden fields to store location data -->
                    <input type="hidden" id="gpsLatitude" name="gpsLatitude">
                    <input type="hidden" id="gpsLongitude" name="gpsLongitude">
                    <input type="hidden" id="locationAddress" name="locationAddress">
                    <input type="hidden" id="locationAccuracy" name="locationAccuracy">
                </div>
                
                <div class="checklist-section">
                    <h3><i class="fas fa-ship"></i> Vessel Return Condition</h3>
                    
                    <div class="checklist-item">
                        <input type="checkbox" id="toiletPumped" name="toiletPumped">
                        <label for="toiletPumped">Toilet Pumped Out</label>
                    </div>
                    
                    <div class="checklist-item">
                        <input type="checkbox" id="rubbishRemoved" name="rubbishRemoved">
                        <label for="rubbishRemoved">Rubbish Removed</label>
                    </div>
                    
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
                    
                    <div class="form-group">
                        <label>Overall Vessel Condition After Use</label>
                        <select id="overallConditionAfter" name="overallConditionAfter" class="form-control" required
                                style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                            <option value="">Select Condition</option>
                            <option value="Good - Ready for Next Booking">Good - Ready for Next Booking</option>
                            <option value="Needs Attention">Needs Attention</option>
                            <option value="Major Issues - Do Not Use">Major Issues - Do Not Use</option>
                        </select>
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
                const checklistData = {
                    // Staff Information
                    staffName: document.getElementById('staffName')?.value,
                    staffPhone: document.getElementById('staffPhone')?.value,
                    
                    // Resource levels after use
                    fuelLevelAfter: document.getElementById('fuelLevelAfter')?.value,
                    gasLevelAfter: document.getElementById('gasLevelAfter')?.value,
                    waterLevelAfter: document.getElementById('waterLevelAfter')?.value,
                    
                    // GPS location
                    gpsLatitude: document.getElementById('gpsLatitude')?.value,
                    gpsLongitude: document.getElementById('gpsLongitude')?.value,
                    locationAddress: document.getElementById('locationAddress')?.value,
                    locationAccuracy: document.getElementById('locationAccuracy')?.value,
                    
                    // Cleanliness and condition
                    toiletPumped: document.getElementById('toiletPumped')?.checked,
                    rubbishRemoved: document.getElementById('rubbishRemoved')?.checked,
                    vessel_cleaned: document.getElementById('vessel_cleaned')?.checked,
                    equipment_returned: document.getElementById('equipment_returned')?.checked,
                    no_damage: document.getElementById('no_damage')?.checked,
                    fuel_topped: document.getElementById('fuel_topped')?.checked,
                    overallConditionAfter: document.getElementById('overallConditionAfter')?.value,
                    
                    // Safety equipment
                    lifejackets_returned: document.getElementById('lifejackets_returned')?.checked,
                    safety_equipment_complete: document.getElementById('safety_equipment_complete')?.checked,
                    
                    // Customer feedback
                    customer_satisfied: document.getElementById('customer_satisfied')?.checked,
                    no_incidents: document.getElementById('no_incidents')?.checked,
                    
                    // Notes
                    notes: document.getElementById('notes')?.value
                };
                
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
        
        // GPS location capture function
        function captureLocation() {
            const btn = document.getElementById('captureLocationBtn');
            const statusDiv = document.getElementById('locationStatus');
            
            if (!navigator.geolocation) {
                statusDiv.style.display = 'block';
                statusDiv.style.backgroundColor = '#f8d7da';
                statusDiv.style.color = '#721c24';
                statusDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> GPS location is not supported by your browser';
                return;
            }
            
            // Update button to show loading
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting location...';
            statusDiv.style.display = 'block';
            statusDiv.style.backgroundColor = '#cce5ff';
            statusDiv.style.color = '#004085';
            statusDiv.innerHTML = '<i class="fas fa-info-circle"></i> Requesting GPS location...';
            
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    const accuracy = position.coords.accuracy;
                    
                    // Store GPS data
                    document.getElementById('gpsLatitude').value = lat;
                    document.getElementById('gpsLongitude').value = lng;
                    document.getElementById('locationAccuracy').value = Math.round(accuracy);
                    
                    // Try to get address using reverse geocoding
                    try {
                        const response = await fetch(
                            \`https://nominatim.openstreetmap.org/reverse?format=json&lat=\${lat}&lon=\${lng}\`
                        );
                        const data = await response.json();
                        
                        let address = 'Unknown location';
                        if (data.display_name) {
                            address = data.display_name;
                        }
                        
                        document.getElementById('locationAddress').value = address;
                        
                        // Update status
                        statusDiv.style.backgroundColor = '#d4edda';
                        statusDiv.style.color = '#155724';
                        statusDiv.innerHTML = \`
                            <i class="fas fa-check-circle"></i> Location captured successfully!<br>
                            <small>GPS: \${lat.toFixed(6)}, \${lng.toFixed(6)}<br>
                            Accuracy: \u00b1\${Math.round(accuracy)}m<br>
                            \${address}</small>
                        \`;
                    } catch (error) {
                        // Even if geocoding fails, we have GPS coords
                        statusDiv.style.backgroundColor = '#d4edda';
                        statusDiv.style.color = '#155724';
                        statusDiv.innerHTML = \`
                            <i class="fas fa-check-circle"></i> GPS location captured!<br>
                            <small>Coordinates: \${lat.toFixed(6)}, \${lng.toFixed(6)}<br>
                            Accuracy: \u00b1\${Math.round(accuracy)}m</small>
                        \`;
                    }
                    
                    // Reset button
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-location-arrow"></i> Update Location';
                },
                (error) => {
                    // Handle error
                    statusDiv.style.backgroundColor = '#f8d7da';
                    statusDiv.style.color = '#721c24';
                    
                    let errorMsg = 'Unable to get your location';
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            errorMsg = 'Location access denied. Please enable location permissions.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMsg = 'Location information unavailable.';
                            break;
                        case error.TIMEOUT:
                            errorMsg = 'Location request timed out.';
                            break;
                    }
                    
                    statusDiv.innerHTML = \`<i class="fas fa-exclamation-circle"></i> \${errorMsg}\`;
                    
                    // Reset button
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-location-arrow"></i> Try Again';
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
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
        let booking;
        try {
            booking = await fetchBooking(bookingId);
        } catch (fetchError) {
            console.error('Error fetching booking:', fetchError);
            return res.status(404).send(`
                <html>
                    <body style="font-family: Arial; padding: 20px; text-align: center;">
                        <h2>Booking Not Found</h2>
                        <p>The booking ID provided is invalid or the booking does not exist.</p>
                        <p style="color: #666; font-size: 14px;">Booking ID: ${bookingId}</p>
                    </body>
                </html>
            `);
        }
        
        if (!booking || booking.fields.Status !== 'PAID') {
            return res.status(404).send(`
                <html>
                    <body style="font-family: Arial; padding: 20px; text-align: center;">
                        <h2>Booking Not Available</h2>
                        <p>This checklist is only available for bookings with PAID status.</p>
                        <p style="color: #666; font-size: 14px;">Current Status: ${booking?.fields?.Status || 'Unknown'}</p>
                    </body>
                </html>
            `);
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
        
        // Determine which table to use based on checklist type
        const tableId = checklistType === 'Pre-Departure' 
            ? PRE_DEPARTURE_CHECKLIST_TABLE_ID 
            : POST_DEPARTURE_CHECKLIST_TABLE_ID;
        
        console.log(`Submitting ${checklistType} checklist to table ${tableId}`);
        
        // Create checklist record in Airtable
        const response = await fetch(
            `https://api.airtable.com/v0/${BOOKINGS_BASE_ID}/${tableId}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fields: checklistType === 'Pre-Departure' ? {
                        // Pre-Departure fields with correct field names
                        'Booking': [bookingId],
                        'Checklist Date/Time': new Date().toISOString(),
                        'Completion Status': 'Completed',
                        'Completion Time': new Date().toISOString(),
                        
                        // Resource levels
                        'Fuel Level Check': data.fuelLevel || null,
                        'Gas Bottle Check': data.gasLevel || null,
                        'Water Tank Level': data.waterLevel || null,
                        
                        // Cleanliness
                        'BBQ Cleaned': data.bbqCleaned || false,
                        'Toilet Cleaned': data.toiletCleaned || false,
                        'Deck Washed': data.deckWashed || false,
                        
                        // Safety equipment
                        'Life Jackets Count': data.lifeJackets ? parseInt(data.lifeJackets) : null,
                        'Safety Equipment Check': data.safetyEquipment || false,
                        'Fire Extinguisher Check': data.fireExtinguisher || false,
                        
                        // Vessel condition
                        'Overall Vessel Condition': data.overallCondition || null,
                        'Anchor Secured': data.anchorSecured || false,
                        'Lights Working': data.lightsWorking || false,
                        
                        // Refill tracking
                        'Fuel Refilled': data.fuelRefilled || false,
                        'Gas Bottle Replaced': data.gasReplaced || false,
                        'Water Tank Refilled': data.waterRefilled || false,
                        
                        // Notes (include staff info)
                        'Notes': `${data.notes || ''}\n\nCompleted by: ${data.staffName || submittedBy || 'Unknown'} (${data.staffPhone || 'No phone provided'})`
                    } : {
                        // Post-Departure fields with correct field names
                        'Booking': [bookingId],
                        'Checklist Date/Time': new Date().toISOString(),
                        'Completion Status': 'Completed',
                        'Completion Time': new Date().toISOString(),
                        
                        // Resource levels after use
                        'Fuel Level After Use': data.fuelLevelAfter || null,
                        'Gas Bottle Level After Use': data.gasLevelAfter || null,
                        'Water Tank Level After Use': data.waterLevelAfter || null,
                        
                        // GPS fields
                        'GPS Latitude': data.gpsLatitude ? parseFloat(data.gpsLatitude) : null,
                        'GPS Longitude': data.gpsLongitude ? parseFloat(data.gpsLongitude) : null,
                        'Location Address': data.locationAddress || null,
                        'Location Accuracy': data.locationAccuracy ? parseInt(data.locationAccuracy) : null,
                        'Location Captured': data.gpsLatitude ? true : false,
                        
                        // Cleanliness and maintenance
                        'Toilet Pumped Out': data.toiletPumped || false,
                        'Toilet Cleaned': data.vessel_cleaned || false,
                        'BBQ Cleaned': data.bbqCleaned || false,
                        'Deck Cleaned': data.deckCleaned || false,
                        'Rubbish Removed': data.rubbishRemoved || false,
                        
                        // Equipment and condition
                        'Equipment Returned': data.equipment_returned || false,
                        'Customer Items Left': data.itemsLeft || false,
                        'Items Description': data.itemsDescription || '',
                        
                        // Overall assessment
                        'Overall Vessel Condition After Use': data.overallConditionAfter || 
                            (data.no_damage ? 'Good - Ready for Next Booking' : 'Needs Attention'),
                        
                        // Refill tracking
                        'Fuel Refilled': data.fuel_topped || false,
                        'Gas Bottle Replaced': data.gasReplaced || false,
                        'Water Tank Refilled': data.waterRefilled || false,
                        
                        // Damage report and notes (include staff info)
                        'Damage Report': `${data.notes || ''}\n\nCompleted by: ${data.staffName || submittedBy || 'Unknown'} (${data.staffPhone || 'No phone provided'})`
                    }
                })
            }
        );
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Airtable response:', response.status, errorData);
            throw new Error(`Failed to save checklist: ${errorData.error?.message || response.status}`);
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
