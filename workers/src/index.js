// Simple UUID generator for Workers
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Input validation functions
function validateScore(score) {
    const num = parseFloat(score);
    return !isNaN(num) && num >= 1 && num <= 5;
}

function validateUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

// List of inappropriate words that should be blocked
const BLOCKED_WORDS = [
    'nigger', 'nigga', 'n1gger', 'n1gga',
    'fuck', 'shit', 'bitch', 'cunt', 'dick', 'cock', 'pussy',
    'retard', 'fag', 'faggot',
    'ass', 'asshole', 'bastard', 'damn', 'hell',
    'whore', 'slut', 'piss',
    'f4ck', 'fvck', 'sh1t', 'b1tch', 'a55', 'a55hole'
];

function containsInappropriateContent(text) {
    if (!text) return false;

    const normalized = text.toLowerCase()
        .replace(/0/g, 'o')
        .replace(/1/g, 'i')
        .replace(/3/g, 'e')
        .replace(/4/g, 'a')
        .replace(/5/g, 's')
        .replace(/7/g, 't')
        .replace(/\$/g, 's')
        .replace(/@/g, 'a')
        .replace(/[\s\-_.@#$%^&*()+=]/g, '');

    return BLOCKED_WORDS.some(word => {
        const normalizedWord = word.toLowerCase().replace(/[\s\-_.]/g, '');
        return normalized.includes(normalizedWord);
    });
}

// Input sanitization functions
function sanitizeInput(input, maxLength = 100) {
    if (!input || typeof input !== 'string') return '';

    let sanitized = input
        .replace(/<[^>]*>/g, '')
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/data:text\/html/gi, '')
        .trim();

    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
}

function sanitizePlayerName(name, trimSpaces = true) {
    if (!name || typeof name !== 'string') return '';

    let sanitized = name
        .replace(/<[^>]*>/g, '')
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/data:text\/html/gi, '');

    sanitized = sanitized.replace(/[^\p{L}\p{N}\s\-'.]/gu, '');
    sanitized = sanitized.replace(/\s+/g, ' ');

    if (trimSpaces) {
        sanitized = sanitized.trim();
    }

    if (sanitized.length > 50) {
        sanitized = sanitized.substring(0, 50);
    }

    return sanitized;
}

function validatePlayerName(name) {
    const sanitized = sanitizePlayerName(name);

    if (!sanitized) {
        return { isValid: false, error: 'Name is required' };
    }

    if (sanitized.length < 2) {
        return { isValid: false, error: 'Name must be at least 2 characters' };
    }

    if (sanitized.length > 50) {
        return { isValid: false, error: 'Name must be less than 50 characters' };
    }

    if (!/\p{L}/u.test(sanitized)) {
        return { isValid: false, error: 'Name must contain at least one letter' };
    }

    // Check for inappropriate content
    if (containsInappropriateContent(sanitized)) {
        return { isValid: false, error: 'Please choose an appropriate name' };
    }

    return { isValid: true };
}

function sanitizeEventName(name, trimSpaces = true) {
    if (!name || typeof name !== 'string') return '';

    let sanitized = name
        .replace(/<[^>]*>/g, '')
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/data:text\/html/gi, '');

    sanitized = sanitized.replace(/[^\p{L}\p{N}\s\-._'&!?]/gu, '');
    sanitized = sanitized.replace(/\s+/g, ' ');

    if (trimSpaces) {
        sanitized = sanitized.trim();
    }

    if (sanitized.length > 100) {
        sanitized = sanitized.substring(0, 100);
    }

    return sanitized;
}

function validateEventName(name) {
    const sanitized = sanitizeEventName(name);

    if (!sanitized) {
        return { isValid: false, error: 'Event name is required' };
    }

    if (sanitized.length < 3) {
        return { isValid: false, error: 'Event name must be at least 3 characters' };
    }

    if (sanitized.length > 100) {
        return { isValid: false, error: 'Event name must be less than 100 characters' };
    }

    if (containsInappropriateContent(sanitized)) {
        return { isValid: false, error: 'Please choose an appropriate event name' };
    }

    return { isValid: true };
}

function sanitizeJoinCode(code) {
    if (!code || typeof code !== 'string') return '';

    let sanitized = code
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 6);

    return sanitized;
}

// Scheduled task to mark stale events as inactive
async function cleanupStaleEvents(env) {
    try {
        // Calculate timestamp for 12 hours ago
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

        // Mark events as inactive if not updated in the last 12 hours
        const result = await env.wine_events.prepare(`
            UPDATE events 
            SET is_active = 0 
            WHERE is_active = 1 
            AND updated_at < ?
        `).bind(twelveHoursAgo).run();

        console.log(`[CLEANUP] Marked ${result.meta.changes} stale events as inactive (older than ${twelveHoursAgo})`);

        return result.meta.changes;
    } catch (error) {
        console.error('[CLEANUP] Error marking stale events as inactive:', error);
        return 0;
    }
}

export default {
    // Scheduled task handler
    async scheduled(event, env, ctx) {
        console.log('[SCHEDULED] Running cleanup task at:', new Date().toISOString());
        const cleanedCount = await cleanupStaleEvents(env);
        console.log(`[SCHEDULED] Cleanup complete. ${cleanedCount} events marked as inactive.`);
    },

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

            // Route handling
            if (apiPath === '/api/health') {
                return new Response(JSON.stringify({
                    status: 'OK',
                    timestamp: new Date().toISOString()
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // Manual cleanup endpoint (for testing or manual triggers)
            if (apiPath === '/api/admin/cleanup-stale-events' && method === 'POST') {
                const cleanedCount = await cleanupStaleEvents(env);
                return new Response(JSON.stringify({
                    success: true,
                    message: `Marked ${cleanedCount} stale events as inactive`,
                    cleanedCount: cleanedCount
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // Reactivate event endpoint
            if (apiPath.match(/^\/api\/events\/[^/]+\/reactivate$/) && method === 'POST') {
                const eventId = apiPath.split('/')[3];
                return await reactivateEvent(eventId, env, corsHeaders);
            }

            // Deactivate event endpoint
            if (apiPath.match(/^\/api\/events\/[^/]+\/deactivate$/) && method === 'POST') {
                const eventId = apiPath.split('/')[3];
                return await deactivateEvent(eventId, env, corsHeaders);
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
                return await getWineScores(env, eventId, corsHeaders);
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

            // Admin endpoints
            if (apiPath === '/api/admin/events/list' && method === 'GET') {
                return await getAdminAllEvents(env, corsHeaders);
            }

            if (apiPath.startsWith('/api/admin/events/') && apiPath.endsWith('/wine-data') && method === 'GET') {
                const eventId = apiPath.split('/')[4];
                return await getAdminWineData(eventId, env, corsHeaders);
            }

            if (apiPath === '/api/admin/wine-answer' && method === 'PUT') {
                return await adminUpdateWineAnswer(request, env, corsHeaders);
            }

            if (apiPath.startsWith('/api/events/') && method === 'PUT' && apiPath.split('/').length === 4) {
                const eventId = apiPath.split('/')[3];
                return await updateEvent(eventId, request, env, corsHeaders);
            }

            if (apiPath.startsWith('/api/events/') && method === 'DELETE') {
                const eventId = apiPath.split('/')[3];
                return await deleteEvent(eventId, env, corsHeaders);
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

        // Rate limiting check (using deviceId or IP)
        const identifier = eventData.deviceId || request.headers.get('CF-Connecting-IP') || 'unknown';
        const cooldownKey = `cooldown-${identifier}`;

        // Check recent events created by this identifier
        const recentEvents = await env.wine_events.prepare(`
            SELECT created_at FROM events 
            WHERE (id LIKE ? OR id LIKE ?)
            ORDER BY created_at DESC 
            LIMIT 1
        `).bind(`${identifier}%`, `%${identifier}%`).first();

        if (recentEvents) {
            const timeSinceLastCreation = Date.now() - new Date(recentEvents.created_at).getTime();
            const cooldownMs = 60 * 1000; // 60 seconds

            if (timeSinceLastCreation < cooldownMs) {
                const remainingCooldown = Math.ceil((cooldownMs - timeSinceLastCreation) / 1000);
                return new Response(JSON.stringify({
                    error: `Please wait ${remainingCooldown} seconds before creating another event`,
                    cooldownRemaining: remainingCooldown
                }), {
                    status: 429,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        // Validate event name
        const nameValidation = validateEventName(eventData.name);
        if (!nameValidation.isValid) {
            return new Response(JSON.stringify({
                error: nameValidation.error || 'Invalid event name'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Sanitize event name
        const sanitizedEventName = sanitizeEventName(eventData.name, true);

        const eventId = generateUUID();
        const joinCode = Math.floor(100000 + Math.random() * 900000).toString();

        const result = await env.wine_events.prepare(`
      INSERT INTO events (
        id, name, date, max_participants, wine_type, location,
        description, budget, duration, wine_notes, join_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
            eventId,
            sanitizedEventName,
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

async function updateEvent(eventId, request, env, corsHeaders) {
    try {
        const eventData = await request.json();

        // Check if event exists first
        const event = await env.wine_events.prepare(`
            SELECT * FROM events WHERE id = ?
        `).bind(eventId).first();

        if (!event) {
            return new Response(JSON.stringify({ error: 'Event not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Validate and sanitize event name
        const nameValidation = validateEventName(eventData.name);
        if (!nameValidation.isValid) {
            return new Response(JSON.stringify({
                error: nameValidation.error || 'Invalid event name'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const sanitizedEventName = sanitizeEventName(eventData.name, true);

        // Update the event
        await env.wine_events.prepare(`
            UPDATE events 
            SET name = ?, date = ?, max_participants = ?, wine_type = ?, 
                location = ?, description = ?, budget = ?, duration = ?, 
                wine_notes = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(
            sanitizedEventName,
            eventData.date,
            eventData.maxParticipants || eventData.max_participants,
            eventData.wineType || eventData.wine_type,
            eventData.location,
            eventData.description || '',
            eventData.budget || '',
            eventData.duration || '',
            eventData.wineNotes || eventData.wine_notes || '',
            eventId
        ).run();

        return new Response(JSON.stringify({
            success: true,
            message: 'Event updated successfully'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('[UPDATE_EVENT] Error updating event:', error);
        return new Response(JSON.stringify({
            error: 'Failed to update event',
            details: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function deleteEvent(eventId, env, corsHeaders) {
    try {
        // Check if event exists first
        const event = await env.wine_events.prepare(`
            SELECT * FROM events WHERE id = ?
        `).bind(eventId).first();

        if (!event) {
            return new Response(JSON.stringify({ error: 'Event not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Delete all related data (D1 doesn't support transactions, so we do it sequentially)
        // Get all player IDs for this event first
        const playersResult = await env.wine_events.prepare(`
            SELECT id FROM players WHERE event_id = ?
        `).bind(eventId).all();
        const playerIds = playersResult.results || [];

        // Delete wine guesses for all players
        for (const player of playerIds) {
            await env.wine_events.prepare(`
                DELETE FROM player_wine_guesses WHERE player_id = ?
            `).bind(player.id).run();
        }

        // Delete wine scores
        await env.wine_events.prepare(`
            DELETE FROM wine_scores WHERE event_id = ?
        `).bind(eventId).run();

        // Delete wine answers for all players
        for (const player of playerIds) {
            await env.wine_events.prepare(`
                DELETE FROM player_wine_details WHERE player_id = ?
            `).bind(player.id).run();
        }

        // Delete players
        await env.wine_events.prepare(`
            DELETE FROM players WHERE event_id = ?
        `).bind(eventId).run();

        // Delete wine categories
        await env.wine_events.prepare(`
            DELETE FROM wine_categories WHERE event_id = ?
        `).bind(eventId).run();

        // Delete the event itself
        await env.wine_events.prepare(`
            DELETE FROM events WHERE id = ?
        `).bind(eventId).run();

        return new Response(JSON.stringify({
            success: true,
            message: 'Event and all related data deleted successfully'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('[DELETE_EVENT] Error deleting event:', error);
        return new Response(JSON.stringify({
            error: 'Failed to delete event',
            details: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function reactivateEvent(eventId, env, corsHeaders) {
    try {
        // Check if event exists first
        const event = await env.wine_events.prepare(`
            SELECT * FROM events WHERE id = ?
        `).bind(eventId).first();

        if (!event) {
            return new Response(JSON.stringify({ error: 'Event not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Reactivate the event
        await env.wine_events.prepare(`
            UPDATE events 
            SET is_active = 1, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(eventId).run();

        console.log(`[REACTIVATE] Reactivated event ${eventId}`);

        return new Response(JSON.stringify({
            success: true,
            message: 'Event reactivated successfully'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('[REACTIVATE_EVENT] Error reactivating event:', error);
        return new Response(JSON.stringify({
            error: 'Failed to reactivate event',
            details: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function deactivateEvent(eventId, env, corsHeaders) {
    try {
        // Check if event exists first
        const event = await env.wine_events.prepare(`
            SELECT * FROM events WHERE id = ?
        `).bind(eventId).first();

        if (!event) {
            return new Response(JSON.stringify({ error: 'Event not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Deactivate the event
        await env.wine_events.prepare(`
            UPDATE events 
            SET is_active = 0, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(eventId).run();

        console.log(`[DEACTIVATE] Deactivated event ${eventId}`);

        return new Response(JSON.stringify({
            success: true,
            message: 'Event deactivated successfully'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('[DEACTIVATE_EVENT] Error deactivating event:', error);
        return new Response(JSON.stringify({
            error: 'Failed to deactivate event',
            details: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
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
        event_started: Boolean(event.event_started),
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
    const { joinCode, playerName, deviceId } = await request.json();

    if (!joinCode || !playerName) {
        return new Response(JSON.stringify({
            error: 'Join code and player name are required'
        }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // Sanitize and validate inputs
    const sanitizedName = sanitizePlayerName(playerName);
    const sanitizedCode = sanitizeJoinCode(joinCode);

    // Validate player name
    const nameValidation = validatePlayerName(sanitizedName);
    if (!nameValidation.isValid) {
        return new Response(JSON.stringify({
            error: nameValidation.error || 'Invalid player name'
        }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const event = await env.wine_events.prepare(`
    SELECT * FROM events WHERE join_code = ? AND is_active = 1
  `).bind(sanitizedCode).first();

    if (!event) {
        return new Response(JSON.stringify({ error: 'Invalid join code' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // If deviceId is provided, check if this device already joined this event
    if (deviceId) {
        const existingPlayer = await env.wine_events.prepare(`
            SELECT * FROM players WHERE event_id = ? AND device_id = ? AND is_active = 1
        `).bind(event.id, deviceId).first();

        if (existingPlayer) {
            // Update the player's name if it changed
            if (existingPlayer.name !== sanitizedName) {
                await env.wine_events.prepare(`
                    UPDATE players SET name = ? WHERE id = ?
                `).bind(sanitizedName, existingPlayer.id).run();
            }

            return new Response(JSON.stringify({
                success: true,
                eventId: event.id,
                playerId: existingPlayer.id,
                presentationOrder: existingPlayer.presentation_order,
                message: `Welcome back ${sanitizedName}! You're already in this event.`
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
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

    // Insert with device_id if provided
    if (deviceId) {
        await env.wine_events.prepare(`
            INSERT INTO players (id, event_id, name, presentation_order, device_id)
            VALUES (?, ?, ?, ?, ?)
        `).bind(playerId, event.id, sanitizedName, presentationOrder, deviceId).run();
    } else {
        await env.wine_events.prepare(`
            INSERT INTO players (id, event_id, name, presentation_order)
            VALUES (?, ?, ?, ?)
        `).bind(playerId, event.id, sanitizedName, presentationOrder).run();
    }

    return new Response(JSON.stringify({
        success: true,
        eventId: event.id,
        playerId: playerId,
        presentationOrder: presentationOrder,
        message: `Welcome ${sanitizedName}! You've joined the event.`
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

        if (!playerId || !wineAnswers || !Array.isArray(wineAnswers)) {
            return new Response(JSON.stringify({
                error: 'Player ID and wine answers array are required'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Get player info for validation
        const playerResult = await env.wine_events.prepare(`
            SELECT p.name, p.presentation_order, e.id as event_id, e.name as event_name
            FROM players p
            JOIN events e ON p.event_id = e.id
            WHERE p.id = ?
        `).bind(playerId).first();

        if (!playerResult) {
            return new Response(JSON.stringify({
                error: 'Player not found'
            }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Validate wine answers
        for (const answer of wineAnswers) {
            if (!answer.categoryId || !answer.wineAnswer) {
                return new Response(JSON.stringify({
                    error: 'Each wine answer must have categoryId and wineAnswer'
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        // Get wine categories for validation
        const categoriesResult = await env.wine_events.prepare(`
            SELECT id, guessing_element FROM wine_categories WHERE event_id = ?
        `).bind(playerResult.event_id).all();

        const validCategoryIds = categoriesResult.results.map(c => c.id);

        // Validate that all submitted categories are valid for this event
        for (const answer of wineAnswers) {
            if (!validCategoryIds.includes(answer.categoryId)) {
                return new Response(JSON.stringify({
                    error: `Invalid category ID: ${answer.categoryId}`
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        // First, delete any existing answers for this player
        await env.wine_events.prepare(`
            DELETE FROM player_wine_details WHERE player_id = ?
        `).bind(playerId).run();

        // Insert new answers
        for (const answer of wineAnswers) {
            const answerId = generateUUID();
            await env.wine_events.prepare(`
                INSERT INTO player_wine_details (
                    id, player_id, category_id, wine_answer
                ) VALUES (?, ?, ?, ?)
            `).bind(answerId, playerId, answer.categoryId, answer.wineAnswer).run();
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error submitting wine answers:', error);
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

        // Validate UUID format
        if (!validateUUID(eventId) || !validateUUID(playerId)) {
            return new Response(JSON.stringify({
                error: 'Invalid ID format'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Validate score
        if (!validateScore(score)) {
            return new Response(JSON.stringify({
                error: 'Score must be a number between 1 and 5'
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

async function getPlayerWineDetails(env, playerId, corsHeaders) {
    try {
        const sql = `
            SELECT pwd.*, wc.guessing_element 
            FROM player_wine_details pwd
            JOIN wine_categories wc ON pwd.category_id = wc.id
            WHERE pwd.player_id = ?
        `;

        const result = await env.wine_events.prepare(sql).bind(playerId).all();

        return new Response(JSON.stringify(result.results), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({
            error: 'Failed to fetch player wine details',
            details: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function startEvent(eventId, env, corsHeaders) {
    try {
        await env.wine_events.prepare(`
            UPDATE events SET event_started = 1, current_wine_number = 1, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `).bind(eventId).run();

        return new Response(JSON.stringify({
            success: true,
            message: 'Event started successfully'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({
            error: 'Failed to start event',
            details: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function setCurrentWine(eventId, request, env, corsHeaders) {
    try {
        const { wineNumber } = await request.json();

        if (!wineNumber || wineNumber < 1) {
            return new Response(JSON.stringify({ error: 'Valid wine number is required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        await env.wine_events.prepare(`
            UPDATE events SET current_wine_number = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `).bind(wineNumber, eventId).run();

        return new Response(JSON.stringify({
            success: true,
            message: 'Current wine updated successfully'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({
            error: 'Failed to set current wine',
            details: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function getEventWineAnswers(eventId, env, corsHeaders) {
    try {
        // First check if the event exists
        const eventCheck = await env.wine_events.prepare(`
            SELECT id, name FROM events WHERE id = ?
        `).bind(eventId).first();

        if (!eventCheck) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Event not found',
                categories: []
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Get all wine categories for this event
        const categoriesResult = await env.wine_events.prepare(`
            SELECT id, guessing_element, difficulty_factor
            FROM wine_categories
            WHERE event_id = ?
            ORDER BY created_at
        `).bind(eventId).all();

        if (!categoriesResult.results || categoriesResult.results.length === 0) {
            return new Response(JSON.stringify({
                success: true,
                categories: []
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Get all wine answers for this event grouped by category
        const categoriesWithAnswers = await Promise.all(
            categoriesResult.results.map(async (category) => {
                const answersResult = await env.wine_events.prepare(`
                    SELECT pwd.wine_answer, p.name as player_name, p.presentation_order
                    FROM player_wine_details pwd
                    JOIN players p ON pwd.player_id = p.id
                    WHERE pwd.category_id = ? AND p.event_id = ?
                    ORDER BY p.presentation_order
                `).bind(category.id, eventId).all();

                return {
                    id: category.id,
                    guessing_element: category.guessing_element,
                    difficulty_factor: category.difficulty_factor,
                    answers: answersResult.results || []
                };
            })
        );

        return new Response(JSON.stringify({
            success: true,
            categories: categoriesWithAnswers
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error getting event wine answers:', error);
        return new Response(JSON.stringify({
            error: 'Failed to get wine answers',
            details: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function debugEventCategories(eventId, env, corsHeaders) {
    try {
        // Get all wine categories for this event
        const categoriesResult = await env.wine_events.prepare(`
            SELECT id, guessing_element, difficulty_factor, created_at
            FROM wine_categories
            WHERE event_id = ?
            ORDER BY created_at
        `).bind(eventId).all();

        // Also check if the event exists
        const eventResult = await env.wine_events.prepare(`
            SELECT id, name, join_code
            FROM events
            WHERE id = ?
        `).bind(eventId).first();

        return new Response(JSON.stringify({
            success: true,
            eventId: eventId,
            event: eventResult,
            categories: categoriesResult.results || [],
            categoriesCount: categoriesResult.results ? categoriesResult.results.length : 0
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error in debugEventCategories:', error);
        return new Response(JSON.stringify({
            error: 'Failed to debug event categories',
            details: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// Wine guesses functions
async function submitPlayerWineGuesses(playerId, request, env, corsHeaders) {
    try {
        const { wineNumber, guesses } = await request.json();

        if (!guesses || !Array.isArray(guesses)) {
            return new Response(JSON.stringify({ error: 'Guesses must be an array' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (!wineNumber) {
            return new Response(JSON.stringify({ error: 'Wine number is required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Delete existing guesses for this player and wine
        await env.wine_events.prepare('DELETE FROM player_wine_guesses WHERE player_id = ? AND wine_number = ?')
            .bind(playerId, wineNumber)
            .run();

        // Insert new guesses
        for (const guess of guesses) {
            const guessId = generateUUID();
            await env.wine_events.prepare(`
                INSERT INTO player_wine_guesses (id, player_id, category_id, guess, wine_number)
                VALUES (?, ?, ?, ?, ?)
            `).bind(guessId, playerId, guess.category_id, guess.guess, wineNumber).run();
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Wine guesses submitted successfully'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error submitting wine guesses:', error);
        return new Response(JSON.stringify({ error: 'Failed to submit wine guesses' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function getPlayerWineGuesses(playerId, env, corsHeaders, wineNumber) {
    try {
        let result;
        if (wineNumber) {
            result = await env.wine_events.prepare(
                'SELECT category_id, guess FROM player_wine_guesses WHERE player_id = ? AND wine_number = ?'
            ).bind(playerId, wineNumber).all();
        } else {
            result = await env.wine_events.prepare(
                'SELECT category_id, guess, wine_number FROM player_wine_guesses WHERE player_id = ?'
            ).bind(playerId).all();
        }

        return new Response(JSON.stringify({
            success: true,
            guesses: result.results || []
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error fetching player wine guesses:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch wine guesses' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function getEventWineGuesses(eventId, env, corsHeaders) {
    try {
        // Get all wine categories for the event
        const categoriesResult = await env.wine_events.prepare(
            'SELECT * FROM wine_categories WHERE event_id = ? ORDER BY created_at ASC'
        ).bind(eventId).all();

        const categories = categoriesResult.results || [];
        const categoriesWithGuesses = [];

        // For each category, get all guesses
        for (const category of categories) {
            const guessesResult = await env.wine_events.prepare(`
                SELECT pwg.guess, p.name as player_name, p.presentation_order, pwg.wine_number
                FROM player_wine_guesses pwg
                JOIN players p ON pwg.player_id = p.id
                WHERE pwg.category_id = ? AND p.event_id = ?
                ORDER BY p.presentation_order ASC, pwg.wine_number ASC
            `).bind(category.id, eventId).all();

            categoriesWithGuesses.push({
                id: category.id,
                guessing_element: category.guessing_element,
                difficulty_factor: category.difficulty_factor,
                guesses: guessesResult.results || []
            });
        }

        return new Response(JSON.stringify({
            success: true,
            categories: categoriesWithGuesses
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error fetching event wine guesses:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch wine guesses' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function getLeaderboard(eventId, env, corsHeaders) {
    try {
        // Get all players for the event
        const playersResult = await env.wine_events.prepare(
            'SELECT * FROM players WHERE event_id = ? ORDER BY presentation_order ASC'
        ).bind(eventId).all();
        const players = playersResult.results || [];

        // Get all wine categories for the event
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
                    const category = categories.find(c => c.id === guess.category_id);

                    if (actualDetail && actualDetail.wine_answer.toLowerCase() === guess.guess.toLowerCase()) {
                        // Correct guess! Get the difficulty factor
                        const difficultyFactor = category ? parseInt(category.difficulty_factor) || 1 : 1;
                        totalPoints += difficultyFactor;
                        correctGuesses++;
                    }
                }
            }

            leaderboard.push({
                player_id: player.id,
                player_name: player.name,
                presentation_order: player.presentation_order,
                total_points: totalPoints,
                correct_guesses: correctGuesses,
                total_guesses: totalGuesses,
                accuracy: totalGuesses > 0 ? (correctGuesses / totalGuesses * 100).toFixed(1) : '0.0'
            });
        }

        // Get wine scores for average calculation
        const wineScoresResult = await env.wine_events.prepare(
            'SELECT wine_number, score FROM wine_scores WHERE event_id = ?'
        ).bind(eventId).all();
        const wineScores = wineScoresResult.results || [];

        // Calculate wine averages
        const wineAverages = {};
        const wineScoreCounts = {};

        wineScores.forEach(score => {
            const wineNum = score.wine_number;
            if (!wineAverages[wineNum]) {
                wineAverages[wineNum] = 0;
                wineScoreCounts[wineNum] = 0;
            }
            wineAverages[wineNum] += score.score;
            wineScoreCounts[wineNum]++;
        });

        // Calculate final averages
        if (wineAverages && Object.keys(wineAverages).length > 0) {
            Object.keys(wineAverages).forEach(wineNum => {
                wineAverages[wineNum] = Math.round((wineAverages[wineNum] / wineScoreCounts[wineNum]) * 10) / 10;
            });
        }

        // Sort by total points descending
        leaderboard.sort((a, b) => b.total_points - a.total_points);

        return new Response(JSON.stringify({
            success: true,
            leaderboard: leaderboard,
            wineAverages: wineAverages || {}
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

// Admin function to get detailed wine data for debugging
async function getAdminAllEvents(env, corsHeaders) {
    try {
        // Get all events (including inactive ones for admin)
        const eventsResult = await env.wine_events.prepare(`
            SELECT * FROM events ORDER BY created_at DESC
        `).all();
        
        const events = eventsResult.results || [];
        
        // For each event, get its players count
        const eventsWithPlayers = await Promise.all(
            events.map(async (event) => {
                const playersResult = await env.wine_events.prepare(`
                    SELECT * FROM players 
                    WHERE event_id = ? AND is_active = 1 
                    ORDER BY presentation_order ASC
                `).bind(event.id).all();
                
                const players = (playersResult.results || []).map(player => ({
                    ...player,
                    is_active: Boolean(player.is_active),
                    is_ready: Boolean(player.is_ready)
                }));
                
                return {
                    ...event,
                    is_active: Boolean(event.is_active),
                    auto_shuffle: Boolean(event.auto_shuffle),
                    event_started: Boolean(event.event_started),
                    players: players
                };
            })
        );

        return new Response(JSON.stringify(eventsWithPlayers), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error getting admin events:', error);
        return new Response(JSON.stringify({ error: 'Failed to get admin events' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function getAdminWineData(eventId, env, corsHeaders) {
    try {

        // Get all players for the event
        const playersResult = await env.wine_events.prepare(
            'SELECT * FROM players WHERE event_id = ? ORDER BY presentation_order ASC'
        ).bind(eventId).all();
        const players = playersResult.results || [];

        // Get all wine categories for the event
        const categoriesResult = await env.wine_events.prepare(
            'SELECT * FROM wine_categories WHERE event_id = ? ORDER BY created_at ASC'
        ).bind(eventId).all();
        const categories = categoriesResult.results || [];

        // Get all wine answers for each player
        const wineAnswers = [];
        for (const player of players) {
            const answersResult = await env.wine_events.prepare(
                'SELECT category_id, wine_answer FROM player_wine_details WHERE player_id = ?'
            ).bind(player.id).all();

            wineAnswers.push({
                player_id: player.id,
                player_name: player.name,
                presentation_order: player.presentation_order,
                answers: answersResult.results || []
            });
        }

        // Get all wine guesses for each player
        const wineGuesses = [];
        for (const player of players) {
            const guessesResult = await env.wine_events.prepare(
                'SELECT category_id, guess, wine_number FROM player_wine_guesses WHERE player_id = ?'
            ).bind(player.id).all();

            wineGuesses.push({
                player_id: player.id,
                player_name: player.name,
                guesses: guessesResult.results || []
            });
        }

        return new Response(JSON.stringify({
            success: true,
            event_id: eventId,
            players: players,
            categories: categories,
            wine_answers: wineAnswers,
            wine_guesses: wineGuesses
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error getting admin wine data:', error);
        return new Response(JSON.stringify({
            error: 'Failed to get admin wine data',
            details: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// Admin function to update wine answers
async function adminUpdateWineAnswer(request, env, corsHeaders) {
    try {
        const { playerId, categoryId, newAnswer } = await request.json();

        if (!playerId || !categoryId || !newAnswer) {
            return new Response(JSON.stringify({
                error: 'Player ID, category ID, and new answer are required'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Update the wine answer
        const result = await env.wine_events.prepare(`
            UPDATE player_wine_details 
            SET wine_answer = ? 
            WHERE player_id = ? AND category_id = ?
        `).bind(newAnswer, playerId, categoryId).run();

        if (result.changes === 0) {
            return new Response(JSON.stringify({
                error: 'No wine answer found to update'
            }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Wine answer updated successfully'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error updating wine answer:', error);
        return new Response(JSON.stringify({
            error: 'Failed to update wine answer',
            details: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
