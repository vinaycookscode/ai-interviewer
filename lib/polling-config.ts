/**
 * Centralized polling interval configuration
 * All intervals are in milliseconds
 */

export const POLLING_INTERVALS = {
    /**
     * Feature flag updates check interval
     * Feature flags rarely change, so 1 minute is sufficient
     */
    FEATURE_FLAGS: 60_000, // 1 minute

    /**
     * Dashboard data refresh interval
     * Balance between fresh data and performance
     */
    DASHBOARD_REFRESH: 30_000, // 30 seconds

    /**
     * Gemini AI model availability status check
     * Model status changes infrequently
     */
    MODEL_STATUS: 60_000, // 1 minute
} as const;

export type PollingInterval = keyof typeof POLLING_INTERVALS;
