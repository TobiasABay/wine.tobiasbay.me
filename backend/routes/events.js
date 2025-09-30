const express = require('express');
const router = express.Router();
const db = require('../services/database');

// Create a new event
router.post('/', async (req, res) => {
    try {
        const eventData = req.body;

        // Validate required fields
        if (!eventData.name || !eventData.date || !eventData.maxParticipants ||
            !eventData.wineType || !eventData.location) {
            return res.status(400).json({
                error: 'Missing required fields: name, date, maxParticipants, wineType, location'
            });
        }

        const result = await db.createEvent(eventData);

        // Emit real-time update
        const io = req.app.get('io');
        io.emit('event-created', { eventId: result.id, joinCode: result.joinCode });

        res.status(201).json({
            success: true,
            eventId: result.id,
            joinCode: result.joinCode
        });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: 'Failed to create event' });
    }
});

// Get event by ID
router.get('/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;
        const event = await db.getEventById(eventId);

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Get players for this event
        const players = await db.getPlayersByEventId(eventId);

        res.json({
            ...event,
            players: players
        });
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ error: 'Failed to fetch event' });
    }
});

// Get event by join code
router.get('/join/:joinCode', async (req, res) => {
    try {
        const { joinCode } = req.params;
        const event = await db.getEventByJoinCode(joinCode);

        if (!event) {
            return res.status(404).json({ error: 'Invalid join code' });
        }

        // Get players for this event
        const players = await db.getPlayersByEventId(event.id);

        res.json({
            ...event,
            players: players
        });
    } catch (error) {
        console.error('Error fetching event by join code:', error);
        res.status(500).json({ error: 'Failed to fetch event' });
    }
});

// Get wine categories for an event
router.get('/:id/wine-categories', async (req, res) => {
    try {
        const eventId = req.params.id;
        const wineCategories = await db.getWineCategoriesByEventId(eventId);
        res.json(wineCategories);
    } catch (error) {
        console.error('Error fetching wine categories:', error);
        res.status(500).json({ error: 'Failed to fetch wine categories' });
    }
});

// Update event auto shuffle setting
router.put('/:eventId/shuffle', async (req, res) => {
    try {
        const { eventId } = req.params;
        const { autoShuffle } = req.body;

        await db.updateEventAutoShuffle(eventId, autoShuffle);

        // If auto shuffle is enabled, shuffle the players
        if (autoShuffle) {
            const shuffledPlayers = await db.shufflePlayers(eventId);

            // Emit real-time update
            const io = req.app.get('io');
            io.to(`event-${eventId}`).emit('players-shuffled', shuffledPlayers);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating shuffle setting:', error);
        res.status(500).json({ error: 'Failed to update shuffle setting' });
    }
});

// Get event players
router.get('/:eventId/players', async (req, res) => {
    try {
        const { eventId } = req.params;
        const players = await db.getPlayersByEventId(eventId);
        res.json(players);
    } catch (error) {
        console.error('Error fetching players:', error);
        res.status(500).json({ error: 'Failed to fetch players' });
    }
});

// Manually shuffle players
router.post('/:eventId/shuffle-players', async (req, res) => {
    try {
        const { eventId } = req.params;
        const shuffledPlayers = await db.shufflePlayers(eventId);

        // Emit real-time update
        const io = req.app.get('io');
        io.to(`event-${eventId}`).emit('players-shuffled', shuffledPlayers);

        res.json({ success: true, players: shuffledPlayers });
    } catch (error) {
        console.error('Error shuffling players:', error);
        res.status(500).json({ error: 'Failed to shuffle players' });
    }
});

// Update player order
router.put('/:eventId/players/order', async (req, res) => {
    try {
        const { eventId } = req.params;
        const { players } = req.body;

        await db.updatePlayerOrder(eventId, players);

        // Emit real-time update
        const io = req.app.get('io');
        io.to(`event-${eventId}`).emit('players-reordered', players);

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating player order:', error);
        res.status(500).json({ error: 'Failed to update player order' });
    }
});

module.exports = router;
