import {
    isDemoMode,
    DEMO_EVENT,
    DEMO_CATEGORIES,
    DEMO_PLAYERS,
    DEMO_EVENT_ID,
    getDemoScores,
    saveDemoScore,
    getDemoGuesses,
    saveDemoGuess
} from '../utils/demoData';

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isLocalhost ? 'http://localhost:3001' : 'https://api.wine.tobiasbay.me';

export interface WineCategory {
    id: string;
    guessing_element: string;
    difficulty_factor: string;
}

export interface EventData {
    name: string;
    date: string;
    maxParticipants: number;
    wineType: string;
    location: string;
    description?: string;
    budget?: string;
    duration?: string;
    wineNotes?: string;
    autoShuffle?: boolean;
    wineCategories?: WineCategory[];
}

export interface PlayerWineDetail {
    id: string;
    player_id: string;
    category_id: string;
    wine_answer: string;
    created_at: string;
    guessing_element?: string;
}

export interface Player {
    id: string;
    event_id: string;
    name: string;
    presentation_order: number;
    joined_at: string;
    is_active: boolean;
    is_ready: boolean;
    wine_details?: PlayerWineDetail[];
}

export interface Event {
    id: string;
    name: string;
    date: string;
    max_participants: number;
    wine_type: string;
    location: string;
    description: string;
    budget: string;
    duration: string;
    wine_notes: string;
    join_code: string;
    is_active: boolean;
    auto_shuffle: boolean;
    event_started: boolean;
    current_wine_number?: number;
    created_at: string;
    updated_at: string;
    players: Player[];
    wine_categories?: WineCategory[];
}

export interface JoinEventData {
    joinCode: string;
    playerName: string;
    deviceId?: string;
}

export interface WineAnswerData {
    categoryId: string;
    wineAnswer: string;
}

export interface SubmitWineAnswersData {
    playerId: string;
    wineAnswers: WineAnswerData[];
}

class ApiService {
    private cache = new Map<string, { data: any; etag: string; timestamp: number }>();
    private readonly CACHE_DURATION = 5000; // 5 seconds cache

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;
        const cacheKey = `${options.method || 'GET'}:${endpoint}`;
        const cached = this.cache.get(cacheKey);
        const now = Date.now();

        // Check if we have a valid cached response
        if (cached && (now - cached.timestamp) < this.CACHE_DURATION && options.method === 'GET') {
            return cached.data;
        }

        const config: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        // Add conditional headers for GET requests
        if (options.method === 'GET' && cached?.etag) {
            config.headers = {
                ...config.headers,
                'If-None-Match': cached.etag,
            };
        }

