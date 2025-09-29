const express = require('express');
const router = express.Router();
const db = require('../services/database');

// Join an event
router.post('/join', async (req, res) => {
    try {
        const { joinCode, playerName } = req.body;

        if (!joinCode || !playerName) {
            return res.status(400).json({
                error: 'Join code and player name are required'
            });
        }

        // Get event by join code
        const event = await db.getEventByJoinCode(joinCode);
        if (!event) {
            return res.status(404).json({ error: 'Invalid join code' });
        }

        // Check if event is full
        const currentPlayers = await db.getPlayersByEventId(event.id);
        if (currentPlayers.length >= event.max_participants) {
            return res.status(400).json({ error: 'Event is full' });
        }

        // Add player to event
        const result = await db.addPlayer(event.id, playerName);

        // Get updated player list
        const updatedPlayers = await db.getPlayersByEventId(event.id);

        // Emit real-time update to all clients in the event room
        const io = req.app.get('io');
        io.to(`event-${event.id}`).emit('player-joined', {
            player: {
                id: result.id,
                name: playerName,
                presentationOrder: result.presentationOrder,
                joinedAt: new Date().toISOString()
            },
            allPlayers: updatedPlayers
        });

        res.json({
            success: true,
            eventId: event.id,
            playerId: result.id,
            presentationOrder: result.presentationOrder,
            message: `Welcome ${playerName}! You've joined the event.`
        });
    } catch (error) {
        console.error('Error joining event:', error);
        res.status(500).json({ error: 'Failed to join event' });
    }
});

// Get players for an event
router.get('/event/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;
        const players = await db.getPlayersByEventId(eventId);
        res.json(players);
    } catch (error) {
        console.error('Error fetching players:', error);
        res.status(500).json({ error: 'Failed to fetch players' });
    }
});

// Remove a player from an event
router.delete('/:playerId', async (req, res) => {
    try {
        const { playerId } = req.params;

        // Get player info before removing
        const sql = 'SELECT * FROM players WHERE id = ? AND is_active = 1';
        const player = await new Promise((resolve, reject) => {
            db.db.get(sql, [playerId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }

        await db.removePlayer(playerId);

        // Get updated player list
        const updatedPlayers = await db.getPlayersByEventId(player.event_id);

        // Emit real-time update
        const io = req.app.get('io');
        io.to(`event-${player.event_id}`).emit('player-left', {
            playerId: playerId,
            allPlayers: updatedPlayers
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error removing player:', error);
        res.status(500).json({ error: 'Failed to remove player' });
    }
});

// Update player presentation order (for manual reordering)
router.put('/:playerId/order', async (req, res) => {
    try {
        const { playerId } = req.params;
        const { presentationOrder } = req.body;

        if (typeof presentationOrder !== 'number' || presentationOrder < 1) {
            return res.status(400).json({ error: 'Invalid presentation order' });
        }

        // Update player order
        const sql = 'UPDATE players SET presentation_order = ? WHERE id = ?';
        await new Promise((resolve, reject) => {
            db.db.run(sql, [presentationOrder, playerId], function (err) {
                if (err) reject(err);
                else resolve();
            });
        });

        // Get updated player list
        const sql2 = 'SELECT event_id FROM players WHERE id = ?';
        const player = await new Promise((resolve, reject) => {
            db.db.get(sql2, [playerId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (player) {
            const updatedPlayers = await db.getPlayersByEventId(player.event_id);

            // Emit real-time update
            const io = req.app.get('io');
            io.to(`event-${player.event_id}`).emit('player-order-updated', updatedPlayers);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating player order:', error);
        res.status(500).json({ error: 'Failed to update player order' });
    }
});

module.exports = router;
