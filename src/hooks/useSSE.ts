import { useEffect, useRef, useState } from 'react';
import { sseService } from '../services/sse';
import type { SSEEventHandlers, SSEEventUpdate } from '../services/sse';

export interface UseSSEOptions {
    eventId: string | null;
    onUpdate?: (data: SSEEventUpdate) => void;
    onError?: (data: SSEEventUpdate) => void;
    enabled?: boolean;
}

export interface UseSSEReturn {
    isConnected: boolean;
    connectionState: number | null;
    lastUpdate: SSEEventUpdate | null;
    error: string | null;
    connect: () => void;
    disconnect: () => void;
}

export function useSSE(options: UseSSEOptions): UseSSEReturn {
    const { eventId, onUpdate, onError, enabled = true } = options;
    const [isConnected, setIsConnected] = useState(false);
    const [connectionState, setConnectionState] = useState<number | null>(null);
    const [lastUpdate, setLastUpdate] = useState<SSEEventUpdate | null>(null);
    const [error, setError] = useState<string | null>(null);
    const handlersRef = useRef<SSEEventHandlers>({});

    // Update handlers when they change
    useEffect(() => {
        handlersRef.current = {
            onConnected: (data) => {
                setIsConnected(true);
                setError(null);
                console.log('SSE connected:', data);
            },
            onUpdate: (data) => {
                setLastUpdate(data);
                setError(null);
                onUpdate?.(data);
            },
            onError: (data) => {
                setError(data.message || 'SSE error occurred');
                setIsConnected(false);
                onError?.(data);
            },
            onClose: () => {
                setIsConnected(false);
                console.log('SSE connection closed');
            }
        };
    }, [onUpdate, onError]);

    const connect = () => {
        if (eventId && enabled) {
            sseService.connect(eventId, handlersRef.current);
        }
    };

    const disconnect = () => {
        sseService.disconnect();
        setIsConnected(false);
        setConnectionState(null);
        setError(null);
    };

    // Auto-connect when eventId changes
    useEffect(() => {
        if (eventId && enabled) {
            connect();
        } else {
            disconnect();
        }

        return () => {
            disconnect();
        };
    }, [eventId, enabled]);

    // Update connection state
    useEffect(() => {
        const interval = setInterval(() => {
            const state = sseService.getConnectionState();
            setConnectionState(state);
            setIsConnected(state === EventSource.OPEN);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return {
        isConnected,
        connectionState,
        lastUpdate,
        error,
        connect,
        disconnect
    };
}
