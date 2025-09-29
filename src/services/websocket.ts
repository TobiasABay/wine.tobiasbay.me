import { io, Socket } from 'socket.io-client';

class WebSocketService {
    private socket: Socket | null = null;
    private eventId: string | null = null;

    connect(): Socket {
        if (!this.socket) {
            const wsUrl = process.env.NODE_ENV === 'production'
                ? 'https://backend.wine.tobiasbay.me'
                : 'http://localhost:3001';
            this.socket = io(wsUrl, {
                transports: ['websocket', 'polling'],
            });

            this.socket.on('connect', () => {
                console.log('Connected to WebSocket server');
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from WebSocket server');
            });

            this.socket.on('connect_error', (error) => {
                console.error('WebSocket connection error:', error);
            });
        }

        return this.socket;
    }

    disconnect(): void {
        if (this.socket) {
            if (this.eventId) {
                this.leaveEvent(this.eventId);
            }
            this.socket.disconnect();
            this.socket = null;
            this.eventId = null;
        }
    }

    joinEvent(eventId: string): void {
        if (this.socket) {
            this.socket.emit('join-event', eventId);
            this.eventId = eventId;
        }
    }

    leaveEvent(eventId: string): void {
        if (this.socket) {
            this.socket.emit('leave-event', eventId);
            if (this.eventId === eventId) {
                this.eventId = null;
            }
        }
    }

    // Event listeners
    onPlayerJoined(callback: (data: any) => void): void {
        if (this.socket) {
            this.socket.on('player-joined', callback);
        }
    }

    onPlayerLeft(callback: (data: any) => void): void {
        if (this.socket) {
            this.socket.on('player-left', callback);
        }
    }

    onPlayersShuffled(callback: (players: any[]) => void): void {
        if (this.socket) {
            this.socket.on('players-shuffled', callback);
        }
    }

    onPlayerOrderUpdated(callback: (players: any[]) => void): void {
        if (this.socket) {
            this.socket.on('player-order-updated', callback);
        }
    }

    onPlayersReordered(callback: (players: any[]) => void): void {
        if (this.socket) {
            this.socket.on('players-reordered', callback);
        }
    }

    onEventCreated(callback: (data: any) => void): void {
        if (this.socket) {
            this.socket.on('event-created', callback);
        }
    }

    // Remove event listeners
    offPlayerJoined(callback?: (data: any) => void): void {
        if (this.socket) {
            this.socket.off('player-joined', callback);
        }
    }

    offPlayerLeft(callback?: (data: any) => void): void {
        if (this.socket) {
            this.socket.off('player-left', callback);
        }
    }

    offPlayersShuffled(callback?: (players: any[]) => void): void {
        if (this.socket) {
            this.socket.off('players-shuffled', callback);
        }
    }

    offPlayerOrderUpdated(callback?: (players: any[]) => void): void {
        if (this.socket) {
            this.socket.off('player-order-updated', callback);
        }
    }

    offPlayersReordered(callback?: (players: any[]) => void): void {
        if (this.socket) {
            this.socket.off('players-reordered', callback);
        }
    }

    offEventCreated(callback?: (data: any) => void): void {
        if (this.socket) {
            this.socket.off('event-created', callback);
        }
    }

    // Remove all listeners
    removeAllListeners(): void {
        if (this.socket) {
            this.socket.removeAllListeners();
        }
    }

    isConnected(): boolean {
        return this.socket?.connected || false;
    }

    getSocket(): Socket | null {
        return this.socket;
    }
}

export const webSocketService = new WebSocketService();
