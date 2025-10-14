import { useEffect, useState, useCallback } from 'react';
import { websocketService } from '../services/websocket';

export interface WebSocketStatus {
    connected: boolean;
    socketId?: string;
    error?: string;
}

export interface UseWebSocketOptions {
    eventId?: string;
    onEventUpdate?: (data: any) => void;
    onPlayerJoined?: (data: any) => void;
    onPlayerLeft?: (data: any) => void;
    onPlayerReady?: (data: any) => void;
    onScoreSubmitted?: (data: any) => void;
    onGuessSubmitted?: (data: any) => void;
    onWineChanged?: (data: any) => void;
    onEventStarted?: (data: any) => void;
    onConnectionStatusChange?: (status: WebSocketStatus) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
    const {
        eventId,
        onEventUpdate,
        onPlayerJoined,
        onPlayerLeft,
        onPlayerReady,
        onScoreSubmitted,
        onGuessSubmitted,
        onWineChanged,
        onEventStarted,
        onConnectionStatusChange,
    } = options;

    const [status, setStatus] = useState<WebSocketStatus>({
        connected: websocketService.isConnected(),
    });

    // Handle connection status changes
    useEffect(() => {
        const handleConnectionStatus = (data: { connected: boolean; id?: string; reason?: string }) => {
            const newStatus: WebSocketStatus = {
                connected: data.connected,
                socketId: data.id,
                error: data.reason,
            };
            setStatus(newStatus);
            onConnectionStatusChange?.(newStatus);
        };

        const handleConnectionError = (data: { error: string; attempts: number }) => {
            const newStatus: WebSocketStatus = {
                connected: false,
                error: data.error,
            };
            setStatus(newStatus);
            onConnectionStatusChange?.(newStatus);
        };

        websocketService.on('connection-status', handleConnectionStatus);
        websocketService.on('connection-error', handleConnectionError);

        return () => {
            websocketService.off('connection-status', handleConnectionStatus);
            websocketService.off('connection-error', handleConnectionError);
        };
    }, [onConnectionStatusChange]);

    // Join/leave event room
    useEffect(() => {
        if (eventId) {
            websocketService.joinEvent(eventId);

            return () => {
                websocketService.leaveEvent(eventId);
            };
        }
    }, [eventId]);

    // Set up event listeners
    useEffect(() => {
        if (onEventUpdate) {
            websocketService.on('event-update', onEventUpdate);
        }
        if (onPlayerJoined) {
            websocketService.on('player-joined', onPlayerJoined);
        }
        if (onPlayerLeft) {
            websocketService.on('player-left', onPlayerLeft);
        }
        if (onPlayerReady) {
            websocketService.on('player-ready', onPlayerReady);
        }
        if (onScoreSubmitted) {
            websocketService.on('score-submitted', onScoreSubmitted);
        }
        if (onGuessSubmitted) {
            websocketService.on('guess-submitted', onGuessSubmitted);
        }
        if (onWineChanged) {
            websocketService.on('wine-changed', onWineChanged);
        }
        if (onEventStarted) {
            websocketService.on('event-started', onEventStarted);
        }

        return () => {
            if (onEventUpdate) {
                websocketService.off('event-update', onEventUpdate);
            }
            if (onPlayerJoined) {
                websocketService.off('player-joined', onPlayerJoined);
            }
            if (onPlayerLeft) {
                websocketService.off('player-left', onPlayerLeft);
            }
            if (onPlayerReady) {
                websocketService.off('player-ready', onPlayerReady);
            }
            if (onScoreSubmitted) {
                websocketService.off('score-submitted', onScoreSubmitted);
            }
            if (onGuessSubmitted) {
                websocketService.off('guess-submitted', onGuessSubmitted);
            }
            if (onWineChanged) {
                websocketService.off('wine-changed', onWineChanged);
            }
            if (onEventStarted) {
                websocketService.off('event-started', onEventStarted);
            }
        };
    }, [
        onEventUpdate,
        onPlayerJoined,
        onPlayerLeft,
        onPlayerReady,
        onScoreSubmitted,
        onGuessSubmitted,
        onWineChanged,
        onEventStarted,
    ]);

    const reconnect = useCallback(() => {
        websocketService.disconnect();
        // The service will automatically reconnect
    }, []);

    return {
        status,
        isConnected: status.connected,
        reconnect,
    };
}

