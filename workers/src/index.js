// Simple UUID generator for Workers
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;
        const method = request.method;

        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': env.FRONTEND_URL || 'https://wine.tobiasbay.me',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': 'true',
        };

        // Handle preflight requests
        if (method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        try {
            // Route handling
            if (path === '/api/health') {
                return new Response(JSON.stringify({
                    status: 'OK',
                    timestamp: new Date().toISOString()
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            if (path === '/api/events' && method === 'POST') {
                return await createEvent(request, env, corsHeaders);
            }

            if (path.startsWith('/api/events/') && method === 'GET') {
                const eventId = path.split('/')[3];
                return await getEvent(eventId, env, corsHeaders);
            }

            if (path.startsWith('/api/events/join/') && method === 'GET') {
                const joinCode = path.split('/')[4];
                return await getEventByJoinCode(joinCode, env, corsHeaders);
            }

            if (path.startsWith('/api/events/') && path.endsWith('/shuffle') && method === 'PUT') {
                const eventId = path.split('/')[3];
                return await updateAutoShuffle(eventId, request, env, corsHeaders);
            }

            if (path === '/api/players/join' && method === 'POST') {
                return await joinEvent(request, env, corsHeaders);
            }

            if (path.startsWith('/api/players/event/') && method === 'GET') {
                const eventId = path.split('/')[4];
                return await getEventPlayers(eventId, env, corsHeaders);
            }

            return new Response(JSON.stringify({ error: 'Route not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } catch (error) {
            console.error('Error:', error);
            console.error('Error details:', error.message, error.stack);
            return new Response(JSON.stringify({
                error: 'Internal server error',
                details: error.message
            }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    }
};

async function createEvent(request, env, corsHeaders) {
    try {
        const eventData = await request.json();
        console.log('Creating event with data:', eventData);

        const eventId = generateUUID();
        const joinCode = Math.floor(100000 + Math.random() * 900000).toString();

        console.log('Generated eventId:', eventId, 'joinCode:', joinCode);

        const result = await env.wine_events.prepare(`
      INSERT INTO events (
        id, name, date, max_participants, wine_type, location,
        description, budget, duration, wine_notes, join_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
            eventId,
            eventData.name,
            eventData.date,
            eventData.maxParticipants,
            eventData.wineType,
            eventData.location,
            eventData.description || '',
            eventData.budget || '',
            eventData.duration || '',
            eventData.wineNotes || '',
            joinCode
        ).run();

        console.log('Database insert result:', result);

        return new Response(JSON.stringify({
            success: true,
            eventId: eventId,
            joinCode: joinCode
        }), {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error in createEvent:', error);
        throw error;
    }
}

async function getEvent(eventId, env, corsHeaders) {
    const event = await env.wine_events.prepare(`
    SELECT * FROM events WHERE id = ? AND is_active = 1
  `).bind(eventId).first();

    if (!event) {
        return new Response(JSON.stringify({ error: 'Event not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const players = await env.wine_events.prepare(`
    SELECT * FROM players 
    WHERE event_id = ? AND is_active = 1 
    ORDER BY presentation_order ASC
  `).bind(eventId).all();

    return new Response(JSON.stringify({
        ...event,
        players: players.results || []
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function getEventByJoinCode(joinCode, env, corsHeaders) {
    const event = await env.wine_events.prepare(`
    SELECT * FROM events WHERE join_code = ? AND is_active = 1
  `).bind(joinCode).first();

    if (!event) {
        return new Response(JSON.stringify({ error: 'Invalid join code' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const players = await env.wine_events.prepare(`
    SELECT * FROM players 
    WHERE event_id = ? AND is_active = 1 
    ORDER BY presentation_order ASC
  `).bind(event.id).all();

    return new Response(JSON.stringify({
        ...event,
        players: players.results || []
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function updateAutoShuffle(eventId, request, env, corsHeaders) {
    const { autoShuffle } = await request.json();

    await env.wine_events.prepare(`
    UPDATE events SET auto_shuffle = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).bind(autoShuffle, eventId).run();

    if (autoShuffle) {
        // Shuffle players
        const players = await env.wine_events.prepare(`
      SELECT * FROM players WHERE event_id = ? AND is_active = 1 
      ORDER BY presentation_order ASC
    `).bind(eventId).all();

        const shuffledPlayers = [...players.results].sort(() => Math.random() - 0.5);

        for (let i = 0; i < shuffledPlayers.length; i++) {
            await env.wine_events.prepare(`
        UPDATE players SET presentation_order = ? WHERE id = ?
      `).bind(i + 1, shuffledPlayers[i].id).run();
        }
    }

    return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function joinEvent(request, env, corsHeaders) {
    const { joinCode, playerName } = await request.json();

    if (!joinCode || !playerName) {
        return new Response(JSON.stringify({
            error: 'Join code and player name are required'
        }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const event = await env.wine_events.prepare(`
    SELECT * FROM events WHERE join_code = ? AND is_active = 1
  `).bind(joinCode).first();

    if (!event) {
        return new Response(JSON.stringify({ error: 'Invalid join code' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const currentPlayers = await env.wine_events.prepare(`
    SELECT COUNT(*) as count FROM players WHERE event_id = ? AND is_active = 1
  `).bind(event.id).first();

    if (currentPlayers.count >= event.max_participants) {
        return new Response(JSON.stringify({ error: 'Event is full' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const playerId = generateUUID();
    const presentationOrder = currentPlayers.count + 1;

    await env.wine_events.prepare(`
    INSERT INTO players (id, event_id, name, presentation_order)
    VALUES (?, ?, ?, ?)
  `).bind(playerId, event.id, playerName, presentationOrder).run();

    return new Response(JSON.stringify({
        success: true,
        eventId: event.id,
        playerId: playerId,
        presentationOrder: presentationOrder,
        message: `Welcome ${playerName}! You've joined the event.`
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function getEventPlayers(eventId, env, corsHeaders) {
    const players = await env.wine_events.prepare(`
    SELECT * FROM players 
    WHERE event_id = ? AND is_active = 1 
    ORDER BY presentation_order ASC
  `).bind(eventId).all();

    return new Response(JSON.stringify(players.results || []), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}
