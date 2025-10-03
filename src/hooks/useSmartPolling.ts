import { useEffect, useRef, useCallback } from 'react';

export interface UseSmartPollingOptions {
    enabled?: boolean;
    interval?: number;
    maxInterval?: number;
    backoffMultiplier?: number;
    onError?: (error: any) => void;
    onSuccess?: () => void;
    onVisibilityChange?: (isVisible: boolean) => void;
}

export interface UseSmartPollingReturn {
    startPolling: () => void;
    stopPolling: () => void;
    isPolling: boolean;
    currentInterval: number;
    refreshNow: () => Promise<void>;
}

export function useSmartPolling(
    callback: () => Promise<void>,
    options: UseSmartPollingOptions = {}
): UseSmartPollingReturn {
    const {
        enabled = true,
        interval = 12000, // Start with 12 seconds (reduced from 3s)
        maxInterval = 60000, // Max 60 seconds (increased for better backoff)
        backoffMultiplier = 1.5,
        onError,
        onSuccess,
        onVisibilityChange
    } = options;

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const currentIntervalRef = useRef(interval);
    const isPollingRef = useRef(false);
    const errorCountRef = useRef(0);
    const isVisibleRef = useRef(!document.hidden);

    const executeCallback = useCallback(async () => {
        try {
            await callback();
            errorCountRef.current = 0;
            // Reset interval on success
            currentIntervalRef.current = interval;
            onSuccess?.();
        } catch (error) {
            errorCountRef.current++;
            onError?.(error);

            // Exponential backoff on error
            currentIntervalRef.current = Math.min(
                currentIntervalRef.current * backoffMultiplier,
                maxInterval
            );
        }
    }, [callback, onError, onSuccess, interval, backoffMultiplier, maxInterval]);

    const startPolling = useCallback(() => {
        if (isPollingRef.current || !enabled || !isVisibleRef.current) {
            return;
        }

        isPollingRef.current = true;

        const poll = () => {
            if (!isPollingRef.current) return;

            executeCallback();

            if (isPollingRef.current) {
                intervalRef.current = setTimeout(poll, currentIntervalRef.current);
            }
        };

        // Start immediately
        executeCallback();

        // Then start polling
        intervalRef.current = setTimeout(poll, currentIntervalRef.current);
    }, [enabled, executeCallback]);

    const stopPolling = useCallback(() => {
        isPollingRef.current = false;
        if (intervalRef.current) {
            clearTimeout(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const refreshNow = useCallback(async () => {
        await executeCallback();
    }, [executeCallback]);

    // Handle visibility changes
    useEffect(() => {
        const handleVisibilityChange = () => {
            const isVisible = !document.hidden;

            if (isVisible !== isVisibleRef.current) {
                isVisibleRef.current = isVisible;
                onVisibilityChange?.(isVisible);

                if (isVisible && enabled) {
                    // Resume polling when visible with normal interval
                    currentIntervalRef.current = interval; // Reset interval
                    startPolling();
                } else {
                    // Continue polling when hidden but with longer interval (30s)
                    if (isPollingRef.current) {
                        currentIntervalRef.current = Math.max(interval * 2.5, 30000); // At least 30s when hidden
                    }
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [enabled, interval, startPolling, stopPolling, onVisibilityChange]);

    // Auto-start/stop based on enabled state
    useEffect(() => {
        if (enabled && isVisibleRef.current) {
            startPolling();
        } else {
            stopPolling();
        }

        return stopPolling;
    }, [enabled, startPolling, stopPolling]);

    return {
        startPolling,
        stopPolling,
        isPolling: isPollingRef.current,
        currentInterval: currentIntervalRef.current,
        refreshNow
    };
}
