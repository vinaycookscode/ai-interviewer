import { useEffect, useRef } from 'react';

/**
 * Custom hook for visibility-aware polling
 * Pauses polling when the browser tab is hidden to save resources
 * 
 * @param callback - Function to call on each interval
 * @param interval - Polling interval in milliseconds
 * @param enabled - Whether polling is enabled (default: true)
 */
export function useVisibilityPolling(
    callback: () => void | Promise<void>,
    interval: number,
    enabled: boolean = true
) {
    const savedCallback = useRef(callback);

    // Update ref when callback changes
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    useEffect(() => {
        if (!enabled) return;

        // Don't start polling if tab is initially hidden
        if (document.hidden) return;

        const tick = async () => {
            // Only execute if tab is visible
            if (!document.hidden) {
                await savedCallback.current();
            }
        };

        // Initial call
        tick();

        // Set up interval
        const timerId = setInterval(tick, interval);

        // Cleanup
        return () => clearInterval(timerId);
    }, [interval, enabled]);
}