        try {
            const response = await fetch(url, config);

            // Handle 304 Not Modified
            if (response.status === 304 && cached) {
                // Update timestamp for cache
                this.cache.set(cacheKey, { ...cached, timestamp: now });
                return cached.data;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
                const error = new Error(errorMessage);
                (error as any).status = response.status;
                throw error;
            }

            const data = await response.json();
            const etag = response.headers.get('ETag');

            // Cache GET responses
            if (options.method === 'GET' && etag) {
                this.cache.set(cacheKey, {
                    data,
                    etag,
                    timestamp: now
                });
            }

            return data;
        } catch (error: any) {
            // Only log errors that aren't 404s (expected for deleted events)
            if (error?.status !== 404) {
                console.error('API request failed:', error);
            }
            throw error;
        }
    }

    // Event API methods
    async createEvent(eventData: EventData): Promise<{
        eventId: string; joinCode: string
    }> {
        return this.request<{ eventId: string; joinCode: string }>('/api/events', {
            method: 'POST',
            body: JSON.stringify(eventData),
        });
    }

    async getEvent(eventId: string): Promise<Event> {
        if (isDemoMode() && eventId === DEMO_EVENT_ID) {
            return Promise.resolve(DEMO_EVENT);
        }
        return this.request<Event>(`/api/events/${eventId}`);
    }

    async updateEvent(eventId: string, eventData: Partial<EventData>): Promise<{ success: boolean; message: string }> {
        return this.request<{ success: boolean; message: string }>(`/api/events/${eventId}`, {
            method: 'PUT',
            body: JSON.stringify(eventData),
        });
    }

    async deleteEvent(eventId: string): Promise<{ success: boolean; message: string }> {
        return this.request<{ success: boolean; message: string }>(`/api/events/${eventId}`, {
            method: 'DELETE',
        });
    }

    async reactivateEvent(eventId: string): Promise<{ success: boolean; message: string }> {
        return this.request<{ success: boolean; message: string }>(`/api/events/${eventId}/reactivate`, {
            method: 'POST',
        });
    }

    async deactivateEvent(eventId: string): Promise<{ success: boolean; message: string }> {
        return this.request<{ success: boolean; message: string }>(`/api/events/${eventId}/deactivate`, {
            method: 'POST',
        });
    }

    async getEventByJoinCode(joinCode: string): Promise<Event> {
        return this.request<Event>(`/api/events/join/${joinCode}`);
    }

    async updateEventAutoShuffle(eventId: string, autoShuffle: boolean): Promise<void> {
        return this.request<void>(`/api/events/${eventId}/shuffle`, {
            method: 'PUT',
            body: JSON.stringify({ autoShuffle }),
        });
    }

    async shufflePlayers(eventId: string): Promise<{ players: Player[] }> {
        return this.request<{ players: Player[] }>(`/api/events/${eventId}/shuffle-players`, {
            method: 'POST',
        });
    }

    // Player API methods
    async joinEvent(joinData: JoinEventData): Promise<{
        success: boolean;
        eventId: string;
        playerId: string;
        presentationOrder: number;
        message: string;
    }> {
        return this.request<{
            success: boolean;
            eventId: string;
            playerId: string;
            presentationOrder: number;
            message: string;
        }>('/api/players/join', {
            method: 'POST',
            body: JSON.stringify(joinData),
        });
    }

    async getEventPlayers(eventId: string): Promise<Player[]> {
        return this.request<Player[]>(`/api/players/event/${eventId}`);
    }

    async removePlayer(playerId: string): Promise<void> {
        return this.request<void>(`/api/players/${playerId}`, {
            method: 'DELETE',
        });
    }

    async updatePlayerOrder(eventId: string, players: Player[]): Promise<void> {
        return this.request<void>(`/api/events/${eventId}/players/order`, {
            method: 'PUT',
            body: JSON.stringify({ players }),
        });
    }

    // Wine categories and answers
    async submitWineAnswers(data: SubmitWineAnswersData): Promise<void> {
        return this.request<void>('/api/players/wine-answers', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getWineCategories(eventId: string): Promise<WineCategory[]> {
        if (isDemoMode() && eventId === DEMO_EVENT_ID) {
            return Promise.resolve(DEMO_CATEGORIES);
        }
        return this.request<WineCategory[]>(`/api/events/${eventId}/wine-categories`);
    }

    async getEventWineAnswers(eventId: string): Promise<{
        success: boolean;
        players?: Array<{
            player_id: string;
            player_name: string;
            presentation_order: number;
            answers: Array<{
                category_id: string;
                wine_answer: string;
                guessing_element: string;
            }>;
        }>;
        categories?: Array<{
            id: string;
            guessing_element: string;
            difficulty_factor: string;
            answers: Array<{
                wine_answer: string;
                player_name: string;
                presentation_order: number;
            }>;
        }>;
    }> {
        if (isDemoMode() && eventId === DEMO_EVENT_ID) {
            // Return demo wine answers
            const players = DEMO_PLAYERS.map(player => ({
                player_id: player.id,
                player_name: player.name,
                presentation_order: player.presentation_order,
                answers: (player.wine_details || []).map(detail => ({
                    category_id: detail.category_id,
                    wine_answer: detail.wine_answer,
                    guessing_element: detail.guessing_element || ''
                }))
            }));

            return Promise.resolve({
                success: true,
                players
            });
        }

        try {
            const response = await this.request<any>(`/api/events/${eventId}/wine-answers`);

            // Ensure the response has the expected structure
            if (!response) {
                return { success: false };
            }

            // Handle both old format (categories) and new format (players)
            if (response.players && Array.isArray(response.players)) {
                return response;
            } else if (response.categories && Array.isArray(response.categories)) {
                return response;
            }

            return { success: response.success || false };
        } catch (error) {
            console.error('Error in getEventWineAnswers:', error);
            return { success: false };
        }
    }

    async getPlayerWineDetails(playerId: string): Promise<PlayerWineDetail[]> {
        if (isDemoMode() && playerId.startsWith('demo-player-')) {
            const player = DEMO_PLAYERS.find(p => p.id === playerId);
            return Promise.resolve(player?.wine_details || []);
        }
        return this.request<PlayerWineDetail[]>(`/api/players/${playerId}/wine-details`);
    }

    async updatePlayerReadyStatus(playerId: string, isReady: boolean): Promise<{ success: boolean; message: string }> {
        return this.request<{ success: boolean; message: string }>(`/api/players/${playerId}/ready`, {
            method: 'PUT',
            body: JSON.stringify({ isReady })
        });
    }

    async getWineScores(eventId: string): Promise<{ success: boolean; averages: Record<string, { average: number; totalScores: number; scores: any[] }>; allScores: any[] }> {
        if (isDemoMode() && eventId === DEMO_EVENT_ID) {
            return Promise.resolve(getDemoScores(eventId));
        }
        return this.request<{ success: boolean; averages: Record<string, { average: number; totalScores: number; scores: any[] }>; allScores: any[] }>(`/api/events/${eventId}/scores`);
    }

    async submitWineScore(eventId: string, playerId: string, wineNumber: number, score: number): Promise<{ success: boolean; message: string }> {
        if (isDemoMode() && eventId === DEMO_EVENT_ID) {
            saveDemoScore(eventId, playerId, wineNumber, score);
            return Promise.resolve({ success: true, message: 'Demo score saved' });
        }
        return this.request<{ success: boolean; message: string }>(`/api/events/${eventId}/scores`, {
            method: 'POST',
            body: JSON.stringify({ playerId, wineNumber, score })
        });
    }

    async submitPlayerWineGuesses(playerId: string, wineNumber: number, guesses: Array<{ category_id: string; guess: string }>): Promise<{ success: boolean; message: string }> {
        if (isDemoMode() && playerId.startsWith('demo-player-')) {
            guesses.forEach(g => saveDemoGuess(playerId, wineNumber, g.category_id, g.guess));
            return Promise.resolve({ success: true, message: 'Demo guesses saved' });
        }
        return this.request<{ success: boolean; message: string }>(`/api/players/${playerId}/wine-guesses`, {
            method: 'POST',
            body: JSON.stringify({ wineNumber, guesses })
        });
    }

    async getPlayerWineGuesses(playerId: string, wineNumber?: number): Promise<{ success: boolean; guesses: Array<{ category_id: string; guess: string }> }> {
        const url = wineNumber
            ? `/api/players/${playerId}/wine-guesses?wineNumber=${wineNumber}`
            : `/api/players/${playerId}/wine-guesses`;
        return this.request<{ success: boolean; guesses: Array<{ category_id: string; guess: string }> }>(url);
    }

    async getEventWineGuesses(eventId: string): Promise<{ success: boolean; categories: Array<{ id: string; guessing_element: string; difficulty_factor: string; guesses: Array<{ player_name: string; guess: string; presentation_order: number; wine_number: number }> }> }> {
        if (isDemoMode() && eventId === DEMO_EVENT_ID) {
            return Promise.resolve(getDemoGuesses(eventId));
        }
        return this.request<{ success: boolean; categories: Array<{ id: string; guessing_element: string; difficulty_factor: string; guesses: Array<{ player_name: string; guess: string; presentation_order: number; wine_number: number }> }> }>(`/api/events/${eventId}/wine-guesses`);
    }

    async startEvent(eventId: string): Promise<{ success: boolean; message: string }> {
        return this.request<{ success: boolean; message: string }>(`/api/events/${eventId}/start`, {
            method: 'POST'
        });
    }

    async setCurrentWine(eventId: string, wineNumber: number): Promise<{ success: boolean; message: string }> {
        return this.request<{ success: boolean; message: string }>(`/api/events/${eventId}/current-wine`, {
            method: 'PUT',
            body: JSON.stringify({ wineNumber })
        });
    }

    async getLeaderboard(eventId: string): Promise<{
        success: boolean;
        leaderboard: Array<{
            player_id: string;
            player_name: string;
            presentation_order: number;
            total_points: number;
            correct_guesses: number;
            total_guesses: number;
            accuracy: string;
        }>;
        wineAverages: Record<string, number>;
    }> {
        if (isDemoMode() && eventId === DEMO_EVENT_ID) {
            // Calculate demo leaderboard from localStorage data
            const scoresData = getDemoScores(eventId);
            const guessesData = getDemoGuesses(eventId);

            // Build leaderboard for each player
            const leaderboard = DEMO_PLAYERS.map(player => {
                let totalPoints = 0;
                let correctGuesses = 0;
                let totalGuesses = 0;

                // Get all guesses from this player
                guessesData.categories.forEach(category => {
                    const playerGuesses = category.guesses.filter((g: any) => g.player_id === player.id);

                    playerGuesses.forEach((guess: any) => {
                        totalGuesses++;

                        // Find the correct answer for this wine/category
                        const targetWineNumber = guess.wine_number;
                        const targetPlayer = DEMO_PLAYERS.find(p => p.presentation_order === targetWineNumber);

                        if (targetPlayer && targetPlayer.wine_details) {
                            const correctAnswer = targetPlayer.wine_details.find(d => d.category_id === category.id);

                            if (correctAnswer && correctAnswer.wine_answer.toLowerCase() === guess.guess.toLowerCase()) {
                                correctGuesses++;
                                totalPoints += parseInt(category.difficulty_factor);
                            }
                        }
                    });
                });

                return {
                    player_id: player.id,
                    player_name: player.name,
                    presentation_order: player.presentation_order,
                    total_points: totalPoints,
                    correct_guesses: correctGuesses,
                    total_guesses: totalGuesses,
                    accuracy: totalGuesses > 0 ? ((correctGuesses / totalGuesses) * 100).toFixed(1) : '0.0'
                };
            }).sort((a, b) => b.total_points - a.total_points);

            return Promise.resolve({
                success: true,
                leaderboard,
                wineAverages: scoresData.averages
            });
        }

        return this.request<{
            success: boolean;
            leaderboard: Array<{
                player_id: string;
                player_name: string;
                presentation_order: number;
                total_points: number;
                correct_guesses: number;
                total_guesses: number;
                accuracy: string;
            }>;
            wineAverages: Record<string, number>;
        }>(`/api/events/${eventId}/leaderboard`);
    }

    // Batch API - combines multiple data sources
    async getBatchData(eventId: string): Promise<{
        success: boolean;
        timestamp: number;
        event: {
            current_wine_number: number;
            event_started: boolean;
            updated_at: string;
        };
        scores: {
            average: number;
            count: number;
            scores: Array<{
                id: string;
                player_id: string;
                wine_number: number;
                score: number;
                player_name: string;
                presentation_order: number;
            }>;
        };
        guesses: {
            current_wine: Array<{
                id: string;
                player_id: string;
                category_id: string;
                guess: string;
                wine_number: number;
                player_name: string;
                presentation_order: number;
                guessing_element: string;
            }>;
            categories: Array<{
                id: string;
                guessing_element: string;
                difficulty_factor: string;
                guesses: Array<{
                    player_name: string;
                    guess: string;
                    presentation_order: number;
                    wine_number: number;
                }>;
            }>;
        };
    }> {
        return this.request<{
            success: boolean;
            timestamp: number;
            event: {
                current_wine_number: number;
                event_started: boolean;
                updated_at: string;
            };
            scores: {
                average: number;
                count: number;
                scores: Array<{
                    id: string;
                    player_id: string;
                    wine_number: number;
                    score: number;
                    player_name: string;
                    presentation_order: number;
                }>;
            };
            guesses: {
                current_wine: Array<{
                    id: string;
                    player_id: string;
                    category_id: string;
                    guess: string;
                    wine_number: number;
                    player_name: string;
                    presentation_order: number;
                    guessing_element: string;
                }>;
                categories: Array<{
                    id: string;
                    guessing_element: string;
                    difficulty_factor: string;
                    guesses: Array<{
                        player_name: string;
                        guess: string;
                        presentation_order: number;
                        wine_number: number;
                    }>;
                }>;
            };
        }>(`/api/events/${eventId}/batch`);
    }

    // Health check
    async healthCheck(): Promise<{ status: string; timestamp: string }> {
        return this.request<{ status: string; timestamp: string }>('/api/health');
    }

    // Admin methods
    async getAllEvents(): Promise<Event[]> {
        try {
            return await this.request<Event[]>('/api/events/list');
        } catch (error) {
            console.error('Error in getAllEvents:', error);
            throw error;
        }
    }

    async getAdminAllEvents(): Promise<Event[]> {
        try {
            return await this.request<Event[]>('/api/admin/events/list');
        } catch (error) {
            console.error('Error in getAdminAllEvents:', error);
            throw error;
        }
    }

    async getAdminWineData(eventId: string): Promise<{
        success: boolean;
        event_id: string;
        players: Array<{
            id: string;
            name: string;
            presentation_order: number;
        }>;
        categories: Array<{
            id: string;
            guessing_element: string;
            difficulty_factor: string;
        }>;
        wine_answers: Array<{
            player_id: string;
            player_name: string;
            presentation_order: number;
            answers: Array<{
                category_id: string;
                wine_answer: string;
            }>;
        }>;
        wine_guesses: Array<{
            player_id: string;
            player_name: string;
            guesses: Array<{
                category_id: string;
                guess: string;
                wine_number: number;
            }>;
        }>;
    }> {
        try {
            return await this.request(`/api/admin/events/${eventId}/wine-data`);
        } catch (error) {
            console.error('Error in getAdminWineData:', error);
            throw error;
        }
    }

    async updateWineAnswer(playerId: string, categoryId: string, newAnswer: string): Promise<{
        success: boolean;
        message?: string;
        error?: string;
    }> {
        try {
            return await this.request('/api/admin/wine-answer', {
                method: 'PUT',
                body: JSON.stringify({
                    playerId,
                    categoryId,
                    newAnswer
                })
            });
        } catch (error) {
            console.error('Error in updateWineAnswer:', error);
            throw error;
        }
    }

    async submitFeedback(eventId: string, playerId: string, playerName: string, feedback: string): Promise<{
        success: boolean;
        message?: string;
    }> {
        try {
            return await this.request('/api/feedback', {
                method: 'POST',
                body: JSON.stringify({
                    eventId,
                    playerId,
                    playerName,
                    feedback
                })
            });
        } catch (error) {
            console.error('Error in submitFeedback:', error);
            throw error;
        }
    }

    async getAllFeedback(): Promise<{
        success: boolean;
        feedback: Array<{
            id: string;
            event_id: string;
            event_name: string;
            player_id: string;
            player_name: string;
            feedback: string;
            created_at: string;
        }>;
    }> {
        try {
            return await this.request('/api/admin/feedback');
        } catch (error) {
            console.error('Error in getAllFeedback:', error);
            throw error;
        }
    }

    async getInsightsData(): Promise<{
        success: boolean;
        insights: {
            topPerformers: any[];
            wineRatings: any[];
            categoryAccuracy: any[];
            activeEvents: any[];
            commonMistakes: any[];
            grapeVarieties: any[];
            countries: any[];
            wineTypes: any[];
        };
    }> {
        try {
            return await this.request('/api/admin/insights');
        } catch (error) {
            console.error('Error in getInsightsData:', error);
            throw error;
        }
    }
}

export const apiService = new ApiService();
