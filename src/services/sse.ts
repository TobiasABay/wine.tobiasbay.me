const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isLocalhost ? 'http://localhost:3001' : 'https://wine.tobiasbay.me/backend';

export interface SSEEventUpdate {
    type: 'connected' | 'event_update' | 'error';
    timestamp: number;
    data?: {
        current_wine_number: number;
        event_started: boolean;
        average_score: number;
        score_count: number;
        scores: Array<{
            id: string;
            player_id: string;
            wine_number: number;
            score: number;
            player_name: string;
            presentation_order: number;
        }>;
        guesses: Array<{
            id: string;
            player_id: string;
            category_id: string;
            guess: string;
            wine_number: number;
            player_name: string;
            presentation_order: number;
            guessing_element: string;
        }>;
    };
    message?: string;
}

export interface SSEEventHandlers {
    onConnected?: (data: SSEEventUpdate) => void;
    onUpdate?: (data: SSEEventUpdate) => void;
    onError?: (data: SSEEventUpdate) => void;
    onClose?: () => void;
}

class SSEService {
    private eventSource: EventSource | null = null;
    private eventId: string | null = null;
    private handlers: SSEEventHandlers = {};
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000; // Start with 1 second

    connect(eventId: string, handlers: SSEEventHandlers = {}): void {
        if (this.eventSource) {
            this.disconnect();
        }

        this.eventId = eventId;
        this.handlers = handlers;
        this.reconnectAttempts = 0;

        const url = `${API_BASE_URL}/api/events/${eventId}/sse`;
        console.log('Connecting to SSE:', url);

        this.eventSource = new EventSource(url);

        this.eventSource.onopen = () => {
            console.log('SSE connection opened');
            this.reconnectAttempts = 0; // Reset on successful connection
        };

        this.eventSource.onmessage = (event) => {
            try {
                const data: SSEEventUpdate = JSON.parse(event.data);
                console.log('SSE message received:', data);

                switch (data.type) {
                    case 'connected':
                        handlers.onConnected?.(data);
                        break;
                    case 'event_update':
                        handlers.onUpdate?.(data);
                        break;
                    case 'error':
                        handlers.onError?.(data);
                        break;
                }
            } catch (error) {
                console.error('Error parsing SSE message:', error);
                handlers.onError?.({
                    type: 'error',
                    timestamp: Date.now(),
                    message: 'Failed to parse SSE message'
                });
            }
        };

        this.eventSource.onerror = (error) => {
            console.error('SSE connection error:', error);

            if (this.eventSource?.readyState === EventSource.CLOSED) {
                handlers.onClose?.();
                this.handleReconnect();
            } else {
                handlers.onError?.({
                    type: 'error',
                    timestamp: Date.now(),
                    message: 'SSE connection error'
                });
            }
        };
    }

    private handleReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

        console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

        setTimeout(() => {
            if (this.eventId) {
                this.connect(this.eventId, this.handlers);
            }
        }, delay);
    }

    disconnect(): void {
        if (this.eventSource) {
            console.log('Disconnecting from SSE');
            this.eventSource.close();
            this.eventSource = null;
        }
        this.eventId = null;
        this.handlers = {};
        this.reconnectAttempts = 0;
    }

    isConnected(): boolean {
        return this.eventSource?.readyState === EventSource.OPEN;
    }

    getConnectionState(): number | null {
        return this.eventSource?.readyState ?? null;
    }
}

export const sseService = new SSEService();
