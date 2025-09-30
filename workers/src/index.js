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
            // Remove /backend prefix if present
            let apiPath = path;
            if (path.startsWith('/backend')) {
                apiPath = path.substring(8); // Remove '/backend' (8 characters)
            }

            console.log('Request path:', path, 'API path:', apiPath, 'Method:', method);

            // Route handling
            if (apiPath === '/api/health') {
                return new Response(JSON.stringify({
                    status: 'OK',
                    timestamp: new Date().toISOString()
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            if (apiPath === '/api/debug/database') {
                return await debugDatabase(env, corsHeaders);
            }

            if (apiPath === '/api/debug/test-wine-answers') {
                return await testWineAnswers(env, corsHeaders);
            }

            if (apiPath === '/api/events' && method === 'POST') {
                return await createEvent(request, env, corsHeaders);
            }

            if (apiPath === '/api/events/list' && method === 'GET') {
                return await getAllEvents(env, corsHeaders);
            }

            if (apiPath.startsWith('/api/events/join/') && method === 'GET') {
                const joinCode = apiPath.split('/')[4];
                return await getEventByJoinCode(joinCode, env, corsHeaders);
            }

            if (apiPath.startsWith('/api/events/') && apiPath.endsWith('/wine-categories') && method === 'GET') {
                const eventId = apiPath.split('/')[3];
                return await getWineCategories(eventId, env, corsHeaders);
            }

            if (apiPath.startsWith('/api/events/') && method === 'GET') {
                const eventId = apiPath.split('/')[3];
                return await getEvent(eventId, env, corsHeaders);
            }

            if (apiPath.startsWith('/api/events/') && apiPath.endsWith('/shuffle') && method === 'PUT') {
                const eventId = apiPath.split('/')[3];
                return await updateAutoShuffle(eventId, request, env, corsHeaders);
            }

            if (apiPath === '/api/players/join' && method === 'POST') {
                return await joinEvent(request, env, corsHeaders);
            }

            if (apiPath.startsWith('/api/players/event/') && method === 'GET') {
                const eventId = apiPath.split('/')[4];
                return await getEventPlayers(eventId, env, corsHeaders);
            }

            if (apiPath.startsWith('/api/events/') && apiPath.endsWith('/players/order') && method === 'PUT') {
                const eventId = apiPath.split('/')[3];
                return await updatePlayerOrder(eventId, request, env, corsHeaders);
            }

            if (apiPath === '/api/players/wine-answers' && method === 'POST') {
                return await submitWineAnswers(request, env, corsHeaders);
            }

            if (apiPath.startsWith('/api/players/') && apiPath.endsWith('/ready') && method === 'PUT') {
                const playerId = apiPath.split('/')[3];
                return await updatePlayerReadyStatus(request, env, playerId, corsHeaders);
            }

            if (apiPath.startsWith('/api/events/') && apiPath.endsWith('/scores') && method === 'GET') {
                const eventId = apiPath.split('/')[3];
                return await getWineScores(env, eventId, corsHeaders);
            }

            if (apiPath.startsWith('/api/events/') && apiPath.endsWith('/scores') && method === 'POST') {
                const eventId = apiPath.split('/')[3];
                return await submitWineScore(request, env, eventId, corsHeaders);
            }

            return new Response(JSON.stringify({
                error: 'Route not found',
                debug: {
                    path: path,
                    apiPath: apiPath,
                    method: method,
                    availableRoutes: [
                        'GET /api/health',
                        'GET /api/debug/database',
                        'GET /api/events/list',
                        'POST /api/events',
                        'GET /api/events/:id',
                        'GET /api/events/join/:joinCode',
                        'GET /api/events/:id/wine-categories',
                        'POST /api/players/join',
                        'POST /api/players/wine-answers'
                    ]
                }
            }), {
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

        // Save wine categories if provided
        if (eventData.wineCategories && eventData.wineCategories.length > 0) {
            for (const category of eventData.wineCategories) {
                const categoryId = generateUUID();
                await env.wine_events.prepare(`
                    INSERT INTO wine_categories (
                        id, event_id, guessing_element, difficulty_factor
                    ) VALUES (?, ?, ?, ?)
                `).bind(
                    categoryId,
                    eventId,
                    category.guessingElement,
                    category.difficultyFactor
                ).run();
            }
        }

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

    // Convert SQLite boolean values (0/1) to actual booleans
    const processedPlayers = (players.results || []).map(player => ({
        ...player,
        is_active: Boolean(player.is_active),
        is_ready: Boolean(player.is_ready)
    }));

    return new Response(JSON.stringify({
        ...event,
        is_active: Boolean(event.is_active),
        auto_shuffle: Boolean(event.auto_shuffle),
        players: processedPlayers
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

    // Convert SQLite boolean values (0/1) to actual booleans
    const processedPlayers = (players.results || []).map(player => ({
        ...player,
        is_active: Boolean(player.is_active),
        is_ready: Boolean(player.is_ready)
    }));

    return new Response(JSON.stringify({
        ...event,
        is_active: Boolean(event.is_active),
        auto_shuffle: Boolean(event.auto_shuffle),
        players: processedPlayers
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

async function updatePlayerOrder(eventId, request, env, corsHeaders) {
    const { players } = await request.json();

    // Update each player's presentation order
    for (let i = 0; i < players.length; i++) {
        await env.wine_events.prepare(`
      UPDATE players SET presentation_order = ? WHERE id = ? AND event_id = ?
    `).bind(i + 1, players[i].id, eventId).run();
    }

    return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function getAllEvents(env, corsHeaders) {
    try {
        const events = await env.wine_events.prepare(`
            SELECT * FROM events ORDER BY created_at DESC
        `).all();

        return new Response(JSON.stringify(events.results || []), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error getting all events:', error);
        return new Response(JSON.stringify({ error: 'Failed to get events' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function getWineCategories(eventId, env, corsHeaders) {
    try {
        const categories = await env.wine_events.prepare(`
            SELECT * FROM wine_categories WHERE event_id = ? ORDER BY created_at ASC
        `).bind(eventId).all();

        return new Response(JSON.stringify(categories.results || []), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error getting wine categories:', error);
        return new Response(JSON.stringify({ error: 'Failed to get wine categories' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function submitWineAnswers(request, env, corsHeaders) {
    try {
        const { playerId, wineAnswers } = await request.json();
        console.log('Submitting wine answers:', { playerId, wineAnswers });

        if (!playerId || !wineAnswers || !Array.isArray(wineAnswers)) {
            console.log('Validation failed:', { playerId, wineAnswers, isArray: Array.isArray(wineAnswers) });
            return new Response(JSON.stringify({
                error: 'Player ID and wine answers array are required'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Validate wine answers
        for (const answer of wineAnswers) {
            if (!answer.categoryId || !answer.wineAnswer) {
                console.log('Answer validation failed:', answer);
                return new Response(JSON.stringify({
                    error: 'Each wine answer must have categoryId and wineAnswer'
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        console.log('About to delete existing answers...');
        // First, delete any existing answers for this player
        await env.wine_events.prepare(`
            DELETE FROM player_wine_details WHERE player_id = ?
        `).bind(playerId).run();
        console.log('Existing answers deleted');

        console.log('About to insert new answers...');
        // Insert new answers
        for (const answer of wineAnswers) {
            const answerId = generateUUID();
            console.log('Inserting answer:', { answerId, playerId, categoryId: answer.categoryId, wineAnswer: answer.wineAnswer });
            await env.wine_events.prepare(`
                INSERT INTO player_wine_details (
                    id, player_id, category_id, wine_answer
                ) VALUES (?, ?, ?, ?)
            `).bind(answerId, playerId, answer.categoryId, answer.wineAnswer).run();
        }
        console.log('All answers inserted successfully');

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error submitting wine answers:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        return new Response(JSON.stringify({
            error: 'Failed to save wine answers',
            details: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function debugDatabase(env, corsHeaders) {
    try {
        const debug = {
            timestamp: new Date().toISOString(),
            database: 'connected',
            tables: {}
        };

        // Check if tables exist and get row counts
        const tables = ['events', 'players', 'wine_categories', 'player_wine_details'];

        for (const table of tables) {
            try {
                const result = await env.wine_events.prepare(`SELECT COUNT(*) as count FROM ${table}`).first();
                debug.tables[table] = {
                    exists: true,
                    rowCount: result.count
                };
            } catch (error) {
                debug.tables[table] = {
                    exists: false,
                    error: error.message
                };
            }
        }

        // Get all events
        try {
            const events = await env.wine_events.prepare(`SELECT id, name, join_code, created_at FROM events ORDER BY created_at DESC`).all();
            debug.events = events.results || [];
        } catch (error) {
            debug.events = { error: error.message };
        }

        return new Response(JSON.stringify(debug), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error in debugDatabase:', error);
        return new Response(JSON.stringify({
            error: 'Database debug failed',
            details: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function testWineAnswers(env, corsHeaders) {
    try {
        const testData = {
            playerId: 'test-player-id',
            wineAnswers: [
                {
                    categoryId: 'test-category-id',
                    wineAnswer: 'Test Answer'
                }
            ]
        };

        // Testing wine answers functionality

        // Test if we can insert into player_wine_details table
        const answerId = generateUUID();
        await env.wine_events.prepare(`
            INSERT INTO player_wine_details (
                id, player_id, category_id, wine_answer
            ) VALUES (?, ?, ?, ?)
        `).bind(answerId, testData.playerId, testData.wineAnswers[0].categoryId, testData.wineAnswers[0].wineAnswer).run();

        // Clean up test data
        await env.wine_events.prepare(`
            DELETE FROM player_wine_details WHERE id = ?
        `).bind(answerId).run();

        return new Response(JSON.stringify({
            success: true,
            message: 'Wine answers table is working correctly'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error in testWineAnswers:', error);
        return new Response(JSON.stringify({
            error: 'Wine answers test failed',
            details: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function updatePlayerReadyStatus(request, env, playerId, corsHeaders) {
    try {
        const data = await request.json();
        const { isReady } = data;

        if (typeof isReady !== 'boolean') {
            return new Response(JSON.stringify({
                error: 'Invalid ready status'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Update player ready status
        await env.wine_events.prepare(`
            UPDATE players 
            SET is_ready = ? 
            WHERE id = ?
        `).bind(isReady, playerId).run();

        return new Response(JSON.stringify({
            success: true,
            message: 'Player ready status updated'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error updating player ready status:', error);
        return new Response(JSON.stringify({
            error: 'Failed to update ready status',
            details: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function getWineScores(env, eventId, corsHeaders) {
    try {
        // Get all scores for the event
        const scores = await env.wine_events.prepare(`
            SELECT ws.*, p.name as player_name, p.presentation_order
            FROM wine_scores ws
            JOIN players p ON ws.player_id = p.id
            WHERE ws.event_id = ?
            ORDER BY ws.wine_number, p.presentation_order
        `).bind(eventId).all();

        // Calculate average scores by wine number
        const wineAverages = {};
        const wineCounts = {};

        scores.results.forEach(score => {
            const wineNum = score.wine_number;
            if (!wineAverages[wineNum]) {
                wineAverages[wineNum] = 0;
                wineCounts[wineNum] = 0;
            }
            wineAverages[wineNum] += score.score;
            wineCounts[wineNum]++;
        });

        // Calculate final averages
        const averages = {};
        Object.keys(wineAverages).forEach(wineNum => {
            averages[wineNum] = {
                average: Math.round((wineAverages[wineNum] / wineCounts[wineNum]) * 10) / 10,
                totalScores: wineCounts[wineNum],
                scores: scores.results.filter(s => s.wine_number == wineNum)
            };
        });

        return new Response(JSON.stringify({
            success: true,
            averages: averages,
            allScores: scores.results
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error getting wine scores:', error);
        return new Response(JSON.stringify({
            error: 'Failed to get wine scores',
            details: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function submitWineScore(request, env, eventId, corsHeaders) {
    try {
        const data = await request.json();
        const { playerId, wineNumber, score } = data;

        if (!playerId || !wineNumber || !score) {
            return new Response(JSON.stringify({
                error: 'Missing required fields: playerId, wineNumber, score'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (score < 1 || score > 10) {
            return new Response(JSON.stringify({
                error: 'Score must be between 1 and 10'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const scoreId = generateUUID();

        // Insert or update the score
        await env.wine_events.prepare(`
            INSERT OR REPLACE INTO wine_scores (
                id, event_id, player_id, wine_number, score, updated_at
            ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(scoreId, eventId, playerId, wineNumber, score).run();

        return new Response(JSON.stringify({
            success: true,
            message: 'Wine score submitted successfully'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error submitting wine score:', error);
        return new Response(JSON.stringify({
            error: 'Failed to submit wine score',
            details: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
