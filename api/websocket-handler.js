/**
 * WebSocket Handler for Real-time Calendar Updates
 * 
 * This is a simple implementation for development.
 * For production, consider using Socket.io or a managed WebSocket service.
 */

const WebSocket = require('ws');

class CalendarWebSocketHandler {
    constructor(server) {
        this.wss = new WebSocket.Server({ 
            server,
            path: '/ws'
        });
        
        this.clients = new Map();
        this.channels = new Map();
        
        this.init();
    }

    init() {
        this.wss.on('connection', (ws, req) => {
            const clientId = this.generateClientId();
            this.clients.set(clientId, {
                ws,
                channels: new Set(),
                ip: req.socket.remoteAddress
            });

            console.log(`WebSocket client connected: ${clientId}`);

            ws.on('message', (message) => {
                this.handleMessage(clientId, message);
            });

            ws.on('close', () => {
                this.handleDisconnect(clientId);
            });

            ws.on('error', (error) => {
                console.error(`WebSocket error for client ${clientId}:`, error);
            });

            // Send welcome message
            try {
                ws.send(JSON.stringify({
                    type: 'connected',
                    clientId,
                    timestamp: new Date().toISOString()
                }));
            } catch (error) {
                console.error('Error sending welcome message:', error);
            }
        });

        // Handle server errors
        this.wss.on('error', (error) => {
            console.error('WebSocket server error:', error);
        });
    }

    handleMessage(clientId, message) {
        try {
            const data = JSON.parse(message.toString());
            const client = this.clients.get(clientId);

            switch (data.type) {
                case 'subscribe':
                    this.subscribe(clientId, data.channel);
                    break;
                    
                case 'unsubscribe':
                    this.unsubscribe(clientId, data.channel);
                    break;
                    
                case 'ping':
                    client.ws.send(JSON.stringify({ type: 'pong' }));
                    break;
                    
                default:
                    console.log(`Unknown message type: ${data.type}`);
            }
        } catch (error) {
            console.error('Error handling WebSocket message:', error);
        }
    }

    handleDisconnect(clientId) {
        const client = this.clients.get(clientId);
        if (!client) return;

        // Remove from all channels
        client.channels.forEach(channel => {
            const channelClients = this.channels.get(channel);
            if (channelClients) {
                channelClients.delete(clientId);
                if (channelClients.size === 0) {
                    this.channels.delete(channel);
                }
            }
        });

        this.clients.delete(clientId);
        console.log(`WebSocket client disconnected: ${clientId}`);
    }

    subscribe(clientId, channel) {
        const client = this.clients.get(clientId);
        if (!client) return;

        client.channels.add(channel);

        if (!this.channels.has(channel)) {
            this.channels.set(channel, new Set());
        }
        this.channels.get(channel).add(clientId);

        console.log(`Client ${clientId} subscribed to ${channel}`);

        // Send confirmation
        client.ws.send(JSON.stringify({
            type: 'subscribed',
            channel,
            timestamp: new Date().toISOString()
        }));
    }

    unsubscribe(clientId, channel) {
        const client = this.clients.get(clientId);
        if (!client) return;

        client.channels.delete(channel);

        const channelClients = this.channels.get(channel);
        if (channelClients) {
            channelClients.delete(clientId);
            if (channelClients.size === 0) {
                this.channels.delete(channel);
            }
        }

        console.log(`Client ${clientId} unsubscribed from ${channel}`);
    }

    /**
     * Broadcast updates to subscribed clients
     */
    broadcast(channel, data) {
        const channelClients = this.channels.get(channel);
        if (!channelClients) return;

        const message = JSON.stringify({
            ...data,
            channel,
            timestamp: new Date().toISOString()
        });

        channelClients.forEach(clientId => {
            const client = this.clients.get(clientId);
            if (client && client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(message);
            }
        });

        console.log(`Broadcast to ${channelClients.size} clients on ${channel}:`, data.type);
    }

    /**
     * Send allocation updates
     */
    notifyAllocationCreated(allocation) {
        this.broadcast('calendar_updates', {
            type: 'allocation_created',
            allocation: {
                id: allocation.id,
                date: allocation.fields['Shift Date'],
                employee: allocation.fields['Employee Name'],
                status: allocation.fields['Response Status']
            }
        });
    }

    notifyAllocationUpdated(allocation) {
        this.broadcast('calendar_updates', {
            type: 'allocation_updated',
            allocation: {
                id: allocation.id,
                date: allocation.fields['Shift Date'],
                employee: allocation.fields['Employee Name'],
                status: allocation.fields['Response Status']
            }
        });
    }

    notifyAllocationDeleted(allocationId) {
        this.broadcast('calendar_updates', {
            type: 'allocation_deleted',
            allocationId
        });
    }

    notifyBookingUpdated(booking) {
        this.broadcast('calendar_updates', {
            type: 'booking_updated',
            booking: {
                id: booking.id,
                date: booking.fields['Booking Date'],
                customer: booking.fields['Customer Name'],
                hasStaff: !!booking.fields['Onboarding Staff']
            }
        });
    }

    notifyConflict(allocation1, allocation2) {
        this.broadcast('calendar_updates', {
            type: 'conflict_detected',
            message: `Scheduling conflict: ${allocation1.fields['Employee Name']} is already allocated`,
            allocationId: allocation2.id,
            conflictingAllocationId: allocation1.id
        });
    }

    /**
     * Utility methods
     */
    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getConnectionCount() {
        return this.clients.size;
    }

    getChannelSubscribers(channel) {
        return this.channels.get(channel)?.size || 0;
    }
}

// Export for use in server
module.exports = CalendarWebSocketHandler;
