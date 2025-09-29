const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://wine.tobiasbay.me/backend'
    : 'http://localhost:3001';

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
}

export interface Player {
    id: string;
    event_id: string;
    name: string;
    presentation_order: number;
    joined_at: string;
    is_active: boolean;
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
    created_at: string;
    updated_at: string;
    players: Player[];
}

export interface JoinEventData {
    joinCode: string;
    playerName: string;
}

class ApiService {
    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;
        const config: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Event API methods
    async createEvent(eventData: EventData): Promise<{ eventId: string; joinCode: string }> {
        return this.request<{ eventId: string; joinCode: string }>('/api/events', {
            method: 'POST',
            body: JSON.stringify(eventData),
        });
    }

    async getEvent(eventId: string): Promise<Event> {
        return this.request<Event>(`/api/events/${eventId}`);
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

    // Health check
    async healthCheck(): Promise<{ status: string; timestamp: string }> {
        return this.request<{ status: string; timestamp: string }>('/api/health');
    }
}

export const apiService = new ApiService();
