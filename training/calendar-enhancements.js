/**
 * MBH Staff Portal - Calendar Enhancements
 * Mobile gestures, real-time updates, and performance optimizations
 */

class CalendarEnhancements {
    constructor() {
        this.touchStartX = null;
        this.touchStartY = null;
        this.touchStartTime = null;
        this.isLongPress = false;
        this.longPressTimer = null;
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.pendingUpdates = new Set();
        this.updateDebouncer = null;
    }

    /**
     * Initialize all enhancements
     */
    init(calendar, config = {}) {
        this.calendar = calendar;
        this.config = {
            enableGestures: true,
            enableRealtime: true,
            enableCache: true,
            wsUrl: config.wsUrl || this.getWebSocketUrl(),
            ...config
        };

        if (this.config.enableGestures && this.isMobile()) {
            this.initMobileGestures();
        }

        if (this.config.enableCache) {
            this.initCaching();
        }

        if (this.config.enableRealtime) {
            this.initRealtimeUpdates();
        }

        this.initPerformanceOptimizations();
    }

    /**
     * Mobile Gesture Support
     */
    initMobileGestures() {
        const calendarEl = this.calendar.el;

        // Touch event listeners
        calendarEl.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        calendarEl.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        calendarEl.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });

        // Add visual feedback for swipe
        this.addSwipeIndicator();

        console.log('Mobile gestures initialized');
    }

    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
        this.touchStartTime = Date.now();
        this.isLongPress = false;

        // Long press detection
        const target = e.target;
        const eventEl = target.closest('.fc-event');
        
        if (eventEl) {
            this.longPressTimer = setTimeout(() => {
                this.isLongPress = true;
                this.handleLongPress(eventEl, e);
            }, 500);
        }
    }

    handleTouchMove(e) {
        if (!this.touchStartX || !this.touchStartY) return;

        const deltaX = e.touches[0].clientX - this.touchStartX;
        const deltaY = e.touches[0].clientY - this.touchStartY;

        // Cancel long press if moving
        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
            clearTimeout(this.longPressTimer);
            this.isLongPress = false;
        }

        // Show swipe indicator
        if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 30) {
            e.preventDefault();
            this.updateSwipeIndicator(deltaX);
        }
    }

    handleTouchEnd(e) {
        clearTimeout(this.longPressTimer);

        if (!this.touchStartX || !this.touchStartY || this.isLongPress) {
            this.hideSwipeIndicator();
            return;
        }

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaX = touchEndX - this.touchStartX;
        const deltaY = touchEndY - this.touchStartY;
        const deltaTime = Date.now() - this.touchStartTime;

        // Detect horizontal swipe
        if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 30 && deltaTime < 300) {
            if (deltaX > 0) {
                this.animateTransition('prev');
                this.calendar.prev();
            } else {
                this.animateTransition('next');
                this.calendar.next();
            }
        }

        this.hideSwipeIndicator();
        this.touchStartX = null;
        this.touchStartY = null;
    }

    handleLongPress(eventEl, e) {
        // Haptic feedback if available
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }

        // Get event data
        const fcEvent = this.calendar.getEvents().find(event => 
            event.el === eventEl || event.el.contains(eventEl)
        );

        if (!fcEvent) return;

        // Show quick action menu
        this.showQuickActions(fcEvent, e.touches[0]);
    }

    showQuickActions(event, touch) {
        // Create quick action menu
        const menu = document.createElement('div');
        menu.className = 'quick-action-menu';
        menu.innerHTML = `
            <div class="quick-action-item" data-action="accept">
                <i class="fas fa-check"></i> Accept
            </div>
            <div class="quick-action-item" data-action="decline">
                <i class="fas fa-times"></i> Decline
            </div>
            <div class="quick-action-item" data-action="reassign">
                <i class="fas fa-user-swap"></i> Reassign
            </div>
            <div class="quick-action-item" data-action="notes">
                <i class="fas fa-sticky-note"></i> Add Note
            </div>
        `;

        // Position menu near touch point
        menu.style.left = `${touch.clientX}px`;
        menu.style.top = `${touch.clientY - 100}px`;

        document.body.appendChild(menu);

        // Handle actions
        menu.addEventListener('click', (e) => {
            const action = e.target.closest('.quick-action-item')?.dataset.action;
            if (action) {
                this.handleQuickAction(event, action);
                menu.remove();
            }
        });

        // Remove menu on outside click
        setTimeout(() => {
            document.addEventListener('click', () => menu.remove(), { once: true });
        }, 100);
    }

    handleQuickAction(event, action) {
        const props = event.extendedProps;
        
        switch (action) {
            case 'accept':
                if (props.recordType === 'allocation') {
                    this.updateAllocationStatus(props.record.id, 'Accepted');
                }
                break;
            case 'decline':
                if (props.recordType === 'allocation') {
                    this.updateAllocationStatus(props.record.id, 'Declined');
                }
                break;
            case 'reassign':
                // Trigger reassignment modal
                if (window.openReassignModal) {
                    window.openReassignModal(props.record);
                }
                break;
            case 'notes':
                // Trigger notes modal
                if (window.openNotesModal) {
                    window.openNotesModal(props.record);
                }
                break;
        }
    }

    /**
     * Swipe Animation Support
     */
    addSwipeIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'swipe-indicator';
        indicator.innerHTML = '<i class="fas fa-chevron-left"></i>';
        indicator.style.display = 'none';
        this.calendar.el.appendChild(indicator);
        this.swipeIndicator = indicator;
    }

    updateSwipeIndicator(deltaX) {
        if (!this.swipeIndicator) return;
        
        this.swipeIndicator.style.display = 'flex';
        this.swipeIndicator.style.opacity = Math.min(Math.abs(deltaX) / 100, 1);
        
        if (deltaX > 0) {
            this.swipeIndicator.innerHTML = '<i class="fas fa-chevron-left"></i>';
            this.swipeIndicator.style.left = '10px';
            this.swipeIndicator.style.right = 'auto';
        } else {
            this.swipeIndicator.innerHTML = '<i class="fas fa-chevron-right"></i>';
            this.swipeIndicator.style.right = '10px';
            this.swipeIndicator.style.left = 'auto';
        }
    }

    hideSwipeIndicator() {
        if (this.swipeIndicator) {
            this.swipeIndicator.style.display = 'none';
        }
    }

    animateTransition(direction) {
        const calendarEl = this.calendar.el;
        calendarEl.style.transition = 'transform 0.3s ease-out';
        calendarEl.style.transform = direction === 'prev' ? 'translateX(50px)' : 'translateX(-50px)';
        
        setTimeout(() => {
            calendarEl.style.transform = 'translateX(0)';
            setTimeout(() => {
                calendarEl.style.transition = '';
            }, 300);
        }, 50);
    }

    /**
     * Performance Optimizations - Caching
     */
    initCaching() {
        // Override calendar's event fetching to use cache
        this.wrapEventFetching();
        
        // Set up cache cleanup
        setInterval(() => this.cleanupCache(), 60000); // Cleanup every minute
    }

    wrapEventFetching() {
        const originalFetch = window.loadAllData || (() => {});
        
        window.loadAllData = async () => {
            const cacheKey = this.getCacheKey();
            const cached = this.getFromCache(cacheKey);
            
            if (cached) {
                console.log('Using cached calendar data');
                this.renderCachedData(cached);
                
                // Fetch fresh data in background
                this.fetchFreshData(originalFetch, cacheKey);
                return;
            }
            
            // No cache, fetch normally
            const data = await originalFetch();
            this.setCache(cacheKey, data);
            return data;
        };
    }

    getCacheKey() {
        const view = this.calendar.view;
        const start = view.activeStart.toISOString().split('T')[0];
        const end = view.activeEnd.toISOString().split('T')[0];
        return `calendar_${start}_${end}`;
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > this.cacheExpiry) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    cleanupCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.cacheExpiry) {
                this.cache.delete(key);
            }
        }
    }

    async fetchFreshData(originalFetch, cacheKey) {
        try {
            const freshData = await originalFetch();
            this.setCache(cacheKey, freshData);
            
            // Check if data has changed
            const cached = this.getFromCache(cacheKey);
            if (JSON.stringify(cached) !== JSON.stringify(freshData)) {
                // Update calendar if data changed
                this.updateCalendarEvents(freshData);
            }
        } catch (error) {
            console.error('Error fetching fresh data:', error);
        }
    }

    /**
     * Real-time Updates via WebSocket
     */
    initRealtimeUpdates() {
        this.connectWebSocket();
        
        // Reconnect on visibility change
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.ws?.readyState !== WebSocket.OPEN) {
                this.connectWebSocket();
            }
        });
    }

    getWebSocketUrl() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${protocol}//${window.location.host}/ws`;
    }

    connectWebSocket() {
        if (this.ws?.readyState === WebSocket.OPEN) return;
        
        console.log('Connecting to WebSocket...');
        
        this.ws = new WebSocket(this.config.wsUrl);
        
        this.ws.onopen = () => {
            console.log('WebSocket connected');
            this.reconnectAttempts = 0;
            this.reconnectDelay = 1000;
            
            // Subscribe to calendar updates
            this.ws.send(JSON.stringify({
                type: 'subscribe',
                channel: 'calendar_updates'
            }));
        };
        
        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleRealtimeUpdate(data);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
        
        this.ws.onclose = () => {
            console.log('WebSocket disconnected');
            this.scheduleReconnect();
        };
    }

    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('Max reconnection attempts reached');
            return;
        }
        
        this.reconnectAttempts++;
        const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
        
        console.log(`Reconnecting in ${delay/1000}s (attempt ${this.reconnectAttempts})`);
        
        setTimeout(() => {
            if (document.visibilityState === 'visible') {
                this.connectWebSocket();
            }
        }, delay);
    }

    handleRealtimeUpdate(data) {
        switch (data.type) {
            case 'allocation_created':
            case 'allocation_updated':
            case 'allocation_deleted':
                this.pendingUpdates.add(data);
                this.debouncedUpdate();
                break;
                
            case 'booking_updated':
                this.pendingUpdates.add(data);
                this.debouncedUpdate();
                break;
                
            case 'conflict_detected':
                this.showConflictNotification(data);
                break;
        }
    }

    debouncedUpdate() {
        clearTimeout(this.updateDebouncer);
        this.updateDebouncer = setTimeout(() => {
            this.processPendingUpdates();
        }, 500);
    }

    processPendingUpdates() {
        if (this.pendingUpdates.size === 0) return;
        
        const updates = Array.from(this.pendingUpdates);
        this.pendingUpdates.clear();
        
        // Show update notification
        this.showUpdateNotification(updates);
        
        // Refresh calendar data
        if (window.loadAllData) {
            window.loadAllData();
        }
    }

    showUpdateNotification(updates) {
        const notification = document.createElement('div');
        notification.className = 'realtime-notification';
        
        const summary = this.summarizeUpdates(updates);
        notification.innerHTML = `
            <i class="fas fa-sync"></i>
            <span>${summary}</span>
            <button class="notification-close">&times;</button>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Auto-hide after 5 seconds
        setTimeout(() => this.hideNotification(notification), 5000);
        
        // Manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            this.hideNotification(notification);
        });
    }

    hideNotification(notification) {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }

    summarizeUpdates(updates) {
        const counts = {
            allocation_created: 0,
            allocation_updated: 0,
            allocation_deleted: 0,
            booking_updated: 0
        };
        
        updates.forEach(update => counts[update.type]++);
        
        const parts = [];
        if (counts.allocation_created) parts.push(`${counts.allocation_created} new allocation${counts.allocation_created > 1 ? 's' : ''}`);
        if (counts.allocation_updated) parts.push(`${counts.allocation_updated} updated`);
        if (counts.allocation_deleted) parts.push(`${counts.allocation_deleted} deleted`);
        if (counts.booking_updated) parts.push(`${counts.booking_updated} booking${counts.booking_updated > 1 ? 's' : ''} changed`);
        
        return parts.join(', ');
    }

    showConflictNotification(data) {
        const notification = document.createElement('div');
        notification.className = 'conflict-notification';
        notification.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <div>
                <strong>Scheduling Conflict!</strong>
                <p>${data.message}</p>
            </div>
            <button class="notification-action" data-allocation-id="${data.allocationId}">
                View Details
            </button>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Handle action
        notification.querySelector('.notification-action').addEventListener('click', (e) => {
            const allocationId = e.target.dataset.allocationId;
            // Open allocation modal or highlight the conflict
            this.highlightAllocation(allocationId);
            this.hideNotification(notification);
        });
    }

    highlightAllocation(allocationId) {
        const event = this.calendar.getEvents().find(e => 
            e.extendedProps.record?.id === allocationId
        );
        
        if (event) {
            // Scroll to event
            event.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Highlight
            event.el.classList.add('highlighted');
            setTimeout(() => event.el.classList.remove('highlighted'), 3000);
        }
    }

    /**
     * Performance - Virtual Scrolling for Large Datasets
     */
    initPerformanceOptimizations() {
        // Lazy load event details
        this.setupLazyLoading();
        
        // Optimize render performance
        this.optimizeRendering();
    }

    setupLazyLoading() {
        // Override event rendering to load details on demand
        const originalEventContent = this.calendar.options.eventContent;
        
        this.calendar.setOption('eventContent', (arg) => {
            const event = arg.event;
            const props = event.extendedProps;
            
            // Return minimal content initially
            if (!props.detailsLoaded) {
                return {
                    html: `
                        <div class="fc-event-lazy">
                            <span class="fc-event-title">${event.title}</span>
                            <span class="loading-spinner" style="display:none;">
                                <i class="fas fa-spinner fa-spin"></i>
                            </span>
                        </div>
                    `
                };
            }
            
            // Return full content after details loaded
            return originalEventContent ? originalEventContent(arg) : arg;
        });
    }

    optimizeRendering() {
        // Use requestAnimationFrame for smooth updates
        const originalAddEvent = this.calendar.addEvent;
        this.calendar.addEvent = function(event) {
            requestAnimationFrame(() => {
                originalAddEvent.call(this, event);
            });
        };
        
        // Batch DOM updates
        let updateQueue = [];
        let updateScheduled = false;
        
        this.batchUpdate = (fn) => {
            updateQueue.push(fn);
            
            if (!updateScheduled) {
                updateScheduled = true;
                requestAnimationFrame(() => {
                    updateQueue.forEach(fn => fn());
                    updateQueue = [];
                    updateScheduled = false;
                });
            }
        };
    }

    /**
     * Utility Methods
     */
    isMobile() {
        return window.innerWidth <= 768;
    }

    async updateAllocationStatus(allocationId, status) {
        try {
            const response = await fetch('/api/allocations/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ allocationId, status })
            });
            
            if (response.ok) {
                // Refresh calendar
                if (window.loadAllData) {
                    window.loadAllData();
                }
            }
        } catch (error) {
            console.error('Error updating allocation status:', error);
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        // Remove event listeners
        const calendarEl = this.calendar.el;
        calendarEl.removeEventListener('touchstart', this.handleTouchStart);
        calendarEl.removeEventListener('touchmove', this.handleTouchMove);
        calendarEl.removeEventListener('touchend', this.handleTouchEnd);
        
        // Close WebSocket
        if (this.ws) {
            this.ws.close();
        }
        
        // Clear timers
        clearTimeout(this.longPressTimer);
        clearTimeout(this.updateDebouncer);
        
        // Clear cache
        this.cache.clear();
    }
}

// Export for use
window.CalendarEnhancements = CalendarEnhancements;
