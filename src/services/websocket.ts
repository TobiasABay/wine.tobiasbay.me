import { io, Socket } from 'socket.io-client';

class WebSocketService {
    private socket: Socket | null = null;
    private eventId: string | null = null;

    connect(): Socket {
        if (!this.socket) {
            const wsUrl = process.env.NODE_ENV === 'production'
                ? 'https://backend.wine.tobiasbay.me'
                : 'http://localhost:3001';
            console.log('🔌 Connecting to WebSocket URL:', wsUrl, 'NODE_ENV:', process.env.NODE_ENV);
            this.socket = io(wsUrl, {
                transports: ['websocket', 'polling'],
            });

            this.socket.on('connect', () => {
                console.log('✅ Connected to WebSocket server with ID:', this.socket?.id);
                console.log('✅ WebSocket connection state:', this.socket?.connected);
            });

            this.socket.on('disconnect', (reason) => {
                console.log('❌ Disconnected from WebSocket server. Reason:', reason);
            });

            this.socket.on('connect_error', (error) => {
                console.error('❌ WebSocket connection error:', error);
            });

            // Add listener for all events to debug
            this.socket.onAny((event, ...args) => {
                console.log('🔔 Received WebSocket event:', event, args);
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
            console.log('Emitting join-event for:', eventId);
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
            console.log('🎧 Setting up player-joined listener');
            this.socket.on('player-joined', callback);
        } else {
            console.error('❌ Socket not connected when setting up player-joined listener');
        }
    }

    onPlayerLeft(callback: (data: any) => void): void {
        if (this.socket) {
            console.log('🎧 Setting up player-left listener');
            this.socket.on('player-left', callback);
        } else {
            console.error('❌ Socket not connected when setting up player-left listener');
        }
    }

    onPlayersShuffled(callback: (players: any[]) => void): void {
        if (this.socket) {
            console.log('🎧 Setting up players-shuffled listener');
            this.socket.on('players-shuffled', callback);
        } else {
            console.error('❌ Socket not connected when setting up players-shuffled listener');
        }
    }

    onPlayerOrderUpdated(callback: (players: any[]) => void): void {
        if (this.socket) {
            console.log('🎧 Setting up player-order-updated listener');
            this.socket.on('player-order-updated', callback);
        } else {
            console.error('❌ Socket not connected when setting up player-order-updated listener');
        }
    }

    onPlayersReordered(callback: (players: any[]) => void): void {
        if (this.socket) {
            console.log('🎧 Setting up players-reordered listener');
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
