// Simple UUID generator for Workers
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Generate ETag for data
function generateETag(data) {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return `"${Math.abs(hash).toString(16)}"`;
}

// Handle conditional requests with ETag
function handleConditionalRequest(request, data, corsHeaders) {
    const ifNoneMatch = request.headers.get('If-None-Match');
    const etag = generateETag(data);

    if (ifNoneMatch && ifNoneMatch === etag) {
        return new Response(null, {
            status: 304,
            headers: {
                ...corsHeaders,
                'ETag': etag,
                'Cache-Control': 'no-cache'
            }
        });
    }

    return new Response(JSON.stringify(data), {
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'ETag': etag,
            'Cache-Control': 'no-cache'
        }
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
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, If-None-Match',
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

            // Processing request

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

            if (apiPath.startsWith('/api/debug/event/') && apiPath.endsWith('/categories') && method === 'GET') {
                const eventId = apiPath.split('/')[4];
                return await debugEventCategories(eventId, env, corsHeaders);
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

            if (apiPath.startsWith('/api/events/') && apiPath.endsWith('/wine-answers') && method === 'GET') {
                const eventId = apiPath.split('/')[3];
                return await getEventWineAnswers(eventId, env, corsHeaders);
            }

            if (apiPath.startsWith('/api/events/') && apiPath.endsWith('/scores') && method === 'GET') {
                const eventId = apiPath.split('/')[3];
                return await getWineScores(env, eventId, corsHeaders, request);
            }

            if (apiPath.startsWith('/api/events/') && apiPath.endsWith('/scores') && method === 'POST') {
                const eventId = apiPath.split('/')[3];
                return await submitWineScore(request, env, eventId, corsHeaders);
            }

            if (apiPath.startsWith('/api/events/') && apiPath.endsWith('/start') && method === 'POST') {
                const eventId = apiPath.split('/')[3];
                return await startEvent(eventId, env, corsHeaders);
            }

            if (apiPath.startsWith('/api/events/') && apiPath.endsWith('/wine-guesses') && method === 'GET') {
                const eventId = apiPath.split('/')[3];
                return await getEventWineGuesses(eventId, env, corsHeaders);
            }

            if (apiPath.startsWith('/api/events/') && apiPath.endsWith('/current-wine') && method === 'PUT') {
                const eventId = apiPath.split('/')[3];
                return await setCurrentWine(eventId, request, env, corsHeaders);
            }

            if (apiPath.startsWith('/api/events/') && apiPath.endsWith('/leaderboard') && method === 'GET') {
                const eventId = apiPath.split('/')[3];
                return await getLeaderboard(eventId, env, corsHeaders);
            }

            // Server-Sent Events endpoint
            if (apiPath.startsWith('/api/events/') && apiPath.endsWith('/sse') && method === 'GET') {
                const eventId = apiPath.split('/')[3];
                return await handleSSE(eventId, env, corsHeaders);
            }

            // Batch API endpoint
            if (apiPath.startsWith('/api/events/') && apiPath.endsWith('/batch') && method === 'GET') {
                const eventId = apiPath.split('/')[3];
                return await handleBatchRequest(eventId, env, corsHeaders, request);
            }

            if (apiPath.startsWith('/api/events/') && method === 'GET') {
                const eventId = apiPath.split('/')[3];
                return await getEvent(eventId, env, corsHeaders, request);
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

            if (apiPath.startsWith('/api/players/') && apiPath.endsWith('/wine-details') && method === 'GET') {
                const playerId = apiPath.split('/')[3];
                return await getPlayerWineDetails(env, playerId, corsHeaders);
            }

            if (apiPath.startsWith('/api/players/') && apiPath.endsWith('/wine-guesses') && method === 'POST') {
                const playerId = apiPath.split('/')[3];
                return await submitPlayerWineGuesses(playerId, request, env, corsHeaders);
            }

            if (apiPath.startsWith('/api/players/') && apiPath.endsWith('/wine-guesses') && method === 'GET') {
                const playerId = apiPath.split('/')[3];
                const url = new URL(request.url);
                const wineNumber = url.searchParams.get('wineNumber');
                return await getPlayerWineGuesses(playerId, env, corsHeaders, wineNumber ? parseInt(wineNumber) : undefined);
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

        const eventId = generateUUID();
        const joinCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Generated event ID and join code

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

        // Event created successfully

        // Save wine categories if provided
        if (eventData.wineCategories && eventData.wineCategories.length > 0) {
            for (const category of eventData.wineCategories) {
                const categoryId = generateUUID();
                await env.wine_events.prepare(`
                    INSERT INTO wine_categories (
                        id, event_id, guessing_element, difficulty_factor
                    ) VALUES (?, ?, ?, ?)
                `                ).bind(
                    categoryId,
                    eventId,
                    category.guessing_element,
                    category.difficulty_factor
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

async function getEvent(eventId, env, corsHeaders, request = null) {
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

    const responseData = {
        ...event,
        is_active: Boolean(event.is_active),
        auto_shuffle: Boolean(event.auto_shuffle),
        event_started: Boolean(event.event_started),
        players: processedPlayers
    };

    if (request) {
        return handleConditionalRequest(request, responseData, corsHeaders);
    }

    return new Response(JSON.stringify(responseData), {
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
        event_started: Boolean(event.event_started),
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

// Batch API handler - combines multiple data sources
async function handleBatchRequest(eventId, env, corsHeaders, request) {
    try {
        // Verify event exists
        const event = await env.wine_events.prepare(`
            SELECT current_wine_number, event_started, updated_at FROM events WHERE id = ? AND is_active = 1
        `).bind(eventId).first();

        if (!event) {
            return new Response(JSON.stringify({ error: 'Event not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Get current wine scores
        const scores = await env.wine_events.prepare(`
            SELECT ws.*, p.name as player_name, p.presentation_order
            FROM wine_scores ws
            JOIN players p ON ws.player_id = p.id
            WHERE ws.event_id = ? AND ws.wine_number = ?
            ORDER BY p.presentation_order
        `).bind(eventId, event.current_wine_number || 1).all();

        // Get current wine guesses
        const guesses = await env.wine_events.prepare(`
            SELECT pwg.*, p.name as player_name, p.presentation_order, wc.guessing_element
            FROM player_wine_guesses pwg
            JOIN players p ON pwg.player_id = p.id
            JOIN wine_categories wc ON pwg.category_id = wc.id
            WHERE p.event_id = ? AND pwg.wine_number = ?
            ORDER BY p.presentation_order
        `).bind(eventId, event.current_wine_number || 1).all();

        // Get event wine guesses (for categories display)
        const eventGuesses = await env.wine_events.prepare(`
            SELECT wc.id, wc.guessing_element, wc.difficulty_factor,
                   pwg.guess, p.name as player_name, p.presentation_order, pwg.wine_number
            FROM wine_categories wc
            LEFT JOIN player_wine_guesses pwg ON wc.id = pwg.category_id AND pwg.wine_number = ?
            LEFT JOIN players p ON pwg.player_id = p.id
            WHERE wc.event_id = ?
            ORDER BY wc.created_at, p.presentation_order
        `).bind(event.current_wine_number || 1, eventId).all();

        // Calculate average score for current wine
        const wineScores = scores.results || [];
        let averageScore = 0;
        if (wineScores.length > 0) {
            const totalScore = wineScores.reduce((sum, score) => sum + score.score, 0);
            averageScore = Math.round((totalScore / wineScores.length) * 10) / 10;
        }

        // Transform event guesses into categories format
        const categoriesMap = new Map();
        eventGuesses.results.forEach(row => {
            if (!categoriesMap.has(row.id)) {
                categoriesMap.set(row.id, {
                    id: row.id,
                    guessing_element: row.guessing_element,
                    difficulty_factor: row.difficulty_factor,
                    guesses: []
                });
            }

            if (row.guess) {
                categoriesMap.get(row.id).guesses.push({
                    player_name: row.player_name,
                    guess: row.guess,
                    presentation_order: row.presentation_order,
                    wine_number: row.wine_number
                });
            }
        });

        const responseData = {
            success: true,
            timestamp: Date.now(),
            event: {
                current_wine_number: event.current_wine_number || 1,
                event_started: Boolean(event.event_started),
                updated_at: event.updated_at
            },
            scores: {
                average: averageScore,
                count: wineScores.length,
                scores: wineScores
            },
            guesses: {
                current_wine: guesses.results || [],
                categories: Array.from(categoriesMap.values())
            }
        };

        return handleConditionalRequest(request, responseData, corsHeaders);

    } catch (error) {
        console.error('Batch request error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to fetch batch data',
            details: error.message
        }), {
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

// Get leaderboard for event
async function getLeaderboard(eventId, env, corsHeaders) {
    try {
        // Get all players for this event
        const playersResult = await env.wine_events.prepare(`
            SELECT id, name, presentation_order FROM players 
            WHERE event_id = ? AND is_active = 1 
            ORDER BY presentation_order ASC
        `).bind(eventId).all();
        const players = playersResult.results || [];

        if (players.length === 0) {
            return new Response(JSON.stringify({ success: true, leaderboard: [] }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Get wine categories for this event
        const categoriesResult = await env.wine_events.prepare(
            'SELECT * FROM wine_categories WHERE event_id = ? ORDER BY created_at ASC'
        ).bind(eventId).all();
        const categories = categoriesResult.results || [];

        // Calculate scores for each player
        const leaderboard = [];
        for (const player of players) {
            let totalPoints = 0;
            let correctGuesses = 0;
            let totalGuesses = 0;

            // Get all guesses for this player across all wines
            const allPlayerGuessesResult = await env.wine_events.prepare(
                'SELECT category_id, guess, wine_number FROM player_wine_guesses WHERE player_id = ?'
            ).bind(player.id).all();
            const allPlayerGuesses = allPlayerGuessesResult.results || [];

            // For each wine (including their own wine)
            for (const wineOwner of players) {
                // Get the actual wine details for this wine (what the wine owner submitted)
                const actualWineDetailsResult = await env.wine_events.prepare(
                    'SELECT category_id, wine_answer FROM player_wine_details WHERE player_id = ?'
                ).bind(wineOwner.id).all();
                const actualWineDetails = actualWineDetailsResult.results || [];

                // Filter guesses for this specific wine
                const playerGuessesForThisWine = allPlayerGuesses.filter(guess =>
                    guess.wine_number === wineOwner.presentation_order
                );

                // Compare guesses with actual details
                for (const guess of playerGuessesForThisWine) {
                    totalGuesses++;
                    const actualDetail = actualWineDetails.find(d => d.category_id === guess.category_id);

                    if (actualDetail && actualDetail.wine_answer.toLowerCase() === guess.guess.toLowerCase()) {
                        // Correct guess! Get the difficulty factor
                        const category = categories.find(c => c.id === guess.category_id);
                        const difficultyFactor = category ? parseInt(category.difficulty_factor) || 1 : 1;

                        totalPoints += difficultyFactor;
                        correctGuesses++;
                    }
                }
            }

            const accuracy = totalGuesses > 0 ? ((correctGuesses / totalGuesses) * 100).toFixed(1) : "0.0";

            leaderboard.push({
                player_id: player.id,
                player_name: player.name,
                presentation_order: player.presentation_order,
                total_points: totalPoints,
                correct_guesses: correctGuesses,
                total_guesses: totalGuesses,
                accuracy: accuracy
            });
        }

        // Sort by total points (descending), then by accuracy (descending)
        leaderboard.sort((a, b) => {
            if (b.total_points !== a.total_points) {
                return b.total_points - a.total_points;
            }
            return parseFloat(b.accuracy) - parseFloat(a.accuracy);
        });

        return new Response(JSON.stringify({
            success: true,
            leaderboard
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error calculating leaderboard:', error);
        return new Response(JSON.stringify({
            error: 'Failed to calculate leaderboard',
            details: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// Batch API handler - combines multiple data sources
