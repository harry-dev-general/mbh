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
        this.init();
    }
    
    async init() {
        // Check authentication
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.href = 'auth.html';
            return;
        }
        this.currentUser = user;
        
        // Get user role
        await this.getUserRole();
        
        // Load initial data
        await this.loadData();
        
        // Initialize calendar
        this.initializeCalendar();
        
        // Set up auto-refresh
        this.startAutoRefresh();
        
        // Update current time
        this.updateCurrentTime();
        setInterval(() => this.updateCurrentTime(), 60000);
        
        // Hide loading
        document.getElementById('loading').style.display = 'none';
    }
    
    async getUserRole() {
        try {
            const response = await fetch('/api/user/role', {
                headers: {
                    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
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
        
        // Check if FullCalendar plugins are loaded
        console.log('FullCalendar loaded:', typeof FullCalendar !== 'undefined');
        
        // Try different ways to check for resource/scheduler plugin
        if (typeof FullCalendar !== 'undefined') {
            console.log('FullCalendar version:', FullCalendar.version);
            console.log('FullCalendar plugins:', Object.keys(FullCalendar));
            
            // Check for scheduler-specific features
            console.log('Has Calendar:', typeof FullCalendar.Calendar !== 'undefined');
            console.log('Calendar prototype has resources:', 
                FullCalendar.Calendar && FullCalendar.Calendar.prototype && 
                typeof FullCalendar.Calendar.prototype.getResources !== 'undefined');
        }
        
        // Prepare resources (vessels)
        const resources = this.getVesselResources();
        
        this.calendar = new FullCalendar.Calendar(calendarEl, {
            schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
            initialView: isMobile ? 'listDay' : 'resourceTimelineDay',
            timeZone: 'Australia/Sydney',
            
            // Header toolbar
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: ''  // We'll use custom view buttons
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
            
            // Resources (vessels)
            resources: resources,
            resourceAreaHeaderContent: 'Vessels',
            resourceAreaWidth: isMobile ? '120px' : '180px',
            
            // Resource rendering
            resourceLabelContent: (arg) => this.renderResourceLabel(arg),
            
            // Events
            events: this.transformToCalendarEvents(),
            
            // Event rendering
            eventContent: (arg) => this.renderEvent(arg),
            eventClassNames: (arg) => this.getEventClasses(arg),
            
            // Interaction
            editable: this.userRole === 'Admin',
            droppable: false, // No external dragging
            eventResizableFromStart: true,
            eventDurationEditable: this.userRole === 'Admin',
            eventStartEditable: this.userRole === 'Admin',
            
            // Event handlers
            eventClick: (info) => this.handleEventClick(info),
            dateClick: (info) => this.handleDateClick(info),
            eventDrop: (info) => this.handleEventDrop(info),
            eventResize: (info) => this.handleEventResize(info),
            
            // Date navigation handler
            datesSet: (dateInfo) => this.handleDatesSet(dateInfo),
            
            // View configuration
            height: 'auto',
            expandRows: true,
            nowIndicator: true,
            
            // Mobile adjustments
            dayMaxEvents: isMobile ? 3 : false,
            eventMinHeight: 30,
            
            // Custom buttons for now indicator
            customButtons: {
                nowIndicator: {
                    text: 'Now',
                    click: () => this.scrollToNow()
                }
            }
        });
        
        this.calendar.render();
        
        // Add current time line for timeline view
        if (!isMobile) {
            this.addCurrentTimeLine();
        }
    }
    
    getVesselResources() {
        if (!this.runSheetData || !this.runSheetData.vessels) return [];
        
        return this.runSheetData.vessels.map(vessel => ({
            id: vessel.id,
            title: vessel.name,
            extendedProps: {
                status: vessel.status,
                fuelLevel: vessel.fuelLevel,
                waterLevel: vessel.waterLevel,
                gasLevel: vessel.gasLevel
            }
        }));
    }
    
    renderResourceLabel(arg) {
        const vessel = arg.resource.extendedProps;
        const statusClass = `status-${vessel.status}`;
        const statusText = this.formatStatus(vessel.status);
        
        // Create resource label with vessel info and mini gauges
        const html = `
            <div class="vessel-resource-label">
                <div class="vessel-name">${arg.resource.title}</div>
                <div class="vessel-status ${statusClass}">${statusText}</div>
                <div class="resource-mini-gauges">
                    <span class="gauge-mini" title="Fuel: ${vessel.fuelLevel}">
                        ⛽ ${this.levelToIcon(vessel.fuelLevel)}
                    </span>
                    <span class="gauge-mini" title="Water: ${vessel.waterLevel}">
                        💧 ${this.levelToIcon(vessel.waterLevel)}
                    </span>
                    <span class="gauge-mini" title="Gas: ${vessel.gasLevel}">
                        🔥 ${this.levelToIcon(vessel.gasLevel)}
                    </span>
                </div>
            </div>
        `;
        
        return { html };
    }
    
    transformToCalendarEvents() {
        if (!this.runSheetData || !this.runSheetData.bookings) return [];
        
        const events = [];
        
        this.runSheetData.bookings.forEach(booking => {
            // Main booking block
            events.push({
                id: `booking-${booking.id}`,
                resourceId: booking.vesselId,
                title: booking.customerName,
                start: this.parseDateTime(booking.bookingDate, booking.startTime),
                end: this.parseDateTime(booking.bookingDate, booking.finishTime),
                backgroundColor: '#2196F3',
                borderColor: '#1976D2',
                classNames: ['booking-main'],
                extendedProps: {
                    type: 'booking',
                    booking: booking,
                    status: booking.status
                }
            });
            
            // Onboarding allocation
            if (booking.onboardingTime) {
                const onboardingStart = this.parseDateTime(booking.bookingDate, booking.onboardingTime);
                const onboardingEnd = new Date(onboardingStart.getTime() + 30 * 60000); // 30 minutes
                
                events.push({
                    id: `onboarding-${booking.id}`,
                    resourceId: booking.vesselId,
                    title: `🚢 ${booking.onboardingStaffName || 'Unassigned'}`,
                    start: onboardingStart,
                    end: onboardingEnd,
                    backgroundColor: booking.onboardingStaffName ? '#4CAF50' : '#f44336',
                    borderColor: booking.onboardingStaffName ? '#388E3C' : '#d32f2f',
                    classNames: ['allocation-onboarding'],
                    extendedProps: {
                        type: 'onboarding',
                        booking: booking,
                        staffName: booking.onboardingStaffName,
                        allocationType: 'onboarding'
                    }
                });
            }
            
            // Deloading allocation
            if (booking.deloadingTime && booking.deloadingTime !== booking.onboardingTime) {
                const deloadingStart = this.parseDateTime(booking.bookingDate, booking.deloadingTime);
                const deloadingEnd = new Date(deloadingStart.getTime() + 30 * 60000); // 30 minutes
                
                events.push({
                    id: `deloading-${booking.id}`,
                    resourceId: booking.vesselId,
                    title: `🏁 ${booking.deloadingStaffName || 'Unassigned'}`,
                    start: deloadingStart,
                    end: deloadingEnd,
                    backgroundColor: booking.deloadingStaffName ? '#2196F3' : '#f44336',
                    borderColor: booking.deloadingStaffName ? '#1976D2' : '#d32f2f',
                    classNames: ['allocation-deloading'],
                    extendedProps: {
                        type: 'deloading',
                        booking: booking,
                        staffName: booking.deloadingStaffName,
                        allocationType: 'deloading'
                    }
                });
            }
        });
        
        return events;
    }
    
    renderEvent(arg) {
        const props = arg.event.extendedProps;
        let content = '';
        
        if (props.type === 'booking') {
            // Main booking event
            const hasAddOns = props.booking.addOns && props.booking.addOns !== 'None';
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
        } else if (props.type === 'onboarding' || props.type === 'deloading') {
            // Allocation event
            const isStaffed = props.staffName && props.staffName !== 'Unassigned';
            content = `
                <div class="fc-event-allocation ${isStaffed ? 'staffed' : 'unstaffed'}">
                    <div class="fc-event-title">${arg.event.title}</div>
                </div>
            `;
        }
        
        return { html: content };
    }
    
    getEventClasses(arg) {
        const classes = [];
        const props = arg.event.extendedProps;
        
        if (props.type === 'booking') {
            classes.push('event-booking');
            if (props.status) {
                classes.push(`status-${props.status.toLowerCase()}`);
            }
        } else if (props.type === 'onboarding') {
            classes.push('event-allocation', 'event-onboarding');
            if (!props.staffName || props.staffName === 'Unassigned') {
                classes.push('unstaffed');
            }
        } else if (props.type === 'deloading') {
            classes.push('event-allocation', 'event-deloading');
            if (!props.staffName || props.staffName === 'Unassigned') {
                classes.push('unstaffed');
            }
        }
        
        return classes;
    }
    
    handleEventClick(info) {
        const props = info.event.extendedProps;
        
        if (props.type === 'booking') {
            this.showBookingDetails(props.booking);
        } else if (props.type === 'onboarding' || props.type === 'deloading') {
            if (this.userRole === 'Admin') {
                this.showAllocationModal(props);
            } else {
                this.showBookingDetails(props.booking);
            }
        }
    }
    
    handleDateClick(info) {
        // Only allow admins to create new allocations
        if (this.userRole !== 'Admin') return;
        
        // Only in timeline view
        if (!info.resource) return;
        
        // Check if click is within a booking
        const clickTime = info.date;
        const vesselId = info.resource.id;
        
        // Find booking at this time
        const booking = this.runSheetData.bookings.find(b => {
            if (b.vesselId !== vesselId) return false;
            
            const bookingStart = this.parseDateTime(b.bookingDate, b.startTime);
            const bookingEnd = this.parseDateTime(b.bookingDate, b.finishTime);
            
            return clickTime >= bookingStart && clickTime <= bookingEnd;
        });
        
        if (booking) {
            // Show allocation creation modal
            this.showCreateAllocationModal(booking, clickTime);
        }
    }
    
    async handleEventDrop(info) {
        const props = info.event.extendedProps;
        
        // Only allow time adjustments for allocations
        if (props.type !== 'onboarding' && props.type !== 'deloading') {
            info.revert();
            return;
        }
        
        // Update the allocation time
        const newTime = this.formatTime(info.event.start);
        const success = await this.updateAllocationTime(
            props.booking.id,
            props.allocationType,
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
                    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
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
        if (!this.calendar) return;
        
        // Remove all events
        this.calendar.removeAllEvents();
        
        // Add new events
        const events = this.transformToCalendarEvents();
        events.forEach(event => this.calendar.addEvent(event));
    }
    
    switchView(viewType) {
        if (viewType === 'timeline') {
            this.calendar.changeView('resourceTimelineDay');
            document.getElementById('timelineViewBtn').classList.add('active');
            document.getElementById('gridViewBtn').classList.remove('active');
        } else {
            this.calendar.changeView('resourceTimeGridDay');
            document.getElementById('timelineViewBtn').classList.remove('active');
            document.getElementById('gridViewBtn').classList.add('active');
        }
        this.currentView = viewType;
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
            this.loadData();
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
        
        return new Date(year, month - 1, day, hours, minutes);
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

// Initialize the calendar
let dailyRunSheet;
document.addEventListener('DOMContentLoaded', () => {
    // Wait for FullCalendar to be fully loaded
    if (window.fullCalendarReady) {
        dailyRunSheet = new DailyRunSheetCalendar();
    } else if (window.whenFullCalendarReady) {
        window.whenFullCalendarReady(() => {
            dailyRunSheet = new DailyRunSheetCalendar();
        });
    } else {
        // Fallback - try after a delay
        setTimeout(() => {
            dailyRunSheet = new DailyRunSheetCalendar();
        }, 1000);
    }
});

// Global functions for onclick handlers
function switchView(viewType) {
    if (dailyRunSheet) {
        dailyRunSheet.switchView(viewType);
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
