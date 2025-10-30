// Daily Run Sheet Calendar Manager
class DailyRunSheetCalendar {
    constructor() {
        this.calendar = null;
        this.runSheetData = null;
        this.currentUser = null;
        this.userRole = null;
        this.currentView = 'timeline';
        this.staffMembers = [];
        this.autoRefreshInterval = null;
        this.selectedVessel = ''; // Track selected vessel filter
        this.availableVessels = new Set(); // Track unique vessels
        this.currentCalendarDate = null; // Track current calendar date for refresh
        this.init();
    }
    
    async init() {
        // Wait for supabase to be available from global scope
        if (!window.supabase) {
            console.log('Waiting for Supabase to be initialized...');
            // Supabase should be set by checkAuth() in the HTML
            setTimeout(() => this.init(), 100);
            return;
        }
        
        // Check authentication
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        this.currentUser = user;
        
        // Get user role
        await this.getUserRole();
        
        // Load initial data
        await this.loadData();
        
        // Initialize calendar
        this.initializeCalendar();
        
        // Set up vessel filter
        this.setupVesselFilter();
        
        // Set up auto-refresh
        this.startAutoRefresh();
        
        // Update current time
        this.updateCurrentTime();
        setInterval(() => this.updateCurrentTime(), 60000);
        
        // Set up window resize handler to fix calendar rendering
        this.setupResizeHandler();
        
        // Hide loading
        document.getElementById('loading').style.display = 'none';
    }
    
