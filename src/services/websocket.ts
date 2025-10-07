import { io, Socket } from 'socket.io-client';

class WebSocketService {
    private socket: Socket | null = null;
    private eventId: string | null = null;

    connect(): Socket {
        if (!this.socket) {
            const wsUrl = process.env.NODE_ENV === 'production'
                ? 'https://api.wine.tobiasbay.me'
                : 'http://localhost:3001';
            // Connecting to WebSocket
            this.socket = io(wsUrl, {
                transports: ['websocket', 'polling'],
            });

            this.socket.on('connect', () => {
                // Connected to WebSocket server
            });

            this.socket.on('disconnect', () => {
                // Disconnected from WebSocket server
            });

            this.socket.on('connect_error', (error) => {
                console.error('❌ WebSocket connection error:', error);
            });

            // Add listener for all events
            this.socket.onAny(() => {
                // Received WebSocket event
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
        } else {
            console.error('Cannot join event - socket not connected');
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
        } else {
            console.error('❌ Socket not connected when setting up player-joined listener');
        }
    }

    onPlayerLeft(callback: (data: any) => void): void {
        if (this.socket) {
            this.socket.on('player-left', callback);
        } else {
            console.error('❌ Socket not connected when setting up player-left listener');
        }
    }

    onPlayersShuffled(callback: (players: any[]) => void): void {
        if (this.socket) {
            this.socket.on('players-shuffled', callback);
        } else {
            console.error('❌ Socket not connected when setting up players-shuffled listener');
        }
    }

    onPlayerOrderUpdated(callback: (players: any[]) => void): void {
        if (this.socket) {
            this.socket.on('player-order-updated', callback);
        } else {
            console.error('❌ Socket not connected when setting up player-order-updated listener');
        }
    }

    onPlayersReordered(callback: (players: any[]) => void): void {
        if (this.socket) {
            this.socket.on('players-reordered', callback);
        } else {
            console.error('❌ Socket not connected when setting up players-reordered listener');
        }
    }

    onEventCreated(callback: (data: any) => void): void {
        if (this.socket) {
            this.socket.on('event-created', callback);
        }
    }

    onCurrentWineChanged(callback: (data: { eventId: string; wineNumber: number; timestamp: string }) => void): void {
        if (this.socket) {
            this.socket.on('current-wine-changed', callback);
        } else {
            console.error('❌ Socket not connected when setting up current-wine-changed listener');
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

    offCurrentWineChanged(callback?: (data: { eventId: string; wineNumber: number; timestamp: string }) => void): void {
        if (this.socket) {
            this.socket.off('current-wine-changed', callback);
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
