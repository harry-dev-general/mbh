/**
 * Quick allocation status update endpoint
 * Used by mobile quick actions
 */

const axios = require('axios');

module.exports = async (req, res) => {
    const { allocationId, status } = req.body;

    if (!allocationId || !status) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const validStatuses = ['Accepted', 'Declined', 'Pending'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        // Update allocation in Airtable
        const response = await axios.patch(
            `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Shift%20Allocations/${allocationId}`,
            {
                fields: {
                    'Response Status': status,
                    'Response Date': new Date().toISOString(),
                    'Response Method': 'Quick Action'
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Broadcast update via WebSocket
        const wsHandler = req.app.get('wsHandler');
        if (wsHandler) {
            wsHandler.notifyAllocationUpdated(response.data);
        }

        res.json({ 
            success: true, 
            allocation: response.data 
        });

    } catch (error) {
        console.error('Error updating allocation status:', error);
        res.status(500).json({ 
            error: 'Failed to update allocation status',
            details: error.response?.data?.error || error.message 
        });
    }
};
