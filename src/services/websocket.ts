import { io, Socket } from 'socket.io-client';

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const WEBSOCKET_URL = isLocalhost ? 'http://localhost:3001' : 'https://api.wine.tobiasbay.me';

// Disable WebSocket in production until backend is deployed
const WEBSOCKET_ENABLED = isLocalhost; // Set to true when production backend is ready

class WebSocketService {
    private socket: Socket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private eventListeners: Map<string, Set<Function>> = new Map();

    constructor() {
        if (WEBSOCKET_ENABLED) {
            this.connect();
        } else {
            console.log('ℹ️  WebSocket disabled in production (backend not yet deployed)');
            this.emit('connection-status', {
                connected: false,
                reason: 'WebSocket disabled in production - backend not yet deployed'
            });
        }
    }

    private connect() {
        if (!WEBSOCKET_ENABLED) {
            console.log('⚠️  WebSocket is disabled');
            return;
        }

        if (this.socket?.connected) {
            console.log('WebSocket already connected');
            return;
        }

        console.log('Connecting to WebSocket server:', WEBSOCKET_URL);

        this.socket = io(WEBSOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: this.reconnectDelay,
            reconnectionAttempts: this.maxReconnectAttempts,
            timeout: 10000,
        });

        this.setupEventHandlers();
    }

    private setupEventHandlers() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('✅ WebSocket connected:', this.socket?.id);
            this.reconnectAttempts = 0;
            this.emit('connection-status', { connected: true, id: this.socket?.id });
        });

        this.socket.on('disconnect', (reason) => {
            console.log('❌ WebSocket disconnected:', reason);
            this.emit('connection-status', { connected: false, reason });
        });

        this.socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error.message);
            this.reconnectAttempts++;

            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error('Max reconnection attempts reached');
                this.emit('connection-error', {
                    error: 'Max reconnection attempts reached',
                    attempts: this.reconnectAttempts
                });
            }
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log('✅ WebSocket reconnected after', attemptNumber, 'attempts');
            this.emit('reconnected', { attempts: attemptNumber });
        });

        this.socket.on('reconnect_attempt', (attemptNumber) => {
            console.log('🔄 WebSocket reconnection attempt:', attemptNumber);
        });

        this.socket.on('reconnect_error', (error) => {
            console.error('WebSocket reconnection error:', error.message);
        });

        this.socket.on('reconnect_failed', () => {
            console.error('❌ WebSocket reconnection failed');
            this.emit('reconnect-failed', {});
        });

        // Listen for server events
        this.socket.on('event-update', (data) => {
            console.log('📡 Event update received:', data);
            this.emit('event-update', data);
        });

        this.socket.on('player-joined', (data) => {
            console.log('👤 Player joined:', data);
            this.emit('player-joined', data);
        });

        this.socket.on('player-left', (data) => {
            console.log('👋 Player left:', data);
            this.emit('player-left', data);
        });

        this.socket.on('player-ready', (data) => {
            console.log('✓ Player ready:', data);
            this.emit('player-ready', data);
        });

        this.socket.on('score-submitted', (data) => {
            console.log('⭐ Score submitted:', data);
            this.emit('score-submitted', data);
        });

        this.socket.on('guess-submitted', (data) => {
            console.log('🎯 Guess submitted:', data);
            this.emit('guess-submitted', data);
        });

        this.socket.on('wine-changed', (data) => {
            console.log('🍷 Wine changed:', data);
            this.emit('wine-changed', data);
        });

        this.socket.on('event-started', (data) => {
            console.log('🚀 Event started:', data);
            this.emit('event-started', data);
        });
    }

    public joinEvent(eventId: string) {
        if (!WEBSOCKET_ENABLED) {
            return; // Silently skip if disabled
        }

        if (!this.socket?.connected) {
            console.warn('Cannot join event: WebSocket not connected');
            return;
        }

        console.log('Joining event:', eventId);
        this.socket.emit('join-event', eventId);
    }

    public leaveEvent(eventId: string) {
        if (!WEBSOCKET_ENABLED) {
            return; // Silently skip if disabled
        }

        if (!this.socket?.connected) {
            console.warn('Cannot leave event: WebSocket not connected');
            return;
        }

        console.log('Leaving event:', eventId);
        this.socket.emit('leave-event', eventId);
    }

    public on(event: string, callback: Function) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }
        this.eventListeners.get(event)?.add(callback);
    }

    public off(event: string, callback: Function) {
        this.eventListeners.get(event)?.delete(callback);
    }

    private emit(event: string, data: any) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach(callback => callback(data));
        }
    }

    public disconnect() {
        if (!WEBSOCKET_ENABLED) {
            return;
        }

        if (this.socket) {
            console.log('Disconnecting WebSocket');
            this.socket.disconnect();
            this.socket = null;
        }
    }

    public isConnected(): boolean {
        return this.socket?.connected ?? false;
    }

    public getSocket(): Socket | null {
        return this.socket;
    }
}

// Singleton instance
export const websocketService = new WebSocketService();