    async getUserRole() {
        try {
            const response = await fetch('/api/user/role', {
                headers: {
                    'Authorization': `Bearer ${(await window.supabase.auth.getSession()).data.session?.access_token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.userRole = data.role;
            }
        } catch (error) {
            console.error('Error getting user role:', error);
            this.userRole = 'Staff'; // Default to staff
        }
    }
    
    async loadData(dateStr = null) {
        try {
            // Get date to load - either passed date or today in Sydney timezone
            const dateToLoad = dateStr || new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
            
            // Load run sheet data
            const response = await fetch(`/api/daily-run-sheet?date=${dateToLoad}`);
            if (!response.ok) throw new Error('Failed to load data');
            
            this.runSheetData = await response.json();
            
            if (this.runSheetData.success) {
                this.renderStats();
                this.renderAddOns();
                
                // If calendar exists, update events
                if (this.calendar) {
                    this.updateCalendarEvents();
                }
            } else {
                throw new Error(this.runSheetData.error || 'Failed to load daily run sheet');
            }
            
            // Load staff members for allocation
            await this.loadStaffMembers();
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Failed to load daily run sheet. Please try again.');
        }
    }
    
    async loadStaffMembers() {
        try {
            const response = await fetch('/api/airtable/applkAFOn2qxtu7tx/tbltAE4NlNePvnkpY?filterByFormula=' + 
                encodeURIComponent('AND({Active Roster}=1,OR({Staff Type}="Casual",{Staff Type}="Full Time"))'));
            
            if (response.ok) {
                const data = await response.json();
                this.staffMembers = data.records.map(record => ({
                    id: record.id,
                    name: record.fields['Name'] || 'Unknown'
                })).sort((a, b) => a.name.localeCompare(b.name));
            }
        } catch (error) {
            console.error('Error loading staff members:', error);
        }
    }
    
    initializeCalendar() {
        const calendarEl = document.getElementById('calendar');
        const isMobile = window.innerWidth <= 768;
        
        // Check if FullCalendar is loaded
        console.log('FullCalendar loaded:', typeof FullCalendar !== 'undefined');
        if (typeof FullCalendar !== 'undefined') {
            console.log('FullCalendar version:', FullCalendar.version);
        }
        
        // Debug current date
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        console.log('Today is:', todayStr, 'Full date:', today.toString());
        
        // Set initial calendar date
        this.currentCalendarDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
        
        this.calendar = new FullCalendar.Calendar(calendarEl, {
            // Scheduler license key (GPL for open source)
            schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
            
            initialView: isMobile ? 'listDay' : 'resourceTimeGridDay',
            initialDate: todayStr, // Ensure we're on today's date
            timeZone: 'local',  // Use local timezone to prevent conversion
            
            // Resource configuration
            resources: [], // Will be populated dynamically
            resourceOrder: 'title', // Sort resources alphabetically
            
            // Header toolbar
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'resourceTimeGridDay,timeGridWeek,listWeek'
            },
            
            // Time configuration
            slotMinTime: '06:00:00',
            slotMaxTime: '20:00:00',
            slotDuration: '00:15:00',
            slotLabelInterval: '01:00:00',
            slotLabelFormat: {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            },
            
            // View configuration
            height: isMobile ? '70vh' : 'auto',
            expandRows: true,
            nowIndicator: true,
            dayMaxEvents: false,
            eventMaxStack: 5,
            eventOverlap: true,
            slotEventOverlap: true,
            eventMinHeight: isMobile ? 25 : 30,
            displayEventTime: !isMobile,
            displayEventEnd: false,
            
            // Interaction
            editable: false, // Disable for now
            eventClick: (info) => this.handleEventClick(info),
            dateClick: (info) => this.handleDateClick(info),
            
            // Date navigation handler
            datesSet: (dateInfo) => {
                console.log('Calendar date changed to:', dateInfo.start);
                this.handleDatesSet(dateInfo);
            },
            
            // Event rendering
            eventContent: (arg) => this.renderEvent(arg),
            eventClassNames: (arg) => this.getEventClasses(arg),
            
            // Debug event mounting
            eventDidMount: (info) => {
                console.log('Event mounted:', info.event.title, 'at', info.event.start);
            }
        });
        
        // Render the calendar
        this.calendar.render();
        
        // Load events after calendar is rendered (matching management-allocations)
        console.log('Calendar rendered, updating events...');
        this.updateCalendarEvents();
    }
    
    // Resource-related functions removed - no longer using resource views
    
    transformToCalendarEvents() {
        if (!this.runSheetData || !this.runSheetData.bookings) {
            console.log('No bookings data available');
            return [];
        }
        
        const events = [];
        this.availableVessels.clear(); // Clear previous vessels
        console.log('Transforming bookings to events:', this.runSheetData.bookings.length, 'bookings');
        
        this.runSheetData.bookings.forEach(booking => {
            console.log('Processing booking:', booking.customerName, 'on', booking.vesselName);
            
            if (!booking.bookingDate) {
                console.warn('Booking has no date:', booking);
                return;
            }
            
            // Main booking event (vessel schedule view)
            const vesselName = booking.vesselName || 'No Vessel';
            // Track unique vessels
            if (vesselName && vesselName !== 'Unassigned') {
                this.availableVessels.add(vesselName);
            }
            
            const startTimeStr = `${booking.bookingDate}T${this.convertTo24Hour(booking.startTime)}`;
            const endTimeStr = `${booking.bookingDate}T${this.convertTo24Hour(booking.finishTime)}`;
            console.log('Event times:', startTimeStr, 'to', endTimeStr);
            
            // Get vessel ID for resource view
            const resourceId = booking.vesselId || vesselName.replace(/\s+/g, '-').toLowerCase() || 'unassigned';
            
            const mainEvent = {
                id: `booking-${booking.id}`,
                title: `🛥️ ${booking.customerName}`,
                start: startTimeStr,
                end: endTimeStr,
                resourceId: resourceId, // Assign to vessel resource
                backgroundColor: '#2196F3',
                borderColor: '#1976D2',
                classNames: ['booking-event', 'booking-main'],
                extendedProps: {
                    recordType: 'booking',
                    booking: booking,
                    vesselName: vesselName,
                    status: booking.status
                }
            };
            
            console.log('Created main booking event:', {
                id: mainEvent.id,
                title: mainEvent.title,
                recordType: mainEvent.extendedProps.recordType,
                vesselName: mainEvent.extendedProps.vesselName
            });
            
            events.push(mainEvent);
            
            // Onboarding event (staff schedule view)
            if (booking.onboardingTime) {
                const hasStaff = !!booking.onboardingStaffName;
                const statusClass = !hasStaff ? 'booking-unallocated' : 'booking-pending';
                
                const onboardEvent = {
                    id: `onboarding-${booking.id}`,
                    title: `🚢 ON ${booking.customerName}`,
                    start: `${booking.bookingDate}T${this.convertTo24Hour(booking.onboardingTime)}`,
                    end: `${booking.bookingDate}T${this.addMinutes(booking.onboardingTime, 30)}`,
                    resourceId: resourceId, // Same vessel resource
                    backgroundColor: hasStaff ? '#4CAF50' : '#f44336',
                    borderColor: hasStaff ? '#388E3C' : '#d32f2f',
                    classNames: ['booking-event', 'booking-onboarding', statusClass],
                    extendedProps: {
                        recordType: 'booking',
                        allocationType: 'onboarding',
                        booking: booking,
                        hasStaff: hasStaff,
                        staffName: booking.onboardingStaffName,
                        vesselName: vesselName
                    }
                };
                
                console.log('Created onboarding event:', {
                    id: onboardEvent.id,
                    title: onboardEvent.title,
                    allocationType: onboardEvent.extendedProps.allocationType,
                    hasStaff: onboardEvent.extendedProps.hasStaff
                });
                
                events.push(onboardEvent);
            }
            
            // Deloading event (staff schedule view)
            if (booking.deloadingTime && booking.deloadingTime !== booking.onboardingTime) {
                const hasStaff = !!booking.deloadingStaffName;
                const statusClass = !hasStaff ? 'booking-unallocated' : 'booking-pending';
                
                const deloadEvent = {
                    id: `deloading-${booking.id}`,
                    title: `🏁 OFF ${booking.customerName}`,
                    start: `${booking.bookingDate}T${this.convertTo24Hour(booking.deloadingTime)}`,
                    end: `${booking.bookingDate}T${this.addMinutes(booking.deloadingTime, 30)}`,
                    resourceId: resourceId, // Same vessel resource
                    backgroundColor: hasStaff ? '#2196F3' : '#f44336',
                    borderColor: hasStaff ? '#1976D2' : '#d32f2f',
                    classNames: ['booking-event', 'booking-deloading', statusClass],
                    extendedProps: {
                        recordType: 'booking',
                        allocationType: 'deloading',
                        booking: booking,
                        hasStaff: hasStaff,
                        staffName: booking.deloadingStaffName,
                        vesselName: vesselName
                    }
                };
                
                console.log('Created deloading event:', {
                    id: deloadEvent.id,
                    title: deloadEvent.title,
                    allocationType: deloadEvent.extendedProps.allocationType,
                    hasStaff: deloadEvent.extendedProps.hasStaff
                });
                
                events.push(deloadEvent);
            }
        });
        
        console.log('Created', events.length, 'events');
        return events;
    }
    
    renderEvent(arg) {
        const props = arg.event.extendedProps;
        let content = '';
        
        // Check both recordType (new) and type (old) for compatibility
        const eventType = props.recordType || props.type;
        const allocationType = props.allocationType;
        
        if (eventType === 'booking' && !allocationType) {
            // Main booking event
            const hasAddOns = props.booking && props.booking.addOns && props.booking.addOns !== 'None';
            content = `
                <div class="fc-event-main">
                    <div class="fc-event-title">
                        ${arg.event.title}
                        ${hasAddOns ? '<span class="addon-badge" title="Has add-ons">+</span>' : ''}
                    </div>
                    <div class="fc-event-time">
                        ${this.formatEventTime(arg.event.start)} - ${this.formatEventTime(arg.event.end)}
                    </div>
                </div>
            `;
        } else if (allocationType === 'onboarding' || allocationType === 'deloading') {
            // Allocation event
            const isStaffed = props.hasStaff || (props.staffName && props.staffName !== 'Unassigned');
            content = `
                <div class="fc-event-allocation ${isStaffed ? 'staffed' : 'unstaffed'}">
                    <div class="fc-event-title">${arg.event.title}</div>
                </div>
            `;
        } else {
            // Fallback for any other event type
            content = `<div class="fc-event-title">${arg.event.title}</div>`;
        }
        
        return { html: content || '<div>Event</div>' };
    }
    
    getEventClasses(arg) {
        const classes = [];
        const props = arg.event.extendedProps;
        
        // Check both recordType (new) and type (old) for compatibility
        const eventType = props.recordType || props.type;
        const allocationType = props.allocationType;
        
        if (eventType === 'booking' && !allocationType) {
            classes.push('event-booking');
            if (props.status) {
                classes.push(`status-${props.status.toLowerCase()}`);
            }
        } else if (allocationType === 'onboarding') {
            classes.push('event-allocation', 'event-onboarding');
            if (!props.hasStaff) {
                classes.push('unstaffed');
            }
        } else if (allocationType === 'deloading') {
            classes.push('event-allocation', 'event-deloading');
            if (!props.hasStaff) {
                classes.push('unstaffed');
            }
        }
        
        return classes;
    }
    
    handleEventClick(info) {
        const props = info.event.extendedProps;
        const eventType = props.recordType || props.type;
        const allocationType = props.allocationType;
        
        console.log('Event clicked:', info.event.title, 'Type:', eventType, 'Allocation:', allocationType);
        
        if (eventType === 'booking' && !allocationType) {
            // Main booking event
            this.showBookingDetails(props.booking);
        } else if (allocationType === 'onboarding' || allocationType === 'deloading') {
            // Staff allocation event
            if (this.userRole === 'Admin') {
                this.showAllocationModal(props);
            } else {
                this.showBookingDetails(props.booking);
            }
        }
    }
    
    handleDateClick(info) {
        // Date click functionality disabled for non-resource views
        // This was only used for creating allocations in timeline view
    }
    
    async handleEventDrop(info) {
        const props = info.event.extendedProps;
        const allocationType = props.allocationType;
        
        // Only allow time adjustments for allocations
        if (allocationType !== 'onboarding' && allocationType !== 'deloading') {
            info.revert();
            return;
        }
        
        // Update the allocation time
        const newTime = this.formatTime(info.event.start);
        const success = await this.updateAllocationTime(
            props.booking.id,
            allocationType,
            newTime
        );
        
        if (!success) {
            info.revert();
        }
    }
    
    async handleEventResize(info) {
        const props = info.event.extendedProps;
        
        // Don't allow resizing of allocations or bookings
        info.revert();
    }
    
    async handleDatesSet(dateInfo) {
        // Get the current date displayed in the calendar
        const currentDate = dateInfo.start;
        const dateStr = currentDate.toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
        
        console.log('Calendar date changed to:', dateStr);
        
        // Store the current date for auto-refresh
        this.currentCalendarDate = dateStr;
        
        // Load data for the new date
        await this.loadData(dateStr);
        
        // Refresh the calendar events
        this.updateCalendarEvents();
    }
    
    showBookingDetails(booking) {
        const modal = document.getElementById('bookingModal');
        const modalBody = document.getElementById('modalBody');
        const modalTitle = document.getElementById('modalTitle');
        
        modalTitle.textContent = `${booking.customerName} - ${booking.bookingCode}`;
        
        // Parse add-ons
        let addOnsHtml = '<div class="no-addons">No add-ons for this booking</div>';
        if (booking.addOns && booking.addOns !== 'None') {
            const addOnsList = booking.addOns.split(',').map(item => item.trim());
            addOnsHtml = '<div class="add-ons-list">';
            addOnsList.forEach(addon => {
                const [name, price] = addon.split(' - ');
                const icon = this.getAddOnIcon(name);
                addOnsHtml += `
                    <div class="add-on-item">
                        <span class="add-on-icon">${icon}</span>
                        <span class="add-on-name">${name}</span>
                        <span class="add-on-price">${price || ''}</span>
                    </div>
                `;
            });
            addOnsHtml += '</div>';
        }
        
        modalBody.innerHTML = `
            <div class="booking-details">
                <div class="detail-row">
                    <span class="detail-label">Booking Code:</span>
                    <span class="detail-value">${booking.bookingCode}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Customer:</span>
                    <span class="detail-value">${booking.customerName}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Phone:</span>
                    <span class="detail-value">${booking.phoneNumber || 'Not provided'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Vessel:</span>
                    <span class="detail-value">${booking.vesselName}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Duration:</span>
                    <span class="detail-value">${booking.duration} hours (${booking.startTime} - ${booking.finishTime})</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Onboarding:</span>
                    <span class="detail-value">
                        ${booking.onboardingTime || 'Not scheduled'} 
                        ${booking.onboardingTime ? `- ${booking.onboardingStaffName || 'Unassigned'}` : ''}
                    </span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Deloading:</span>
                    <span class="detail-value">
                        ${booking.deloadingTime || 'Not scheduled'} 
                        ${booking.deloadingTime ? `- ${booking.deloadingStaffName || 'Unassigned'}` : ''}
                    </span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value">${booking.status || 'Unknown'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Add-ons:</span>
                    <span class="detail-value">${addOnsHtml}</span>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
    }
    
    showAllocationModal(props) {
        const modal = document.getElementById('allocationModal');
        const modalBody = document.getElementById('allocationModalBody');
        
        const staffOptions = this.staffMembers.map(staff => 
            `<option value="${staff.name}" ${staff.name === props.staffName ? 'selected' : ''}>${staff.name}</option>`
        ).join('');
        
        modalBody.innerHTML = `
            <div class="allocation-form">
                <div class="form-group">
                    <label>Booking:</label>
                    <div class="form-value">${props.booking.customerName} - ${props.booking.bookingCode}</div>
                </div>
                <div class="form-group">
                    <label>Type:</label>
                    <div class="form-value">${props.allocationType === 'onboarding' ? 'Onboarding' : 'Deloading'}</div>
                </div>
                <div class="form-group">
                    <label for="staffSelect">Staff Member:</label>
                    <select id="staffSelect" class="form-control">
                        <option value="">Unassigned</option>
                        ${staffOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label for="timeInput">Time:</label>
                    <input type="time" id="timeInput" class="form-control" 
                           value="${this.formatTimeForInput(props.booking[props.allocationType + 'Time'])}">
                </div>
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="dailyRunSheet.saveAllocation('${props.booking.id}', '${props.allocationType}')">
                        Save
                    </button>
                    <button class="btn btn-secondary" onclick="closeModal(null, 'allocationModal')">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
    }
    
    showCreateAllocationModal(booking, clickTime) {
        const modal = document.getElementById('allocationModal');
        const modalBody = document.getElementById('allocationModalBody');
        
        // Determine allocation type based on time
        const bookingStart = this.parseDateTime(booking.bookingDate, booking.startTime);
        const bookingEnd = this.parseDateTime(booking.bookingDate, booking.finishTime);
        const clickHour = clickTime.getHours() + clickTime.getMinutes() / 60;
        const startHour = bookingStart.getHours() + bookingStart.getMinutes() / 60;
        const endHour = bookingEnd.getHours() + bookingEnd.getMinutes() / 60;
        
        // Default to onboarding if in first half, deloading if in second half
        const defaultType = (clickHour - startHour) < (endHour - startHour) / 2 ? 'onboarding' : 'deloading';
        
        const staffOptions = this.staffMembers.map(staff => 
            `<option value="${staff.name}">${staff.name}</option>`
        ).join('');
        
        modalBody.innerHTML = `
            <div class="allocation-form">
                <h4>Create Staff Allocation</h4>
                <div class="form-group">
                    <label>Booking:</label>
                    <div class="form-value">${booking.customerName} - ${booking.bookingCode}</div>
                </div>
                <div class="form-group">
                    <label for="allocationTypeSelect">Type:</label>
                    <select id="allocationTypeSelect" class="form-control">
                        <option value="onboarding" ${defaultType === 'onboarding' ? 'selected' : ''}>Onboarding</option>
                        <option value="deloading" ${defaultType === 'deloading' ? 'selected' : ''}>Deloading</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="staffSelect">Staff Member:</label>
                    <select id="staffSelect" class="form-control">
                        <option value="">Select staff member</option>
                        ${staffOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label for="timeInput">Time:</label>
                    <input type="time" id="timeInput" class="form-control" 
                           value="${this.formatTimeForInput(this.formatTime(clickTime))}">
                </div>
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="dailyRunSheet.createAllocation('${booking.id}')">
                        Create
                    </button>
                    <button class="btn btn-secondary" onclick="closeModal(null, 'allocationModal')">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
    }
    
    async saveAllocation(bookingId, allocationType) {
        const staffSelect = document.getElementById('staffSelect');
        const timeInput = document.getElementById('timeInput');
        
        const staffName = staffSelect.value;
        const time = this.formatTimeFromInput(timeInput.value);
        
        const success = await this.updateAllocation(bookingId, allocationType, staffName, time);
        
        if (success) {
            closeModal(null, 'allocationModal');
            await this.loadData();
        }
    }
    
    async createAllocation(bookingId) {
        const typeSelect = document.getElementById('allocationTypeSelect');
        const staffSelect = document.getElementById('staffSelect');
        const timeInput = document.getElementById('timeInput');
        
        const allocationType = typeSelect.value;
        const staffName = staffSelect.value;
        const time = this.formatTimeFromInput(timeInput.value);
        
        if (!staffName) {
            alert('Please select a staff member');
            return;
        }
        
        const success = await this.updateAllocation(bookingId, allocationType, staffName, time);
        
        if (success) {
            closeModal(null, 'allocationModal');
            await this.loadData();
        }
    }
    
    async updateAllocation(bookingId, allocationType, staffName, time) {
        try {
            // Find the booking
            const booking = this.runSheetData.bookings.find(b => b.id === bookingId);
            if (!booking) throw new Error('Booking not found');
            
            // Update via API
            const response = await fetch('/api/update-allocation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(await window.supabase.auth.getSession()).data.session?.access_token}`
                },
                body: JSON.stringify({
                    bookingId: booking.bookingRecordId,
                    allocationType: allocationType,
                    staffName: staffName,
                    time: time
                })
            });
            
            if (!response.ok) throw new Error('Failed to update allocation');
            
            return true;
        } catch (error) {
            console.error('Error updating allocation:', error);
            alert('Failed to update allocation. Please try again.');
            return false;
        }
    }
    
    async updateAllocationTime(bookingId, allocationType, newTime) {
        try {
            const booking = this.runSheetData.bookings.find(b => b.id === bookingId);
            if (!booking) throw new Error('Booking not found');
            
            const currentStaff = allocationType === 'onboarding' 
                ? booking.onboardingStaffName 
                : booking.deloadingStaffName;
            
            return await this.updateAllocation(bookingId, allocationType, currentStaff, newTime);
        } catch (error) {
            console.error('Error updating allocation time:', error);
            return false;
        }
    }
    
    renderStats() {
        const container = document.getElementById('statsContainer');
        const { stats } = this.runSheetData;
        
        container.innerHTML = `
            <div class="stat-card">
                <div class="stat-number">${stats.totalBookings}</div>
                <div class="stat-label">Total Bookings</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.onWater}</div>
                <div class="stat-label">On Water Now</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.preparing}</div>
                <div class="stat-label">Preparing</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.returning}</div>
                <div class="stat-label">Returning Soon</div>
            </div>
        `;
    }
    
    renderAddOns() {
        const section = document.getElementById('addonsSection');
        const { addOnsSummary } = this.runSheetData;
        
        if (!addOnsSummary || Object.keys(addOnsSummary).length === 0) {
            section.innerHTML = `
                <h2 class="addons-header">
                    <i class="fas fa-box"></i> Today's Add-ons Required
                </h2>
                <p class="no-data">No add-ons required for today</p>
            `;
            return;
        }
        
        let addOnsHtml = `
            <h2 class="addons-header">
                <i class="fas fa-box"></i> Today's Add-ons Required
            </h2>
            <div class="addons-grid">
        `;
        
        Object.entries(addOnsSummary).forEach(([item, count]) => {
            const icon = this.getAddOnIcon(item);
            addOnsHtml += `
                <div class="addon-item">
                    <div class="addon-icon">${icon}</div>
                    <div class="addon-details">
                        <div class="addon-name">${item}</div>
                        <div class="addon-count">${count} needed</div>
                    </div>
                    <div class="addon-status">Ready</div>
                </div>
            `;
        });
        
        addOnsHtml += '</div>';
        section.innerHTML = addOnsHtml;
    }
    
    updateCalendarEvents() {
        if (!this.calendar) {
            console.log('Calendar not initialized yet');
            return;
        }
        
        console.log('Updating calendar events...');
        
        // Remove all existing events (matching management-allocations)
        this.calendar.removeAllEvents();
        
        // Transform and add events
        const events = this.transformToCalendarEvents();
        console.log('Adding', events.length, 'events to calendar');
        
        // Update calendar resources from available vessels
        this.updateCalendarResources();
        
        // Update vessel dropdown
        this.updateVesselDropdown();
        
        // Add all events to calendar (resource filtering handles visibility)
        events.forEach((event, index) => {
            console.log(`Adding event ${index + 1}:`, {
                title: event.title,
                start: event.start,
                vessel: event.extendedProps?.vesselName,
                resourceId: event.resourceId,
                recordType: event.extendedProps?.recordType,
                allocationType: event.extendedProps?.allocationType
            });
            this.calendar.addEvent(event);
        });
        
        console.log('Events added. Total in calendar:', this.calendar.getEvents().length);
        
        // Verify events were added
        const addedEvents = this.calendar.getEvents();
        if (addedEvents.length > 0) {
            console.log('Sample event from calendar:', {
                title: addedEvents[0].title,
                start: addedEvents[0].start,
                resourceId: addedEvents[0].resourceId,
                display: addedEvents[0].display,
                extendedProps: addedEvents[0].extendedProps
            });
        }
    }
    
    updateCalendarResources() {
        if (!this.calendar) return;
        
        // Create resources from available vessels
        const resources = [];
        
        // If a vessel is selected, only show that vessel
        if (this.selectedVessel) {
            const resourceId = this.selectedVessel === 'Unassigned' ? 
                'unassigned' : 
                this.selectedVessel.replace(/\s+/g, '-').toLowerCase();
            
            resources.push({
                id: resourceId,
                title: this.selectedVessel
            });
        } else {
            // Show all vessels
            // Add each vessel as a resource
            const sortedVessels = Array.from(this.availableVessels).sort();
            sortedVessels.forEach(vessel => {
                resources.push({
                    id: vessel.replace(/\s+/g, '-').toLowerCase(),
                    title: vessel
                });
            });
            
            // Add unassigned resource if there are unassigned bookings
            if (this.runSheetData?.bookings?.some(b => !b.vesselName || b.vesselName === 'Unassigned')) {
                resources.push({
                    id: 'unassigned',
                    title: 'Unassigned'
                });
            }
        }
        
        console.log('Updating calendar resources:', resources.length, 'resources');
        
        // Clear existing resources
        const existingResources = this.calendar.getResources();
        existingResources.forEach(resource => resource.remove());
        
        // Add new resources
        resources.forEach(resource => {
            this.calendar.addResource(resource);
        });
    }
    
    switchView(viewType) {
        if (viewType === 'timeline') {
            this.calendar.changeView('resourceTimeGridDay');
            const btn1 = document.getElementById('timelineViewBtn');
            const btn2 = document.getElementById('gridViewBtn');
            if (btn1) btn1.classList.add('active');
            if (btn2) btn2.classList.remove('active');
        } else {
            this.calendar.changeView('timeGridWeek'); 
            const btn1 = document.getElementById('timelineViewBtn');
            const btn2 = document.getElementById('gridViewBtn');
            if (btn1) btn1.classList.remove('active');
            if (btn2) btn2.classList.add('active');
        }
        this.currentView = viewType;
        
        // Force calendar to update size
        this.calendar.updateSize();
    }
    
    scrollToNow() {
        const now = new Date();
        this.calendar.scrollToTime({
            hours: now.getHours(),
            minutes: now.getMinutes()
        });
    }
    
    addCurrentTimeLine() {
        // FullCalendar's nowIndicator handles this automatically
    }
    
    startAutoRefresh() {
        // Refresh every 30 seconds
        this.autoRefreshInterval = setInterval(() => {
            // Use the current calendar date if available, otherwise today
            const dateToLoad = this.currentCalendarDate || new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
            console.log('Auto-refresh loading data for date:', dateToLoad);
            this.loadData(dateToLoad);
        }, 30000);
    }
    
    updateCurrentTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-AU', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Australia/Sydney'
        });
        document.getElementById('currentTime').textContent = timeString;
    }
    
    setupResizeHandler() {
        let resizeTimer;
        
        // Handle window resize events
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (this.calendar) {
                    console.log('Window resized, updating calendar size');
                    this.calendar.updateSize();
                }
            }, 250);
        });
        
        // Watch for DevTools open/close by monitoring window outer height changes
        let lastOuterHeight = window.outerHeight;
        setInterval(() => {
            if (window.outerHeight !== lastOuterHeight) {
                lastOuterHeight = window.outerHeight;
                setTimeout(() => {
                    if (this.calendar) {
                        console.log('DevTools state changed, updating calendar');
                        this.calendar.updateSize();
                        // Force re-render of events
                        this.calendar.render();
                    }
                }, 100);
            }
        }, 500);
    }
    
    setupVesselFilter() {
        const vesselFilter = document.getElementById('vesselFilter');
        if (!vesselFilter) return;
        
        // Handle filter change
        vesselFilter.addEventListener('change', (e) => {
            this.selectedVessel = e.target.value;
            console.log('Vessel filter changed to:', this.selectedVessel);
            this.updateCalendarEvents();
        });
    }
    
    updateVesselDropdown() {
        const vesselFilter = document.getElementById('vesselFilter');
        if (!vesselFilter) return;
        
        // Store current selection
        const currentSelection = this.selectedVessel;
        
        // Clear and repopulate
        vesselFilter.innerHTML = '<option value="">All Vessels</option>';
        
        // Sort vessels alphabetically
        const sortedVessels = Array.from(this.availableVessels).sort();
        sortedVessels.forEach(vessel => {
            const option = document.createElement('option');
            option.value = vessel;
            option.textContent = vessel;
            option.selected = vessel === currentSelection;
            vesselFilter.appendChild(option);
        });
        
        // Add special option for unassigned
        if (this.runSheetData?.bookings?.some(b => !b.vesselName || b.vesselName === 'Unassigned')) {
            const option = document.createElement('option');
            option.value = 'Unassigned';
            option.textContent = 'Unassigned';
            option.selected = 'Unassigned' === currentSelection;
            vesselFilter.appendChild(option);
        }
    }
    
    // Helper functions
    parseDateTime(dateStr, timeStr) {
        if (!dateStr || !timeStr) return new Date();
        
        // Parse the date
        const [year, month, day] = dateStr.split('-').map(Number);
        
        // Parse the time
        const timeParts = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (!timeParts) return new Date(year, month - 1, day);
        
        let hours = parseInt(timeParts[1]);
        const minutes = parseInt(timeParts[2]);
        const ampm = timeParts[3];
        
        if (ampm) {
            if (ampm.toUpperCase() === 'PM' && hours !== 12) hours += 12;
            if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
        }
        
        // Create date in local time
        const date = new Date(year, month - 1, day, hours, minutes);
        
        // Log the created date for debugging
        console.log('Created date:', dateStr, timeStr, '->', date.toISOString(), 'Local:', date.toString());
        
        return date;
    }
    
    // Convert time to 24-hour format (matching management-allocations.html)
    convertTo24Hour(timeStr) {
        if (!timeStr) return '09:00:00';
        
        // If already in 24-hour format (no AM/PM)
        if (!timeStr.toLowerCase().includes('am') && !timeStr.toLowerCase().includes('pm')) {
            // Ensure it has seconds
            const parts = timeStr.split(':');
            if (parts.length === 2) {
                return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
            }
            return timeStr;
        }
        
        // Parse 12-hour format
        const timeParts = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
        if (!timeParts) return '09:00:00';
        
        let hours = parseInt(timeParts[1]);
        const minutes = timeParts[2];
        const ampm = timeParts[3].toUpperCase();
        
        if (ampm === 'PM' && hours !== 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        
        return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
    }
    
    // Add minutes to a time string
    addMinutes(timeStr, minutesToAdd) {
        // First convert to 24-hour format
        const time24 = this.convertTo24Hour(timeStr);
        const [h, m] = time24.split(':').map(Number);
        const totalMinutes = h * 60 + m + minutesToAdd;
        const newHour = Math.floor(totalMinutes / 60);
        const newMinute = totalMinutes % 60;
        return `${newHour.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}:00`;
    }
    
    formatTime(date) {
        return date.toLocaleTimeString('en-AU', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }
    
    formatEventTime(date) {
        return date.toLocaleTimeString('en-AU', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).replace(' ', '').toLowerCase();
    }
    
    formatTimeForInput(timeStr) {
        if (!timeStr) return '';
        
        const timeParts = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (!timeParts) return '';
        
        let hours = parseInt(timeParts[1]);
        const minutes = parseInt(timeParts[2]);
        const ampm = timeParts[3];
        
        if (ampm) {
            if (ampm.toUpperCase() === 'PM' && hours !== 12) hours += 12;
            if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
        }
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    formatTimeFromInput(timeValue) {
        if (!timeValue) return '';
        
        const [hours, minutes] = timeValue.split(':').map(Number);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
        
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }
    
    formatStatus(status) {
        const statusMap = {
            'ready': 'Ready',
            'preparing': 'Preparing',
            'on_water': 'On Water',
            'returning': 'Returning',
            'maintenance': 'Maintenance'
        };
        return statusMap[status] || status;
    }
    
    levelToIcon(level) {
        const iconMap = {
            'Empty': '🔴',
            'Quarter': '🟠',
            'Half': '🟡',
            'Three-Quarter': '🟢',
            'Full': '🟢'
        };
        return iconMap[level] || '⚪';
    }
    
    getAddOnIcon(item) {
        const iconMap = {
            'Fishing Rods': '🎣',
            'Fishing Rod': '🎣',
            'Ice Bags': '🧊',
            'Icebag': '🧊',
            'Icebags': '🧊',
            'Lilly Pad': '🏖️',
            'Lilly Pads': '🏖️',
            'BBQ Pack': '🍖',
            'BBQ Equipment': '🍖',
            'Extra Life Jackets': '🦺',
            'Child Life Jacket': '🦺',
            'Bluetooth Speaker': '📻'
        };
        return iconMap[item] || '📦';
    }
    
    showError(message) {
        const container = document.querySelector('.container');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            ${message}
        `;
        container.insertBefore(errorDiv, container.firstChild);
        
        setTimeout(() => errorDiv.remove(), 5000);
    }
}

// The calendar will be initialized from the HTML file after successful authentication
// This ensures supabase is available before we try to use it

// Global functions for onclick handlers
function switchView(viewType) {
    if (window.dailyRunSheet) {
        window.dailyRunSheet.switchView(viewType);
    }
}

function refreshData() {
    if (dailyRunSheet && dailyRunSheet.calendar) {
        // Get current calendar date
        const currentDate = dailyRunSheet.calendar.getDate();
        const dateStr = currentDate.toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
        dailyRunSheet.loadData(dateStr);
    } else if (dailyRunSheet) {
        dailyRunSheet.loadData();
    }
}

function closeModal(event, modalId) {
    if (!event || event.target.id === modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('active');
    }
}
